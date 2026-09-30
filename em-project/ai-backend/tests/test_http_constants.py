"""HTTP 상수 문자열이 Spring/프론트 계약과 일치하는지 검증."""

from app.api import http_constants as hc


def test_invoke_400_message_unchanged():
    assert (
        hc.HTTP_400_INVOKE_REQUIRES_QUESTION_OR_TEXT
        == "question 또는 conversation_text 중 하나는 필수입니다."
    )


def test_summary_400_message_unchanged():
    assert hc.HTTP_400_SUMMARY_TEXT_EMPTY == "conversation_text is empty"


def test_graph_500_client_message():
    assert hc.HTTP_500_GRAPH_INVOKE == "graph invoke failed"
