"""Rewriter가 LLM 없이 그대로 통과시키는 경우 회귀."""

import pytest
from langchain_core.messages import AIMessage, HumanMessage

from app.agents import rewriter


class _MustNotCall:
    def invoke(self, prompt):
        raise AssertionError("이 경우에는 LLM을 부르면 안 된다")


@pytest.fixture(autouse=True)
def _no_llm(monkeypatch):
    monkeypatch.setattr(rewriter, "answer_llm", _MustNotCall())


_HISTORY = [
    HumanMessage(content="필터 청소는 어떻게 해?"),
    AIMessage(content="필터를 분리해 물로 세척하세요."),
]


def test_first_question_in_room_passes_through():
    out = rewriter.rewriter_node({"question": "필터 청소는 어떻게 해?", "messages": []})
    assert out["question"] == "필터 청소는 어떻게 해?"


def test_greeting_passes_through_even_with_history():
    out = rewriter.rewriter_node({"question": "고마워", "messages": _HISTORY})
    assert out["question"] == "고마워"
