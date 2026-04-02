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
llm = OllamaLLM(model="qwen2.5:7B", base_url="http://127.0.0.1:11434")


# 🌟 1. DTO 수정: Spring Boot가 manual_id를 같이 보내주도록 추가!
class ChatRequest(BaseModel):
    manual_id: str  # 예: "GMDS_MFL71839003_13_250911_00_WEB"
    question: str


@router.post("/ask")
def ask_manual(request: ChatRequest):
    user_question = request.question
    target_manual = request.manual_id  # 타겟 매뉴얼 ID 확보

    question_vector = embeddings_model.embed_query(user_question)

    with GraphDatabase.driver(URI, auth=(USER, PASSWORD)) as driver:
        with driver.session() as session:
            # 🌟 2. Cypher 쿼리 수정: WHERE 절을 추가해서 해당 매뉴얼 안에서만 검색!
            result = session.run("""
                CALL db.index.vector.queryNodes('page_text_embeddings', 5, $question_vector)
                YIELD node, score
                WHERE node.product_name = $manual_id  // 👈 다른 매뉴얼 데이터가 섞이는 걸 완벽 차단!
                RETURN node.text AS text, node.page_num AS page_num, score
                LIMIT 1
            """, question_vector=question_vector, manual_id=target_manual)

            record = result.single()

    if not record:
        return {"answer": "해당 모델의 매뉴얼에서 관련 내용을 찾을 수 없습니다."}

    found_text = record["text"]
    found_page = record["page_num"]

    prompt = f"""
    너는 전자제품 고객센터의 친절한 AI 비서야.
    아래 제공된 [매뉴얼 내용]만 바탕으로 유저의 [질문]에 답변해줘.

    [매뉴얼 내용 (참고 페이지: {found_page}p)]
    {found_text}

    [유저 질문]
    {user_question}
    """

    print(f"🤖 AI가 [{target_manual}]의 {found_page}페이지를 읽고 답변을 생성 중입니다...")

    ai_answer = llm.invoke(prompt)

    return {
        "manual_id": target_manual,
        "question": user_question,
        "found_page": found_page,
        "ai_answer": ai_answer
    }