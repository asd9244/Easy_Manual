import os
from neo4j import GraphDatabase
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_ollama import OllamaEmbeddings
import time

load_dotenv()
URI = os.getenv("NEO4J_URI")
USER = os.getenv("NEO4J_USER")
PASSWORD = os.getenv("NEO4J_PASSWORD")

AI_MODE = os.getenv("AI_MODE", "ollama")

if AI_MODE == "gemini":
    print("🚀 Vector Mode: Cloud Gemini (v1)")
    embeddings_model = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        task_type="retrieval_document"
    )
    VECTOR_DIM = 768
else:
    print("🏠 Vector Mode: Local Ollama")
    embeddings_model = OllamaEmbeddings(
        model="bge-m3",
        base_url="http://127.0.0.1:11434"
    )
    VECTOR_DIM = 1024


def create_vector_index(session):
    print("🛠️ Vector Index 세팅 중...")
    session.run("DROP INDEX section_text_embeddings IF EXISTS")
    session.run(f"""
        CREATE VECTOR INDEX section_text_embeddings IF NOT EXISTS
        FOR (s:Section) ON (s.embedding)
        OPTIONS {{indexConfig: {{
            `vector.dimensions`: {VECTOR_DIM},
            `vector.similarity_function`: 'cosine'
        }}}}
    """)
    print("   ✅ Index 생성 완료.")


def update_embeddings(tx, model_name):
    # 빈 텍스트 제외, 아직 임베딩 없는 섹션만 가져오기
    result = tx.run("""
        MATCH (s:Section {product_name: $model_name})
        WHERE s.combined_text IS NOT NULL
          AND trim(s.combined_text) <> ''
          AND s.embedding IS NULL
        RETURN elementId(s) AS node_id, s.title AS title, s.combined_text AS combined_text
    """, model_name=model_name)

    records = list(result)
    if not records:
        print(f"✨ [{model_name}] 모든 섹션이 이미 벡터화되어 있습니다!")
        return

    print(f"🚀 [{model_name}] 총 {len(records)}개 섹션 벡터화 시작...")

    for record in records:
        node_id = record["node_id"]
        text = record["combined_text"]
        title = record["title"]

        # 빈 텍스트 최종 방어
        if not text or not text.strip():
            print(f"   ⏭️  '{title}' 섹션 건너뜀 (텍스트 없음)")
            continue

        # 429 대비 재시도 로직 (최대 3회, 60초 대기)
        for attempt in range(3):
            try:
                embedding_vector = embeddings_model.embed_query(text)
                tx.run("""
                    MATCH (s:Section) WHERE elementId(s) = $node_id
                    SET s.embedding = $embedding
                """, node_id=node_id, embedding=embedding_vector)
                print(f"   ✅ '{title}' 섹션 완료")
                time.sleep(0.7)  # 분당 100회 한도 방지 (약 85req/min)
                break
            except Exception as e:
                err = str(e)
                if "429" in err or "RESOURCE_EXHAUSTED" in err:
                    wait = 60
                    print(f"   ⏳ Rate limit 도달. {wait}초 대기 후 재시도... (시도 {attempt+1}/3)")
                    time.sleep(wait)
                else:
                    print(f"   ❌ '{title}' 섹션 실패: {e}")
                    break


def run_vectorization(model_name: str):
    with GraphDatabase.driver(URI, auth=(USER, PASSWORD)) as driver:
        with driver.session() as session:
            # 1. 인덱스 생성
            create_vector_index(session)
            # 2. 임베딩 작업 (transaction 없이 직접 실행하여 타임아웃 방지)
            session.execute_write(update_embeddings, model_name)
            print(f"🎉 [{model_name}] 벡터화 공정 종료")


if __name__ == "__main__":
    run_vectorization("GMDS_MFL71890611_05_250625_00_WEB")  # 통합 파이프라인에서 쓴 이름과 맞춰주세요!