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
    VECTOR_DIM = 3072
else:
    print("🏠 Vector Mode: Local Ollama")
    embeddings_model = OllamaEmbeddings(
        model="bge-m3",
        base_url="http://127.0.0.1:11434"
    )
    VECTOR_DIM = 1024


def create_vector_index(session):
    print("🛠️ Vector Index 상태 확인 중...")
    # 인덱스가 이미 있으면 삭제하지 않고 유지 (속도 및 데이터 무결성)
    session.run(f"""
        CREATE VECTOR INDEX section_text_embeddings IF NOT EXISTS
        FOR (s:Section) ON (s.embedding)
        OPTIONS {{indexConfig: {{
            `vector.dimensions`: {VECTOR_DIM},
            `vector.similarity_function`: 'cosine'
        }}}}
    """)
    print("   ✅ Index 확인/생성 완료.")


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

        # 429 대비 재시도 로직 (최대 4회, 60초 대기)
        for attempt in range(4):
            try:
                embedding_vector = embeddings_model.embed_query(text)
                tx.run("""
                    MATCH (s:Section) WHERE elementId(s) = $node_id
                    SET s.embedding = $embedding
                """, node_id=node_id, embedding=embedding_vector)
                print(f"   ✅ '{title}' 섹션 완료")
                time.sleep(0.7)  # 분당 100회 한도 방지
                break
            except Exception as e:
                err = str(e)
                if "429" in err or "RESOURCE_EXHAUSTED" in err:
                    wait = 65
                    print(f"   ⏳ Rate limit 도달. {wait}초 대기 후 재시도... (시도 {attempt+1}/4)")
                    time.sleep(wait)
                else:
                    print(f"   ❌ '{title}' 섹션 실패: {e}")
                    break


if __name__ == "__main__":
    manuals = [
        "GMDS_MFL71890611_05_250625_00_WEB",       # 에어컨
        "WM_KOR_MFL71792815_11_251204_00_OM_WEB",  # 세탁기
        "REF_KOR_MFL71401523_00_250731_00_OM_WEB", # 냉장고
    ]
    
    with GraphDatabase.driver(URI, auth=(USER, PASSWORD)) as driver:
        with driver.session() as session:
            # 1. 인덱스 생성 (이미 있으면 유지)
            create_vector_index(session)
            
            # 2. 모든 매뉴얼 순차 벡터화
            for manual in manuals:
                print(f"\n📦 [{manual}] 공정 시작...")
                session.execute_write(update_embeddings, manual)
                print(f"🎉 [{manual}] 완료!")
    
    print("\n✨ 모든 매뉴얼 벡터화가 완료되었습니다.")