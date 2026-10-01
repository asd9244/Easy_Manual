"""
노드 간에 공유되는 순수 함수 유틸.

원본 ``app/api/routes/chat.py``의 ``_merge_images_ordered_by_page``를 여기로
옮겨 Retriever/Answerer가 동일 로직을 공유하도록 한다. 로그용 한 줄 미리보기는
``preview_for_log`` 로 통일한다.
"""

from __future__ import annotations

from typing import Any

from langchain_core.messages import AIMessage, HumanMessage

# 프롬프트에 넣는 대화 기록: 최근 3번의 주고받기만, AI 답변은 길어 앞부분만.
_MAX_HISTORY_MESSAGES = 6
_MAX_ANSWER_CHARS = 300


def merge_images_ordered_by_page(records: list[dict[str, Any]]) -> list[str]:
    """
    Neo4j 섹션 레코드 리스트에서 (page_num, image_filename) 쌍을 합치고,
    페이지 번호 오름차순 → 동일 페이지 내 파일명 순으로 정렬한다.

    여러 섹션에 동일한 파일이 들어 있으면 더 작은 페이지 번호 기준으로 대표
    위치를 정해 중복을 제거한다.
    """

    filename_to_page: dict[str, int] = {}

    for record in records:
        page_nums = record.get("page_nums") or []
        image_filenames = record.get("image_filenames") or []
        for pn, fn in zip(page_nums, image_filenames):
            if not fn:
                continue
            try:
                pni = int(pn) if pn is not None else 0
            except (TypeError, ValueError):
                pni = 0
            if fn not in filename_to_page or pni < filename_to_page[fn]:
                filename_to_page[fn] = pni

    ordered = sorted(filename_to_page.items(), key=lambda kv: (kv[1], kv[0]))
    return [fn for fn, _ in ordered]


def truncate(text: str, max_chars: int) -> str:
    """안전하게 긴 입력을 잘라 낸다. None/빈 문자열은 그대로 반환."""

    if not text:
        return text
    return text if len(text) <= max_chars else text[:max_chars]


def format_history(messages: list[Any]) -> str:
    """체크포인트의 ``messages``를 Rewriter·Answerer 프롬프트용 대화 기록 문자열로 바꾼다."""

    lines: list[str] = []
    for message in messages[-_MAX_HISTORY_MESSAGES:]:
        if isinstance(message, HumanMessage):
            lines.append(f"사용자: {str(message.content).strip()}")
        elif isinstance(message, AIMessage):
            lines.append(f"AI: {truncate(str(message.content).strip(), _MAX_ANSWER_CHARS)}")
    return "\n".join(lines)


def preview_for_log(text: str, max_len: int = 100) -> str:
    """로그 한 줄용: 줄바꿈 제거·말줄임. ``truncate``와 달리 항상 한 줄 표시용."""

    t = text.replace("\n", " ").strip()
    if len(t) <= max_len:
        return t
    return t[: max_len - 1] + "…"
