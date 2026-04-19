"""
Router Node.

모든 요청의 첫 관문. 목적은 **LLM을 가능한 한 호출하지 않고** intent를
분류해 응답 속도와 Ollama 부하를 줄이는 것이다.

3단 필터:

1. ``intent_hint``가 있으면 그대로 신뢰 (Spring이 /ask/, /summarize로 들어온
   경로를 힌트로 전달할 때 사용).
2. 규칙 기반: 짧은 인사 키워드·강한 매뉴얼 키워드로 smalltalk/manual_qa 즉시 결정.
3. 그래도 애매하면 ``router_llm``으로 ``with_structured_output`` 분류 1회.

LLM이 실패하더라도 안전하게 ``manual_qa``로 폴백해 기존 동작을 깨지 않는다.
"""

from __future__ import annotations

import logging
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.agents.llms import router_llm
from app.agents.state import AgentState
from app.agents.utils import preview_for_log


logger = logging.getLogger(__name__)


def _next_node_after_router(intent: str) -> str:
    if intent == "manual_qa":
        return "retriever"
    if intent == "summary":
        return "summarizer"
    return "answerer"


def _return_router_out(out: dict[str, Any]) -> dict[str, Any]:
    """분기 완료 로그를 남기고 router 산출물을 그대로 반환한다."""

    intent = out["intent"]
    logger.info(
        "[router] 분기 완료 intent=%s reason=%s next=%s",
        intent,
        out["router_reason"],
        _next_node_after_router(intent),
    )
    return out


GREETING_KEYWORDS = (
    "안녕", "반가", "하이", "hi", "hello", "헬로", "좋은아침", "좋은 아침",
    "좋은저녁", "좋은 저녁", "감사", "고마워", "고맙", "수고", "잘 지내",
    "잘지내", "반갑",
)

# 요약 경로는 intent_hint="summary" 또는 conversation_text-only로 처리한다.

# 규칙 분기용 "강한" 키워드만 둔다. 넓은 단어(방법·어떻게·연결 등)는 부분 매칭 오탐이
# 많아 LLM 분류로 넘긴다.
MANUAL_KEYWORDS = (
    "에러", "오류", "고장", "안 돼", "안돼", "안켜", "안 켜", "작동", "동작",
    "사용법", "설정", "메뉴얼", "매뉴얼", "필터", "청소",
    "분리", "재설치", "점검", "코드", "증상", "소음", "온도", "습도", "냉각",
    "세탁", "건조", "전원", "리셋", "재시작", "와이파이", "wifi",
)


class _IntentSchema(BaseModel):
    intent: Literal["smalltalk", "manual_qa"] = Field(
        description=(
            "분류 결과. 인사·감사·잡담이면 smalltalk, 제품 사용/고장/설정 관련이면 manual_qa"
        )
    )


def _classify_via_llm(question: str) -> tuple[str, str]:
    """Router 전용 LLM으로 1회 분류.

    예외 시 manual_qa로 폴백: 매뉴얼 질문 누락보다 잡담 오분류가 서비스에 덜 치명적이지
    않다는 가정(기존 동작 유지).
    """

    prompt = f"""전자제품 매뉴얼 Q&A 서비스(픽시)에 온 사용자 메시지를 분류하라.

- smalltalk: 인사, 감사, 일상 잡담, 농담, 챗봇에게 하는 말, 제품과 무관한 대화
- manual_qa: 가전 제품 사용·고장·설정·청소·에러코드·Wi‑Fi 등 매뉴얼 검색이 필요한 질문

경계:
- 제품 없이 하는 일상 질문(예: 식사 여부, 날씨 잡담) → smalltalk
- 기기가 안 켜진다, 필터 청소, 에러 코드 → manual_qa

예시:
- "안녕" → smalltalk
- "밥 먹었니?" → smalltalk
- "세탁기가 안 돼요" → manual_qa
- "필터는 어디 있어?" → manual_qa

[메시지]
{question}"""

    try:
        classifier = router_llm.with_structured_output(_IntentSchema)
        parsed: _IntentSchema = classifier.invoke(prompt)  # type: ignore[assignment]
        return parsed.intent, "llm-classified"
    except Exception as exc:  # pragma: no cover - 모델 부재 시 방어
        logger.warning("Router LLM 분류 실패, manual_qa로 폴백: %s", exc)
        return "manual_qa", f"llm-failed:{type(exc).__name__}"


def _rule_intent(question: str) -> str | None:
    """규칙 기반 분기. 판단 불가면 None."""

    q = question.strip().lower()
    if not q:
        return "smalltalk"

    # 1) 짧고 인사 키워드가 포함되면 smalltalk
    if len(q) <= 12 and any(k in q for k in GREETING_KEYWORDS):
        return "smalltalk"

    # 2) 강한 매뉴얼 키워드가 나타나면 manual_qa 확정 (애매한 문장은 LLM으로)
    if any(k in q for k in MANUAL_KEYWORDS):
        return "manual_qa"

    return None


def router_node(state: AgentState) -> dict[str, Any]:
    """
    intent를 정해 state에 써 넣는다. 이후 조건부 엣지가 이 값을 읽고 다음
    노드를 고른다.
    """

    hint = state.get("intent_hint")
    question = state.get("question") or ""
    manual_id = state.get("manual_id")

    logger.info(
        "[router] 요청 수신 hint=%r manual_id=%r question=%r",
        hint,
        manual_id,
        preview_for_log(question),
    )

    if hint in {"summary", "manual_qa", "smalltalk"}:
        return _return_router_out(
            {
                "intent": hint,
                "router_reason": "intent_hint",
                "router_used_llm": False,
            }
        )

    if state.get("conversation_text") and hint is None:
        # conversation_text만 있고 question이 비어 있으면 요약 경로로 간주
        if not question.strip():
            return _return_router_out(
                {
                    "intent": "summary",
                    "router_reason": "conversation_text-only",
                    "router_used_llm": False,
                }
            )

    rule_intent = _rule_intent(question)
    if rule_intent is not None:
        return _return_router_out(
            {
                "intent": rule_intent,
                "router_reason": "rule-based",
                "router_used_llm": False,
            }
        )

    # 3단: LLM 분류 (manual_id가 없으면 LLM을 태워도 결국 검색이 실패하므로
    # smalltalk로 단락)
    if not manual_id:
        return _return_router_out(
            {
                "intent": "smalltalk",
                "router_reason": "no-manual-id",
                "router_used_llm": False,
            }
        )

    intent, reason = _classify_via_llm(question)
    return _return_router_out(
        {
            "intent": intent,
            "router_reason": reason,
            "router_used_llm": True,
            "llm_calls": state.get("llm_calls", 0) + 1,
        }
    )


def select_post_router(state: AgentState) -> str:
    """Router 직후 분기: intent 값에 따라 다음 노드를 고른다."""

    intent = state.get("intent", "smalltalk")
    return _next_node_after_router(intent)


def select_post_retriever(state: AgentState) -> str:
    """Retriever 직후 분기: 결과 유무에 따라 answerer/fallback 분기."""

    return "answerer" if state.get("retrieved_records") else "fallback"
