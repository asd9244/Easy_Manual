"""
LangGraph 워크플로에서 모든 노드가 공유하는 상태(State) 정의.

TypedDict 기반이라 런타임 오버헤드가 거의 없고, LangGraph가 노드 리턴값을
자동으로 shallow-merge 해 준다. ``messages`` 필드는 ``add_messages`` reducer를
써서 체크포인터가 복원할 때도 자연스럽게 누적되도록 했다.
"""

from __future__ import annotations

from typing import Annotated, Any, Literal, Optional, TypedDict

from langgraph.graph.message import add_messages


Intent = Literal["smalltalk", "manual_qa", "summary", "unknown"]


class AgentState(TypedDict, total=False):
    # ── 입력 ──────────────────────────────────────────────────────────
    manual_id: Optional[str]
    question: str
    conversation_text: Optional[str]
    intent_hint: Optional[str]
    room_id: Optional[str]

    # ── Router 산출 ──────────────────────────────────────────────────
    intent: Intent
    router_reason: Optional[str]
    router_used_llm: bool

    # ── Retriever 산출 ───────────────────────────────────────────────
    retrieved_records: list[dict[str, Any]]
    toc_section: str
    combined_text: str
    manual_image_urls: list[str]
    found_page: Optional[int]

    # ── 최종 응답 ────────────────────────────────────────────────────
    final_answer: str

    # ── 관측/디버그 ──────────────────────────────────────────────────
    neo4j_queries: int
    llm_calls: int

    # ── 멀티턴 체크포인트 ─────────────────────────────────────────────
    # LangGraph의 add_messages reducer가 HumanMessage/AIMessage를 자동 누적해 준다.
    messages: Annotated[list[Any], add_messages]


def empty_state() -> AgentState:
    """테스트에서 기본 state를 찍어낼 때 쓰는 편의 함수."""

    return AgentState(  # type: ignore[typeddict-item]
        manual_id=None,
        question="",
        conversation_text=None,
        intent_hint=None,
        room_id=None,
        intent="unknown",
        router_reason=None,
        router_used_llm=False,
        retrieved_records=[],
        toc_section="",
        combined_text="",
        manual_image_urls=[],
        found_page=None,
        final_answer="",
        neo4j_queries=0,
        llm_calls=0,
        messages=[],
    )
