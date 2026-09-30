"""HTTPException ``detail`` 문자열 (클라이언트 계약 유지)."""

HTTP_400_INVOKE_REQUIRES_QUESTION_OR_TEXT = (
    "question 또는 conversation_text 중 하나는 필수입니다."
)
HTTP_400_SUMMARY_TEXT_EMPTY = "conversation_text is empty"

# 500 응답: 내부 원인은 로그에만 남기고 클라이언트에는 고정 문구만 전달한다.
HTTP_500_GRAPH_INVOKE = "graph invoke failed"
