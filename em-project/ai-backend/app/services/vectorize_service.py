from neo4j import GraphDatabase
from dotenv import load_dotenv
from langchain_ollama import OllamaEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import time

load_dotenv()
URI = os.getenv("NEO4J_URI")
USER = os.getenv("NEO4J_USER")
PASSWORD = os.getenv("NEO4J_PASSWORD")

AI_MODE = os.getenv("AI_MODE", "ollama")

if AI_MODE == "gemini":
    print("🚀 Vector Mode: Cloud Gemini")
    embeddings_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
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
    session.run("DROP INDEX page_text_embeddings IF EXISTS")
    session.run(f"""
        CREATE VECTOR INDEX page_text_embeddings IF NOT EXISTS
        FOR (p:Page) ON (p.embedding)
        OPTIONS {{indexConfig: {{
            `vector.dimensions`: {VECTOR_DIM},
            `vector.similarity_function`: 'cosine'
        }}}}
    """)
    print("   ✅ Index 생성 완료.")


def update_embeddings(tx, model_name):
    # 아직 임베딩이 없는 페이지만 가져오기
    result = tx.run("""
        MATCH (p:Page {product_name: $model_name})
        WHERE p.text IS NOT NULL AND p.embedding IS NULL
        RETURN elementId(p) AS node_id, p.text AS text, p.page_num AS page_num
    """, model_name=model_name)

    records = list(result)
    if not records:
        print(f"✨ [{model_name}] 모든 페이지가 이미 벡터화되어 있습니다!")
        return

    print(f"🚀 [{model_name}] 총 {len(records)}개 페이지 벡터화 시작...")

    for record in records:
        try:
            node_id = record["node_id"]
            text = record["text"]
            page_num = record["page_num"]

            # Ollama 호출 (여기서 시간이 걸릴 수 있음)
            embedding_vector = embeddings_model.embed_query(text)

            # 한 페이지씩 즉시 업데이트
            tx.run("""
                MATCH (p:Page) WHERE elementId(p) = $node_id
                SET p.embedding = $embedding
            """, node_id=node_id, embedding=embedding_vector)

            print(f"   ✅ {page_num}페이지 완료")
        except Exception as e:
            print(f"   ❌ {record['page_num']}페이지 실패: {e}")
            continue  # 실패해도 다음 페이지로 진행


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