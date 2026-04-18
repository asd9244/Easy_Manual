import os
import json
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from neo4j import GraphDatabase
from dotenv import load_dotenv
from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()
URI = os.getenv("NEO4J_URI")
USER = os.getenv("NEO4J_USER")
PASSWORD = os.getenv("NEO4J_PASSWORD")
router = APIRouter()

AI_MODE = os.getenv("AI_MODE", "ollama")
OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")

# ─── 임베딩: Gemini (별도 할당량 풀 → 안정적) ───────────────────────────────
if AI_MODE == "gemini":
    print("🚀 AI Mode: Hybrid (Gemini Primary + Ollama Fallback)")
    embeddings_model = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        task_type="retrieval_query"
    )
else:
    print("🏠 AI Mode: Local Ollama")
    embeddings_model = OllamaEmbeddings(model="bge-m3", base_url=OLLAMA_BASE)

# ─── LLM 폴백 체인 Def ───────────────────────────────────────────────────────
# Gemini 모델들 (각각 별도 일일 할당량 풀)
GEMINI_LLM_CASCADE = [
    "gemini-2.5-flash-preview-04-17",  # 1순위: 성능 최고
    "gemini-2.0-flash",                # 2순위: 안정적
    "gemini-1.5-flash",                # 3순위: 구버전 별도 풀
]
# 로컬 Ollama Gemma3 (최후 폴백, 완전 무료)
_ollama_llm = ChatOllama(model="gemma3:4b", base_url=OLLAMA_BASE, temperature=0.1)


def invoke_llm_with_fallback(prompt: str) -> str:
    """
    Gemini 모델들을 순서대로 시도하고, 모두 429 에러이면
    로컬 Ollama gemma3:4b로 폴백합니다.
    """
    if AI_MODE == "gemini":
        for model_name in GEMINI_LLM_CASCADE:
            try:
                llm = ChatGoogleGenerativeAI(model=model_name, temperature=0.1)
                response = llm.invoke(prompt)
                active_model = model_name
                print(f"✅ LLM 사용 모델: {active_model}")
                return _llm_text_content(response)
            except Exception as e:
                err = str(e)
                if "429" in err or "RESOURCE_EXHAUSTED" in err:
                    print(f"⚠️ [{model_name}] 할당량 초과, 다음 모델 시도...")
                    continue
                else:
                    print(f"❌ [{model_name}] 예상치 못한 오류: {err}")
                    raise

    # Gemini 전부 실패 or ollama 모드 → 로컬 Ollama 폴백
    print("🏠 Ollama gemma3:4b 로컬 폴백 실행 중...")
    try:
        response = _ollama_llm.invoke(prompt)
        return _llm_text_content(response)
    except Exception as e:
        print(f"❌ Ollama 폴백도 실패: {e}")
        raise


# PostgreSQL Configuration
DB_HOST = os.getenv("DB_HOST", "postgres")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "pixie")
DB_USER = os.getenv("DB_USERNAME", "postgres")
DB_PASS = os.getenv("DB_PASSWORD", "1234")

def get_manual_code(manual_id_or_name: str) -> str:
    """
    프론트에서 온 manual_id(PK) 또는 model_name(S836P022 등)을 
    Neo4j에 저장된 실제 manual_code(REF_KOR_...)로 매핑합니다.
    """
    try:
        conn = psycopg2.connect(
            host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASS
        )
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 1. manual_id(숫자형)로 검색
            if manual_id_or_name.isdigit():
                cur.execute("SELECT manual_code FROM manuals WHERE id = %s", (manual_id_or_name,))
                row = cur.fetchone()
                if row: return row['manual_code']

            # 2. model_name(문자열)로 검색
            cur.execute("""
                SELECT m.manual_code 
                FROM manuals m
                JOIN product_models p ON p.manual_id = m.id
                WHERE p.model_name = %s
            """, (manual_id_or_name,))
            row = cur.fetchone()
            if row: return row['manual_code']
            
            # 3. 직접 manual_code일 가능성 확인 (이미 변환된 값이면 그대로 반환)
            cur.execute("SELECT manual_code FROM manuals WHERE manual_code = %s", (manual_id_or_name,))
            row = cur.fetchone()
            if row: return row['manual_code']

        conn.close()
    except Exception as e:
        print(f"PostgreSQL 매핑 오류: {e}")
    
    return manual_id_or_name # 매핑 실패 시 원본 반환 (Neo4j에 직접 저장된 경우 대비)



