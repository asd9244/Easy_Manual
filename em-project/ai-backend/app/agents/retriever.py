"""
Retriever Node.

원본 ``app/api/routes/chat.py``의 Neo4j 벡터 검색 로직을 이식한다. 매뉴얼 간
교차 오염을 막기 위해 ``CALL db.index.vector.queryNodes`` 결과를 ``product_name``
으로 재필터링한 뒤 TOP 3만 남긴다.

이 노드는 오직 ``state["intent"] == "manual_qa"`` 경로에서만 호출된다.
"""

from __future__ import annotations

import logging
import os
from typing import Any

from neo4j import GraphDatabase

from app.agents.llms import embeddings_model
from app.agents.state import AgentState
from app.agents.utils import merge_images_ordered_by_page, preview_for_log

logger = logging.getLogger(__name__)


_URI = os.getenv("NEO4J_URI")
_USER = os.getenv("NEO4J_USER")
_PASSWORD = os.getenv("NEO4J_PASSWORD")


_VECTOR_QUERY = """
CALL db.index.vector.queryNodes('section_text_embeddings', 5, $question_vector)
YIELD node AS section, score
WHERE section.product_name = $manual_id

MATCH (section)-[:COVERS_PAGE]->(page:Page)
WHERE page.image_filename IS NOT NULL AND trim(page.image_filename) <> ''
WITH section, score, page
ORDER BY page.page_num
WITH section, score,
     collect(page.page_num) AS page_nums,
     collect(page.image_filename) AS image_filenames
RETURN section.title AS section_title,
       section.hierarchy AS hierarchy,
       section.combined_text AS combined_text,
       score,
       page_nums,
       image_filenames
ORDER BY score DESC
LIMIT 3
"""


def _run_vector_search(question: str, manual_id: str) -> list[dict[str, Any]]:
    """질문을 임베딩한 뒤 Neo4j에서 상위 섹션을 가져온다."""

    question_vector = embeddings_model.embed_query(question)

    with GraphDatabase.driver(_URI, auth=(_USER, _PASSWORD)) as driver:
        with driver.session() as session:
            result = session.run(
                _VECTOR_QUERY,
                question_vector=question_vector,
                manual_id=manual_id,
            )
            return [dict(record) for record in result]


def retriever_node(state: AgentState) -> dict[str, Any]:
    """
    Neo4j에서 관련 섹션 최대 3개를 조회해 state에 주입한다.

    결과가 비면 후속 조건부 엣지가 ``fallback`` 경로로 라우팅한다.
    """

    question = state.get("question") or ""
    manual_id = state.get("manual_id") or ""

    logger.info(
        "[retriever] 요청 수신 manual_id=%r question=%r",
        manual_id,
        preview_for_log(question),
    )

    if not question or not manual_id:
        # 방어적 코드 — Router 분기가 올바르면 여기 도달하지 않는다.
        logger.info(
            "[retriever] 완료 records=0 next=fallback (missing question or manual_id)"
        )
        return {
            "retrieved_records": [],
            "toc_section": "",
            "combined_text": "",
            "manual_image_urls": [],
            "found_page": None,
            "neo4j_queries": state.get("neo4j_queries", 0),
        }

    records = _run_vector_search(question, manual_id)
    neo4j_queries = state.get("neo4j_queries", 0) + 1

    if not records:
        logger.info(
            "[retriever] 완료 records=0 neo4j_queries=%s next=fallback",
            neo4j_queries,
        )
        return {
            "retrieved_records": [],
            "toc_section": "",
            "combined_text": "",
            "manual_image_urls": [],
            "found_page": None,
            "neo4j_queries": neo4j_queries,
        }

    # 참고 섹션 목차와 combined_text 조립. 원본 답변 플로우와 동일한 포맷을 유지해
    # 프론트가 표시하는 "[섹션명] 섹션(p41~43)에 따르면" 문구를 그대로 재현할 수 있다.
    toc_entries: list[str] = []
    combined_texts: list[str] = []
    all_page_nums: list[int] = []

    for idx, record in enumerate(records):
        title = record.get("section_title", "")
        hierarchy = record.get("hierarchy", "")
        text = record.get("combined_text", "") or ""

        page_nums = list(record.get("page_nums") or [])
        numeric_pages: list[int] = []
        for p in page_nums:
            try:
                numeric_pages.append(int(p))
            except (TypeError, ValueError):
                continue

        if numeric_pages:
            toc_entries.append(
                f"[{idx + 1}] {hierarchy} "
                f"(참고 페이지: {min(numeric_pages)}~{max(numeric_pages)}p)"
            )
        else:
            toc_entries.append(f"[{idx + 1}] {hierarchy}")

        combined_texts.append(f"--- [섹션 {idx + 1}: {title}] ---\n{text}")
        all_page_nums.extend(numeric_pages)

    all_image_filenames = merge_images_ordered_by_page(records)
    unique_page_nums = sorted(set(all_page_nums))
    start_page = unique_page_nums[0] if unique_page_nums else None

    manual_image_urls = [
        f"/manual_images/{manual_id}/{fn}" for fn in all_image_filenames
    ]

    logger.info(
        "[retriever] 완료 records=%d neo4j_queries=%s next=answerer found_page=%s",
        len(records),
        neo4j_queries,
        start_page,
    )

    return {
        "retrieved_records": records,
        "toc_section": "\n".join(toc_entries),
        "combined_text": "\n\n".join(combined_texts),
        "manual_image_urls": manual_image_urls,
        "found_page": start_page,
        "neo4j_queries": neo4j_queries,
    }
