import os
import json
import re
from fastapi import APIRouter
from pydantic import BaseModel, Field
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()
URI = os.getenv("NEO4J_URI")
USER = os.getenv("NEO4J_USER")
PASSWORD = os.getenv("NEO4J_PASSWORD")

router = APIRouter()

embeddings_model = OllamaEmbeddings(model="bge-m3", base_url="http://127.0.0.1:11434")
llm = OllamaLLM(model="qwen2.5:7b", base_url="http://127.0.0.1:11434")


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
            # 🌟 수정됨: 쿼리에서 image_filename을 추가로 가져옵니다.
            result = session.run("""
                CALL db.index.vector.queryNodes('page_text_embeddings', 1, $question_vector)
                YIELD node AS hit_page, score
                WHERE hit_page.product_name = $manual_id

                MATCH (hit_page)-[:NEXT_PAGE*0..2]->(related_page:Page)
                WHERE related_page.product_name = $manual_id

                WITH hit_page, related_page
                ORDER BY related_page.page_num ASC

                // 🌟 핵심: related_page.image_filename 도 같이 수집(collect)합니다.
                RETURN hit_page.page_num AS start_page,
                       collect(related_page.text) AS texts,
                       collect(related_page.page_num) AS page_nums,
                       collect(related_page.image_filename) AS image_filenames
            """, question_vector=question_vector, manual_id=target_manual)

            record = result.single()

    if not record:
        return {
            "manual_id": target_manual,
            "question": user_question,
            "found_page": None,
            "ai_answer": "해당 모델의 매뉴얼에서 관련 내용을 찾을 수 없습니다.",
            "manual_image_url": None # 🌟 실패 시 null 반환
        }

    start_page = record["start_page"]
    texts_list = record["texts"]
    page_nums_list = record["page_nums"]
    image_filenames_list = record["image_filenames"] # 🌟 DB에서 꺼내온 파일명 리스트

    combined_text = "\n\n".join(texts_list)

    prompt = f"""
    너는 전자제품 고객센터의 전문 AI 비서야.
    아래 제공된 [매뉴얼 내용]만 바탕으로 유저의 [질문]에 정확하고 친절하게 답변해줘.[매뉴얼 내용 (참고 페이지: {page_nums_list}p)]
    {combined_text}[유저 질문]
    {user_question}
    """

    print(f"AI가 [{target_manual}]의 {page_nums_list}p 내용을 분석하여 답변을 생성 중입니다...")

    ai_answer = llm.invoke(prompt)

    # 🌟 새로 추가된 기능: 대표 이미지 URL 조립
    # 여러 페이지 중 가장 첫 번째 페이지(start_page)의 이미지를 대표 이미지로 사용합니다.
    # 예: http://localhost:8000/manual_images/GMDS_.../page_45.png
    primary_image_filename = image_filenames_list[0]
    manual_image_url = f"http://localhost:8000/manual_images/{target_manual}/{primary_image_filename}"

    return {
        "manual_id": target_manual,
        "question": user_question,
        "found_page": start_page,
        "ai_answer": ai_answer,
        "manual_image_url": manual_image_url # 🌟 조립된 이미지 URL을 Spring Boot로 전송!
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
        raw_answer = llm.invoke(prompt)
        
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