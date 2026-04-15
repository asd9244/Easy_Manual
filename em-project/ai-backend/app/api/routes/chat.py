import os
import json
import re
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict
from langchain_ollama import OllamaEmbeddings, ChatOllama
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()
URI = os.getenv("NEO4J_URI")
USER = os.getenv("NEO4J_USER")
PASSWORD = os.getenv("NEO4J_PASSWORD")
router = APIRouter()

OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")

embeddings_model = OllamaEmbeddings(model="bge-m3", base_url=OLLAMA_BASE)
llm = ChatOllama(
    model="gemma4:e4b",
    base_url=OLLAMA_BASE,
    temperature=0.1,
)



class ChatRequest(BaseModel):
    manual_id: str
    question: str
    media_url: Optional[str] = None  # 프론트엔드에서 전달받을 이미지 URL (선택 사항)


def _merge_images_ordered_by_page(records: list) -> List[str]:
    """
    섹션별로 넘어온 (page_num, image_filename) 쌍을 합치고,
    페이지 번호 오름차순 → 동일 페이지 내 파일명 순으로 정렬해 파일명 리스트만 반환.
    """
    # filename -> 대표 page_num (여러 섹션에 겹치면 더 작은 페이지 번호 유지)
    filename_to_page: Dict[str, int] = {}

    for record in records:
        page_nums = record["page_nums"] or []
        image_filenames = record["image_filenames"] or []
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


@router.post("/ask")
def ask_manual(request: ChatRequest):
    user_question = request.question
    target_manual = request.manual_id

    question_vector = embeddings_model.embed_query(user_question)

    with GraphDatabase.driver(URI, auth=(USER, PASSWORD)) as driver:
        with driver.session() as session:
            # 🌟 1단계: 벡터 유사도 검색으로 가장 관련 높은 Section 확보 (최대 3개)
            # 다른 매뉴얼 인덱스가 섞이는 것을 방지하기 위해 5개 검색 후 product_name 필터링 + Limit 3
            result = session.run("""
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
            """, question_vector=question_vector, manual_id=target_manual)

            records = list(result)

    if not records:
        return {
            "manual_id": target_manual,
            "question": user_question,
            "found_page": None,
            "ai_answer": "해당 질문에 대한 관련 내용을 매뉴얼에서 찾을 수 없습니다.",
            "manual_image_urls": []
        }

    # 🌟 2단계: 검색된 Section들의 텍스트, 목차, 연결된 이미지 통합
    toc_entries = []
    combined_texts = []
    all_page_nums = []

    for idx, record in enumerate(records):
        title = record["section_title"]
        hierarchy = record["hierarchy"]
        text = record["combined_text"]
        
        # Neo4j에서 page.page_num 순으로 collect됨 → 참고 범위는 수집된 번호 기준
        page_nums = list(record["page_nums"]) if record["page_nums"] else []
        numeric_pages = []
        for p in page_nums:
            try:
                numeric_pages.append(int(p))
            except (TypeError, ValueError):
                continue
        
        if numeric_pages:
            toc_entries.append(f"[{idx+1}] {hierarchy} (참고 페이지: {min(numeric_pages)}~{max(numeric_pages)}p)")
        else:
            toc_entries.append(f"[{idx+1}] {hierarchy}")
            
        combined_texts.append(f"--- [섹션 {idx+1}: {title}] ---\n{text}")
        
        all_page_nums.extend(numeric_pages)

    # 응답용 이미지 파일명: 전체 섹션 합친 뒤 페이지 번호 오름차순
    all_image_filenames = _merge_images_ordered_by_page(records)

    # 순서 유지를 보장하면서 페이지 번호 중복제거, 가장 작은 페이지를 대표 found_page로 설정
    unique_page_nums = sorted(list(set(all_page_nums)))
    start_page = unique_page_nums[0] if unique_page_nums else None

    toc_section = "\n".join(toc_entries)
    full_combined_text = "\n\n".join(combined_texts)

    # 🌟 3단계: 텍스트 기반 프롬프트 (멀티모달 이미지 전송 완전 제거)
    prompt = f"""너는 전자제품 고객센터의 최고 권위자이자 전문 AI 비서야.

[핵심 규칙]
1. 반드시 아래 제공된 [매뉴얼 내용]만을 근거로 답변해. 없는 내용은 절대 추측하지 마.
2. 확실하지 않은 내용이 있으면 "해당 내용은 제공된 매뉴얼에서 확인되지 않습니다. 고객센터에 문의해주세요."라고 솔직하게 답해.
3. 답변할 때 참고한 섹션명이나 페이지 번호를 자연스럽게 언급해줘. (예: "[필터 청소하기] 섹션(p41~43)에 따르면...")
4. 한국어로 정확하고 친절하게 답변해.

[참고 섹션 목록]
{toc_section}

[매뉴얼 내용 (OCR + 사전 분석된 시각 정보)]
{full_combined_text}

[유저 질문]
{user_question}"""

    print(f"AI가 [{target_manual}]의 Section {len(records)}개를 참조하여 오직 텍스트만으로 초고속 답변을 생성 중입니다...")

    response = llm.invoke(prompt)
    if isinstance(response.content, list):
        ai_answer = "".join([str(item.get("text", "")) for item in response.content if isinstance(item, dict) and "text" in item])
    else:
        ai_answer = str(response.content)

    print(f"\n💡 [AI 생성 답변]\n{ai_answer}\n")

    # 프론트 반환용 이미지 경로 (상대 경로 사용 → Vite 프록시 또는 리버스 프록시를 통해 서빙)
    manual_image_urls = [
        f"/manual_images/{target_manual}/{img_filename}"
        for img_filename in all_image_filenames
    ]

    return {
        "manual_id": target_manual,
        "question": user_question,
        "found_page": start_page,
        "ai_answer": ai_answer,
        "manual_image_urls": manual_image_urls
    }