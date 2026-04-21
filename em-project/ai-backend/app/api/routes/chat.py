"""
Chat API 엔드포인트.

내부 구현은 LangGraph Multi-Agent(``app.agents``)에 위임한다. 하위 호환을 위해
기존 ``/ask``·``/summarize`` 계약을 유지하되, 모두 동일한 컴파일된 그래프
(``get_graph``)를 호출한다.

- ``POST /ask``: ``manual_id``·``question`` 등을 넣고 ``intent_hint``는 넣지
  않아 라우터가 intent를 정한다.
- ``POST /summarize``: ``conversation_text``와 ``intent_hint="summary"``로
  요약 노드로 보낸다.
- ``POST /invoke``: 선택적으로 ``intent_hint``·``room_id``를 받는 통합 계약.

정식 엔드포인트는 ``POST /api/chat/invoke`` 로, 향후 Spring에서 단일 API로
통합할 때 사용한다.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, Optional

import app.config.bootstrap  # noqa: F401 — retriever/Neo4j import 전에 .env 로드

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.agents import get_graph
from app.api.http_constants import (
    HTTP_400_INVOKE_REQUIRES_QUESTION_OR_TEXT,
    HTTP_400_SUMMARY_TEXT_EMPTY,
    HTTP_500_GRAPH_INVOKE,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ──────────────────────────────────────────────────────────────────────
# Request / Response 스키마
# ──────────────────────────────────────────────────────────────────────


class ChatRequest(BaseModel):
    """기존 /ask 계약."""

    manual_id: str
    question: str


class SummarizeRequest(BaseModel):
    """기존 /summarize 계약. 이미지·URL 본문 미포함."""

    conversation_text: str = Field(..., min_length=1)


class InvokeRequest(BaseModel):
    """
    정식 통합 엔드포인트 계약. intent_hint를 명시하면 Router LLM을 건너뛴다.
    room_id가 들어오면 체크포인트 thread_id로 사용해 멀티턴 대화가 복원된다.
    """

    manual_id: Optional[str] = None
    question: Optional[str] = None
    conversation_text: Optional[str] = None
    intent_hint: Optional[str] = Field(
        default=None,
        description='"manual_qa" | "summary" | "smalltalk" 중 하나. 생략 가능.',
    )
    room_id: Optional[str] = None


# ──────────────────────────────────────────────────────────────────────
# 그래프 호출 유틸
# ──────────────────────────────────────────────────────────────────────


def _invoke_graph(state_input: dict[str, Any], thread_id: str) -> dict[str, Any]:
    """
    컴파일된 그래프를 실행하고 결과 state 딕셔너리를 반환한다.

    예외 시: 전체 스택은 ``logger.exception``으로만 남기고, 클라이언트에는
    고정 ``detail``만 전달한다 (내부 메시지 노출 방지).
    """

    graph = get_graph()
    config = {"configurable": {"thread_id": thread_id}}
    try:
        result = graph.invoke(state_input, config=config)
    except Exception as exc:
        logger.exception("LangGraph invoke 실패: %s", exc)
        raise HTTPException(status_code=500, detail=HTTP_500_GRAPH_INVOKE) from exc
    return dict(result)


def _thread_id_for(request: InvokeRequest | ChatRequest | SummarizeRequest) -> str:
    """room_id가 있으면 room-{id}, 없으면 매 호출 새 UUID."""

    room_id = getattr(request, "room_id", None)
    if room_id:
        return f"room-{room_id}"
    # 과거엔 stateless 공용 문자열을 썼지만, 그러면 체크포인트가 이전 호출의
    # state(llm_calls 카운터 등)를 복원해 카운터가 누적되는 버그가 생겼다.
    # 매 호출마다 새 UUID를 발급해 요청간 독립성을 보장한다.
    return f"oneshot-{uuid.uuid4()}"


# ──────────────────────────────────────────────────────────────────────
# 정식 통합 엔드포인트
# ──────────────────────────────────────────────────────────────────────


@router.post("/invoke")
def invoke(request: InvokeRequest):
    """
    Router → (Retriever) → Answerer/Summarizer/Fallback 경로를 하나의 호출로 수행.

    응답은 기존 /ask 스키마를 확장한 super-set이다. 호출 측은 ``intent`` 값으로
    후처리 방식을 선택할 수 있다.
    """

    if not request.question and not request.conversation_text:
        raise HTTPException(
            status_code=400,
            detail=HTTP_400_INVOKE_REQUIRES_QUESTION_OR_TEXT,
        )

    state_input: dict[str, Any] = {
        "manual_id": request.manual_id,
        "question": request.question or "",
        "conversation_text": request.conversation_text,
        "intent_hint": request.intent_hint,
        "room_id": request.room_id,
    }

    final_state = _invoke_graph(state_input, _thread_id_for(request))

    return {
        "intent": final_state.get("intent", "unknown"),
        "router_reason": final_state.get("router_reason"),
        "router_used_llm": final_state.get("router_used_llm", False),
        "manual_id": request.manual_id,
        "question": request.question,
        "ai_answer": final_state.get("final_answer", ""),
        "summary": final_state.get("final_answer", "")
        if final_state.get("intent") == "summary"
        else None,
        "found_page": final_state.get("found_page"),
        "manual_image_urls": final_state.get("manual_image_urls", []) or [],
        "neo4j_queries": final_state.get("neo4j_queries", 0),
        "llm_calls": final_state.get("llm_calls", 0),
    }


# ──────────────────────────────────────────────────────────────────────
# 하위 호환 엔드포인트 — 동일한 그래프를 호출하는 얇은 래퍼
# ──────────────────────────────────────────────────────────────────────


@router.post("/ask")
def ask_manual(request: ChatRequest):
    """Spring이 호출하는 기존 엔드포인트. 응답 스키마를 정확히 유지한다."""

    # intent_hint 미설정 → 라우터가 smalltalk / manual_qa 등 분류
    state_input = {
        "manual_id": request.manual_id,
        "question": request.question,
    }
    final_state = _invoke_graph(state_input, _thread_id_for(request))

    return {
        "manual_id": request.manual_id,
        "question": request.question,
        "found_page": final_state.get("found_page"),
        "ai_answer": final_state.get("final_answer", ""),
        "manual_image_urls": final_state.get("manual_image_urls", []) or [],
    }


@router.post("/summarize")
def summarize_conversation(request: SummarizeRequest):
    """Spring이 호출하는 기존 요약 엔드포인트. 응답은 {"summary": str}."""

    text = request.conversation_text.strip()
    if not text:
        raise HTTPException(status_code=400, detail=HTTP_400_SUMMARY_TEXT_EMPTY)

    state_input = {
        "question": "",
        "conversation_text": text,
        "intent_hint": "summary",
    }
    final_state = _invoke_graph(state_input, _thread_id_for(request))

    summary = final_state.get("final_answer") or ""
    if not summary:
        summary = "요약을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요."
    return {"summary": summary}
