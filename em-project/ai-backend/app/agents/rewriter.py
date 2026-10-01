"""
Rewriter Node.

같은 채팅방의 후속 질문("그거 얼마나 자주 해야 돼?")을 이전 대화를 참고해
앞의 대화 없이도 이해되는 질문으로 다시 쓴다. 이후 Router·Retriever·Answerer는
바뀐 ``question``을 그대로 쓴다. (Spring은 사용자가 입력한 원문을 따로 저장한다.)

LLM을 부르지 않고 그대로 통과하는 경우:

* 이전 대화(``messages``)가 없을 때 — 방의 첫 질문
* ``intent_hint``가 있을 때 — 요약 등 경로가 이미 정해진 요청
* Router 규칙이 smalltalk로 보는 인사·감사 — 다시 쓰다 매뉴얼 단어가 섞이면
  Router가 manual_qa로 오분류해 검색이 돌고 이전 주제의 이미지가 붙는다
"""

from __future__ import annotations

import logging
from typing import Any

from app.agents.llms import answer_llm, llm_text
from app.agents.router import _rule_intent
from app.agents.state import AgentState
from app.agents.utils import format_history, preview_for_log

logger = logging.getLogger(__name__)

_REWRITE_TEMPLATE = """[이전 대화]를 참고해 [새 질문]을 앞의 대화 없이도 이해되는 질문 하나로 다시 써라.
- "그거", "그건", "이거" 같은 말은 이전 대화에서 가리키는 대상으로 바꿔라.
- 새 질문이 이미 그 자체로 이해되면 그대로 출력하라.
- 질문에 답하지 말고, 다시 쓴 질문 한 문장만 출력하라.

[이전 대화]
{history}

[새 질문]
{question}"""


def rewriter_node(state: AgentState) -> dict[str, Any]:
    """후속 질문이면 이전 대화를 참고해 단독 질문으로 바꾼다."""

    question = state.get("question") or ""
    messages = state.get("messages") or []

    if (
        state.get("intent_hint")
        or not messages
        or not question.strip()
        or _rule_intent(question) == "smalltalk"
    ):
        logger.info(
            "[rewriter] 통과 history=%d question=%r",
            len(messages),
            preview_for_log(question),
        )
        return {"question": question}

    prompt = _REWRITE_TEMPLATE.format(
        history=format_history(messages),
        question=question,
    )
    rewritten = llm_text(answer_llm.invoke(prompt)).strip()
    llm_calls = state.get("llm_calls", 0) + 1

    if not rewritten:
        logger.info("[rewriter] 빈 결과 → 원래 질문 사용 question=%r", preview_for_log(question))
        return {"question": question, "llm_calls": llm_calls}

    logger.info(
        "[rewriter] 다시 씀 %r -> %r",
        preview_for_log(question),
        preview_for_log(rewritten),
    )
    return {"question": rewritten, "llm_calls": llm_calls}
