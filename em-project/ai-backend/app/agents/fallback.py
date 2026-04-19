"""
Fallback Node.

원본 ``app/api/routes/chat.py``에서 Neo4j 검색 결과가 0건일 때 LLM을 돌리지
않고 돌려주던 안내 메시지를 그대로 노드화했다. LLM 호출이 없어 응답 즉시
반환되는 대신, 멀티턴 로그엔 "검색 실패" 사실이 남도록 messages에 AIMessage
를 함께 덧붙인다.
"""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage

from app.agents.state import AgentState
from app.agents.utils import preview_for_log

logger = logging.getLogger(__name__)


_FALLBACK_MESSAGE = (
    "죄송합니다. 현재 등록된 매뉴얼에서 질문하신 내용과 관련된 정보를 찾지 못했습니다.\n\n"
    "정확하지 않은 답변을 드리는 것보다는, 확인된 정보만 안내해 드리는 것이 맞다고 판단하여 "
    "답변을 보류하게 되었습니다.\n\n"
    "혹시 다른 표현으로 다시 질문해 주시면, 더 정확한 안내를 도와드릴 수 있습니다."
    "그래도 해결이 어려우시면 제조사 고객센터에 문의해 주시는 것을 권장드립니다."
)


def fallback_node(state: AgentState) -> dict[str, Any]:
    """Retriever가 결과를 찾지 못했을 때의 고정 응답."""

    question = state.get("question") or ""

    logger.info(
        "[fallback] 요청 수신 (검색 결과 없음) question=%r",
        preview_for_log(question),
    )

    logger.info(
        "[fallback] 완료 fixed_message_chars=%d",
        len(_FALLBACK_MESSAGE),
    )

    return {
        "final_answer": _FALLBACK_MESSAGE,
        "manual_image_urls": [],
        "found_page": None,
        "messages": [
            HumanMessage(content=question),
            AIMessage(content=_FALLBACK_MESSAGE),
        ],
    }
