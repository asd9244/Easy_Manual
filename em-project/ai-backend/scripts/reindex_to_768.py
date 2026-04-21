import os
import time
from neo4j import GraphDatabase
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

# .env 로드
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
load_dotenv(os.path.join(project_root, ".env"))

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "12341234")

# 모델 초기화 (임베딩 768차원 고정, 최신 모델인 text-embedding-004 사용)
embeddings_model = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=GOOGLE_API_KEY)

def reindex():
    print("🚀 [Step 1] 1024차원 -> 768차원 재임베딩 작업 시작...")
    
    with GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
        with driver.session() as session:
            # 1. 모든 Section 노드 가져오기
            result = session.run("MATCH (s:Section) RETURN id(s) as node_id, s.combined_text as text, s.title as title")
            sections = list(result)
            print(f"📊 총 {len(sections)}개의 섹션을 처리합니다.")

            for idx, record in enumerate(sections):
                node_id = record["node_id"]
                text = record["text"]
                title = record["title"]

                print(f"   [{idx+1}/{len(sections)}] '{title}' 재임베딩 중...")
                
                # 2. 제미나이 임베딩 (768차원) 생성
                try:
                    new_embedding = embeddings_model.embed_query(text)
                    
                    # 3. DB 업데이트
                    session.run("""
                        MATCH (s:Section) WHERE id(s) = $node_id
                        SET s.embedding = $embedding
                    """, node_id=node_id, embedding=new_embedding)
                    
                except Exception as e:
                    print(f"      [!] 실패: {e}")
                    if "429" in str(e):
                        print("      할당량 초과! 30초 후 다시 시도합니다...")
                        time.sleep(30)
                        # 단순 재시도 생략, 다음 루프에서 처리되거나 스크립트 재실행 필요

                if (idx + 1) % 5 == 0:
                    time.sleep(1) # API 과부하 방지

            # 4. 768차원 전용 인덱스 생성
            print("\n🚀 [Step 2] 768차원 전용 벡터 인덱스 재생성 중...")
            session.run("DROP INDEX section_text_embeddings IF EXISTS")
            session.run("""
                CREATE VECTOR INDEX section_text_embeddings IF NOT EXISTS
                FOR (s:Section) ON (s.embedding)
                OPTIONS {indexConfig: {
                    `vector.dimensions`: 768,
                    `vector.similarity_function`: 'cosine'
                }}
            """)
            print("✅ 768차원 벡터 인덱스 생성 완료!")

if __name__ == "__main__":
    reindex()
