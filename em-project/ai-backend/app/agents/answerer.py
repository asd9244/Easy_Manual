"""
Answerer Node.

두 가지 모드로 동작한다.

* ``intent == "manual_qa"``: Retriever가 채워 둔 TOC/combined_text를 근거로
  기존 ``chat.py``의 ``ask_manual`` 프롬프트와 동일하게 답변을 생성한다.
* ``intent == "smalltalk"``: Neo4j 컨텍스트 없이 짧은 일반 대화 응답을 생성한다.
  사용자가 매뉴얼 질문을 했을 때 넘어오는 경우 자연스럽게 대화 안내도 포함한다.

어느 쪽이든 LangGraph ``add_messages`` reducer에 맞게 HumanMessage/AIMessage를
리턴해 체크포인트에서 자동 누적되도록 한다.
"""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage

from app.agents.llms import answer_llm, llm_text
from app.agents.state import AgentState
from app.agents.utils import preview_for_log

logger = logging.getLogger(__name__)


_MANUAL_QA_TEMPLATE = """너는 전자제품 고객센터의 최고 권위자이자 전문 AI 비서야.

[핵심 규칙]
1. 반드시 아래 제공된 [매뉴얼 내용]만을 근거로 답변해. 없는 내용은 절대 추측하지 마.
2. 확실하지 않은 내용이 있으면, "죄송합니다. 현재 매뉴얼에서 해당 내용을 확인하지 못했습니다. 정확하지 않은 정보를 안내해 드리는 것보다 확인된 내용만 전달해 드리는 것이 맞다고 판단했습니다. 다른 표현으로 다시 질문해 주시거나, 제조사 고객센터에 문의해 주시면 더 정확한 안내를 받으실 수 있습니다." 라는 취지로 부드럽게 답해.
3. 답변할 때 참고한 섹션명이나 페이지 번호를 자연스럽게 언급해줘. (예: "[필터 청소하기] 섹션(p41~43)에 따르면...")
4. 한국어로 정확하고 친절하게 답변해.

[참고 섹션 목록]
{toc_section}

[매뉴얼 내용 (OCR + 사전 분석된 시각 정보)]
{combined_text}

[유저 질문]
{question}"""


_SMALLTALK_TEMPLATE = """너는 전자제품 매뉴얼 Q&A 서비스 '픽시'의 친절한 고객 응대 AI다.

사용자 메시지에 대해, 매뉴얼 검색 없이도 될 만한 짧은 일반 대화로 응답해라 (인사·잡담·가벼운 질문 등).
- 한국어로 한두 문장 정도로 자연스럽게 답해라.
- 제품 증상·설정·고장 안내는 하지 말고, 필요하면 가전 사용 질문은 제품명이나 증상을 말해 달라고 부드럽게 유도해라.
- 매뉴얼 내용을 지어내지 말 것.

[사용자 메시지]
{question}"""


def answerer_node(state: AgentState) -> dict[str, Any]:
    """Retriever 결과 또는 smalltalk 경로에 맞춰 LLM으로 최종 답변을 생성한다."""

    intent = state.get("intent", "unknown")
    question = state.get("question") or ""

    mode = "manual_qa" if intent == "manual_qa" else "smalltalk_or_other"
    logger.info(
        "[answerer] 요청 수신 mode=%s intent=%r question=%r",
        mode,
        intent,
        preview_for_log(question),
    )

    if intent == "manual_qa":
        prompt = _MANUAL_QA_TEMPLATE.format(
            toc_section=state.get("toc_section", ""),
            combined_text=state.get("combined_text", ""),
            question=question,
        )
    else:
        # smalltalk / unknown 폴백: Neo4j 컨텍스트 없이 짧은 응답
        prompt = _SMALLTALK_TEMPLATE.format(question=question)

    response = answer_llm.invoke(prompt)
    answer = llm_text(response).strip()

    if not answer:
        answer = (
            "죄송합니다. 답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요."
        )

    logger.info(
        "[answerer] 완료 mode=%s intent=%r answer_chars=%d",
        mode,
        intent,
        len(answer),
    )

    return {
        "final_answer": answer,
        "llm_calls": state.get("llm_calls", 0) + 1,
        "messages": [HumanMessage(content=question), AIMessage(content=answer)],
    }
