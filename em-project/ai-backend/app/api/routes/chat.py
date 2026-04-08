import os
from fastapi import APIRouter
from pydantic import BaseModel
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