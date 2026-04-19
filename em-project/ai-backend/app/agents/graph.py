"""
LangGraph StateGraph 조립 + 체크포인트 연결.

그래프 구조:

    START -> router -> ...

체크포인트는 다음 우선순위로 선택한다.

1. ``POSTGRES_CHECKPOINT_URL`` 이 설정되어 있고 연결에 성공하면 ``PostgresSaver`` 사용.
2. 실패하거나 값이 비어 있으면 ``MemorySaver`` 로 폴백하고 경고 로그만 남긴다.

이 구조 덕분에 Docker 없이 로컬 개발 중에도 멀티턴 대화 맥락을 메모리상으로
유지할 수 있고, 프로덕션에서는 Postgres에 영구 저장된다.
"""

from __future__ import annotations

import logging
import os
from typing import Any

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph

from app.agents.answerer import answerer_node
from app.agents.fallback import fallback_node
from app.agents.retriever import retriever_node
from app.agents.router import (
    router_node,
    select_post_retriever,
    select_post_router,
)
from app.agents.state import AgentState
from app.agents.summarizer import summarizer_node


logger = logging.getLogger(__name__)


_compiled_graph: Any | None = None


def _build_checkpointer():
    """
    PostgresSaver를 우선 시도하고 실패하면 MemorySaver로 폴백한다.

    PostgresSaver는 ``setup()``을 한 번 호출해야 스키마(`checkpoints` 등
    테이블)가 생성된다. 이미 존재하면 no-op이므로 매번 호출해도 안전하다.
    """

    url = os.getenv("POSTGRES_CHECKPOINT_URL", "").strip()
    if not url:
        logger.info(
            "POSTGRES_CHECKPOINT_URL 미설정 → MemorySaver로 체크포인트를 운영합니다."
        )
        return MemorySaver()

    try:
        from langgraph.checkpoint.postgres import PostgresSaver  # type: ignore

        # PostgresSaver.from_conn_string은 context manager를 반환한다 (최신 API).
        # 앱 전체 수명 동안 살아 있어야 하므로 __enter__를 직접 호출해 핸들을 보유한다.
        ctx = PostgresSaver.from_conn_string(url)
        saver = ctx.__enter__()
        saver.setup()
        logger.info("PostgresSaver 초기화 완료 (%s)", _mask_url(url))
        return saver
    except Exception as exc:  # pragma: no cover - 환경 의존
        logger.warning(
            "PostgresSaver 초기화 실패(%s), MemorySaver로 폴백합니다.", exc
        )
        return MemorySaver()


def _mask_url(url: str) -> str:
    """로그에 비밀번호를 그대로 찍지 않도록 마스킹."""

    if "@" not in url:
        return url
    prefix, rest = url.split("@", 1)
    if ":" in prefix.split("//", 1)[-1]:
        scheme, creds = prefix.split("//", 1)
        user = creds.split(":", 1)[0]
        return f"{scheme}//{user}:***@{rest}"
    return url


def build_graph():
    """StateGraph를 구성하고 체크포인터와 함께 컴파일한다."""

    workflow = StateGraph(AgentState)

    workflow.add_node("router", router_node)
    workflow.add_node("retriever", retriever_node)
    workflow.add_node("answerer", answerer_node)
    workflow.add_node("summarizer", summarizer_node)
    workflow.add_node("fallback", fallback_node)

    workflow.set_entry_point("router")

    workflow.add_conditional_edges(
        "router",
        select_post_router,
        {
            "retriever": "retriever",
            "summarizer": "summarizer",
            "answerer": "answerer",
        },
    )

    workflow.add_conditional_edges(
        "retriever",
        select_post_retriever,
        {
            "answerer": "answerer",
            "fallback": "fallback",
        },
    )

    workflow.add_edge("answerer", END)
    workflow.add_edge("summarizer", END)
    workflow.add_edge("fallback", END)

    checkpointer = _build_checkpointer()
    return workflow.compile(checkpointer=checkpointer)


def get_graph():
    """앱 수명 동안 하나의 컴파일된 그래프를 재사용한다."""

    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph
