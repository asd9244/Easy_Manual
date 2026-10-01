"""Answerer 프롬프트에 같은 채팅방의 이전 대화가 들어가는지 회귀."""

import pytest
from langchain_core.messages import AIMessage, HumanMessage

from app.agents import answerer


class _CapturePrompt:
    def __init__(self):
        self.prompts: list[str] = []

    def invoke(self, prompt):
        self.prompts.append(prompt)
        return AIMessage(content="ok")


@pytest.fixture
def llm(monkeypatch):
    capture = _CapturePrompt()
    monkeypatch.setattr(answerer, "answer_llm", capture)
    return capture


def _manual_qa_state(messages):
    return {
        "intent": "manual_qa",
        "question": "에어컨 필터 청소는 얼마나 자주 해야 해?",
        "toc_section": "[1] 필터 청소하기",
        "combined_text": "극세 필터 2주에 한 번 권장",
        "messages": messages,
    }


def test_previous_turns_are_in_prompt(llm):
    history = [
        HumanMessage(content="필터 청소는 어떻게 해?"),
        AIMessage(content="필터를 분리해 물로 세척하세요."),
    ]
    answerer.answerer_node(_manual_qa_state(history))
    prompt = llm.prompts[0]
    assert "사용자: 필터 청소는 어떻게 해?" in prompt
    assert "AI: 필터를 분리해 물로 세척하세요." in prompt


def test_first_turn_prompt_says_no_history(llm):
    answerer.answerer_node(_manual_qa_state([]))
    assert "[이전 대화]\n(없음)" in llm.prompts[0]
