import os
import json
import re
from fastapi import APIRouter
from pydantic import BaseModel, Field
from langchain_ollama import OllamaEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()
URI = os.getenv("NEO4J_URI")
USER = os.getenv("NEO4J_USER")
PASSWORD = os.getenv("NEO4J_PASSWORD")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

router = APIRouter()

embeddings_model = OllamaEmbeddings(model="bge-m3", base_url="http://127.0.0.1:11434")
llm = ChatGoogleGenerativeAI(model="gemini-3.1-pro-preview", google_api_key=GOOGLE_API_KEY, temperature=0.1)


class ChatRequest(BaseModel):
    manual_id: str
    question: str
    media_url: str = None  # 프론트엔드에서 전달받을 이미지 URL (선택 사항)


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
                RETURN section.title AS section_title,
                       section.hierarchy AS hierarchy,
                       section.combined_text AS combined_text,
                       score,
                       collect(DISTINCT page.page_num) AS page_nums,
                       collect(DISTINCT page.image_filename) AS image_filenames
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
    all_image_filenames = []
    all_page_nums = []

    for idx, record in enumerate(records):
        title = record["section_title"]
        hierarchy = record["hierarchy"]
        text = record["combined_text"]
        
        # page_nums 빈 예외 처리 + 정렬
        page_nums = sorted(record["page_nums"]) if record["page_nums"] else []
        image_filenames = sorted(record["image_filenames"]) if record["image_filenames"] else []
        
        if page_nums:
            toc_entries.append(f"[{idx+1}] {hierarchy} (참고 페이지: {min(page_nums)}~{max(page_nums)}p)")
        else:
            toc_entries.append(f"[{idx+1}] {hierarchy}")
            
        combined_texts.append(f"--- [섹션 {idx+1}: {title}] ---\n{text}")
        
        all_page_nums.extend(page_nums)
        for img in image_filenames:
            if img not in all_image_filenames:
                all_image_filenames.append(img)
                
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

    # 🌟 프론트 반환용 (AI는 이미지가 없어도, 사용자는 화면상으로 볼 수 있게 URL 전달)
    manual_image_urls = [
        f"http://localhost:8000/manual_images/{target_manual}/{img_filename}"
        for img_filename in all_image_filenames
    ]

    return {
        "manual_id": target_manual,
        "question": user_question,
        "found_page": start_page,
        "ai_answer": ai_answer,
        "manual_image_urls": manual_image_urls
    }


class SummaryRequest(BaseModel):
    chat_history: str = Field(
        ..., 
        title="전체 대화 이력", 
        description="요약할 유저와 AI의 상담 전체 대화 내역입니다. 긴 텍스트를 그대로 넘겨주시면 됩니다.", 
        example="유저: 에어컨 켤 때 드르륵거리는 소리가 나요.\\n비서: 먼지 필터가 장착되지 않아 나는 소리일 수 있습니다. 필터를 빼서 확인해 보시겠어요?"
    )

class SummaryResponse(BaseModel):
    symptoms: str = Field(..., title="증상", description="사용자가 호소한 주요 증상에 대한 1~2줄 요약")
    cause: str = Field(..., title="원인", description="상담 내용을 바탕으로 AI가 진단한 고장의 핵심 원인")
    solutions: str = Field(..., title="해결방안", description="사용자 혼자서 조치할 수 있는 단계별 가이드라인 (번호를 매겨 반환됨)")

@router.post(
    "/summary", 
    response_model=SummaryResponse,
    summary="채팅 상담 내역 기반 진단 리포트 요약 생성 API 📝",
    description="스프링 백엔드에서 사용자 채팅 이력을 하나로 모아 전송(`chat_history`)하면, 로컬 Qwen 모델 가동을 통해 **증상, 원인, 해결방안** 3파트로 분류된 아주 깔끔한 JSON 응답(`SummaryResponse`) 구조체로 요약하여 뱉어내는 AI 엔진입니다."
)
def summarize_chat(request: SummaryRequest):
    prompt = f"""
    너는 전자기기 수리 상담 내역을 분석하는 전문 AI 비서야.
    아래 제공된 [대화 이력]을 분석해서 다음 3가지 항목으로 매우 간결하게 요약해줘.
    
    1. symptoms: 사용자가 호소한 주요 증상 (1~2줄)
    2. cause: 기기 고장의 주요 원인 (1~2줄)
    3. solutions: 조치해야 할 해결방안 리스트 (구체적인 번호 매기기)
    
    반드시 아래 JSON 형식으로만 답변해야 하며, 다른 설명이나 인사말은 절대 포함하지 마.
    {{
        "symptoms": "...",
        "cause": "...",
        "solutions": "..."
    }}

    [대화 이력]
    {request.chat_history}
    """
    
    print("AI가 대화 내역 리포트 요약을 시작합니다 (JSON 형식)...")
    
    try:
        response = llm.invoke(prompt)
        if isinstance(response.content, list):
            raw_answer = "".join([str(item.get("text", "")) for item in response.content if isinstance(item, dict) and "text" in item])
        else:
            raw_answer = str(response.content)
        
        # 안전 장치: 모델이 혹시나 마크다운 블록(```json)을 붙였을 경우를 대비한 클렌징 로직
        cleaned_answer = raw_answer.strip()
        if cleaned_answer.startswith("```json"):
            cleaned_answer = cleaned_answer.replace("```json", "", 1)
        if cleaned_answer.startswith("```"):
            cleaned_answer = cleaned_answer.replace("```", "", 1)
        if cleaned_answer.endswith("```"):
            cleaned_answer = cleaned_answer[:cleaned_answer.rfind("```")]
            
        cleaned_answer = cleaned_answer.strip()
        
        # JSON 직렬화 해제
        parsed_json = json.loads(cleaned_answer)
        
        return {
            "symptoms": parsed_json.get("symptoms", "증상 요약 실패"),
            "cause": parsed_json.get("cause", "원인 분석 실패"),
            "solutions": parsed_json.get("solutions", "해결방안 요약 실패")
        }
        
    except Exception as e:
        print(f"JSON 파싱 실패: {e}\\n원본 답변: {raw_answer if 'raw_answer' in locals() else 'None'}")
        return {
            "symptoms": "AI 요약 생성 중 오류가 발생했습니다.",
            "cause": "원인 분석 불가",
            "solutions": f"상세 에러 내역 발생. 스프링 부트는 이 에러를 처리해야 함."
        }