class ChatRequest(BaseModel):
    manual_id: str
    question: str
    media_url: Optional[str] = None  # 프론트엔드에서 전달받을 이미지 URL (선택 사항)


class SummarizeRequest(BaseModel):
    """텍스트 대화 로그만 요약 (이미지·URL 본문 미포함)."""
    conversation_text: str = Field(..., min_length=1)


# 채팅 질의(/ask)와 동일 LLM, 별도 태스크용 시스템 지시
SUMMARY_SYSTEM_PROMPT = """너는 전자제품 고객 상담 대화를 정리하는 요약 전문가다.

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


def _llm_text_content(response) -> str:
    if isinstance(response.content, list):
        return "".join(
            str(item.get("text", ""))
            for item in response.content
            if isinstance(item, dict) and "text" in item
        )
    return str(response.content)


_MAX_CONVERSATION_CHARS = 100_000


@router.post("/summarize")
def summarize_conversation(request: SummarizeRequest):
    text = request.conversation_text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="conversation_text is empty")

    if len(text) > _MAX_CONVERSATION_CHARS:
        text = text[:_MAX_CONVERSATION_CHARS]

    prompt = f"""{SUMMARY_SYSTEM_PROMPT}

[대화 로그]
{text}"""

    print("대화 로그 텍스트 요약 생성 중...")
    try:
        summary = invoke_llm_with_fallback(prompt).strip()
    except Exception as e:
        print(f"Summary 오류: {e}")
        summary = ""

    if not summary:
        summary = "요약을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요."

    return {"summary": summary}


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
    input_manual = request.manual_id
    
    # 🌟 매핑 로직 적용: S836P022 -> REF_KOR_...
    target_manual = get_manual_code(input_manual)
    if target_manual != input_manual:
        print(f"🔍 Manual Mapping: {input_manual} -> {target_manual}")

    # 2. 질문 벡터화
    try:
        question_vector = embeddings_model.embed_query(user_question)
    except Exception as e:
        err_msg = str(e)
        if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
            return {
                "manual_id": target_manual,
                "question": user_question,
                "found_page": None,
                "ai_answer": "죄송합니다. 현재 AI 검색 기능의 일시적인 사용량 초과로 답변을 드릴 수 없습니다. 약 1분 후 다시 시도해 주시면 정상적으로 답변이 가능합니다.",
                "manual_image_urls": []
            }
        print(f"Embedding 오류: {err_msg}")
        raise

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
            "ai_answer": (
                "죄송합니다. 현재 등록된 매뉴얼에서 질문하신 내용과 관련된 정보를 찾지 못했습니다.\n\n"
                "정확하지 않은 답변을 드리는 것보다는, 확인된 정보만 안내해 드리는 것이 맞다고 판단하여 "
                "답변을 보류하게 되었습니다.\n\n"
                "혹시 다른 표현으로 다시 질문해 주시면, 더 정확한 안내를 도와드릴 수 있습니다." 
                "그래도 해결이 어려우시면 제조사 고객센터에 문의해 주시는 것을 권장드립니다."
            ),
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
2. 확실하지 않은 내용이 있으면, "죄송합니다. 현재 매뉴얼에서 해당 내용을 확인하지 못했습니다. 정확하지 않은 정보를 안내해 드리는 것보다 확인된 내용만 전달해 드리는 것이 맞다고 판단했습니다. 다른 표현으로 다시 질문해 주시거나, 제조사 고객센터에 문의해 주시면 더 정확한 안내를 받으실 수 있습니다." 라는 취지로 부드럽게 답해.
3. 답변할 때 참고한 섹션명이나 페이지 번호를 자연스럽게 언급해줘. (예: "[필터 청소하기] 섹션(p41~43)에 따르면...")
4. 한국어로 정확하고 친절하게 답변해.

[참고 섹션 목록]
{toc_section}

[매뉴얼 내용 (OCR + 사전 분석된 시각 정보)]
{full_combined_text}

[유저 질문]
{user_question}"""

    print(f"AI가 [{target_manual}]의 Section {len(records)}개를 참조하여 답변 생성 중...")

    try:
        ai_answer = invoke_llm_with_fallback(prompt)
    except Exception as llm_error:
        print(f"LLM 전체 챔인 실패: {llm_error}")
        ai_answer = "AI 답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."

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