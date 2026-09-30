"""
Summarizer Node.

원본 ``app/api/routes/chat.py``의 ``summarize_conversation`` 프롬프트를 그대로
노드화했다. Spring이 DB에서 조립한 ``conversation_text``를 입력으로 받으며,
이미지/URL 본문은 포함하지 않는다(기존 계약 유지).
"""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.messages import AIMessage

from app.agents.llms import answer_llm, llm_text
from app.agents.state import AgentState
from app.agents.utils import truncate

logger = logging.getLogger(__name__)


_MAX_CONVERSATION_CHARS = 100_000


_SUMMARY_SYSTEM_PROMPT = """너는 전자제품 고객 상담 대화를 정리하는 요약 전문가다.

[출력 형식 — 반드시 준수, 마크다운·제목·번호·라벨 금지]
- 출력은 **오직 아래 패턴만** 사용한다. `###`, `**`, `-`, 번호 목록을 쓰지 않는다.
- USER 질문마다 **최대 3개**의 블록만 만든다. (USER 질문이 3개 미만이면 그 개수만큼만)
- **한 블록**의 구조는 다음과 같다:
  1) 첫 줄: 그 턴의 질문 내용을 **한 줄**로 짧게 (USER가 실제로 묻은 핵심)
  2) **빈 줄 하나** (줄바꿈만)
  3) 그 다음 줄부터: AI가 답한 내용을 **짧게 요약** (1~3문장, 한 덩어리로)
- 블록과 블록 사이에는 **빈 줄 하나**로 구분한다.

[출력 예시 — 형식만 참고, 내용은 대화에 맞게. 아래 박스 금지, 그냥 텍스트만 출력]
(예시 시작)
필터는 어떻게 빼요?

분리 후 물에 헹구고 완전히 말린 뒤 끼우라고 안내함.

전원이 안 켜져요?

콘센트·차단기 확인 후 리셋 버튼을 눌러보라고 안내함.
(예시 끝)

[규칙]
1. [대화 로그]에 나온 내용만 근거로 쓴다. 없는 사실을 지어내지 않는다.
2. 한국어로 작성한다.
3. 여러 번 질문이 있으면 대화 순서상 중요한 USER 질문부터 최대 3개만 고른다.
4. 인사말·메타 코멘트·"요약:", "질문:" 같은 접두어는 넣지 않는다.
5. 한 블록 안에서 질문 줄과 요약 줄 사이에는 반드시 빈 줄 1개가 있어야 한다.
6. 답변(요약) 문단 **안에는 빈 줄을 넣지 않는다.** (한 덩어리로만 쓴다)"""


def summarizer_node(state: AgentState) -> dict[str, Any]:
    """conversation_text를 받아 질문-요약 블록 포맷으로 요약을 생성한다."""

    text = (state.get("conversation_text") or "").strip()
    logger.info(
        "[summarizer] 요청 수신 conversation_chars=%d",
        len(text),
    )

    if not text:
        logger.info("[summarizer] 완료 empty_input summary_chars=0")
        return {
            "final_answer": "요약할 대화 내용이 없습니다.",
            "llm_calls": state.get("llm_calls", 0),
        }

    text = truncate(text, _MAX_CONVERSATION_CHARS)
    prompt = f"{_SUMMARY_SYSTEM_PROMPT}\n\n[대화 로그]\n{text}"

    response = answer_llm.invoke(prompt)
    summary = llm_text(response).strip()
    if not summary:
        summary = "요약을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요."

    logger.info(
        "[summarizer] 완료 summary_chars=%d",
        len(summary),
    )

    return {
        "final_answer": summary,
        "llm_calls": state.get("llm_calls", 0) + 1,
        "messages": [AIMessage(content=summary)],
    }
