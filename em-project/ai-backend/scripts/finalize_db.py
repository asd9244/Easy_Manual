import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()
URI = os.getenv("NEO4J_URI")
USER = os.getenv("NEO4J_USER")
PASSWORD = os.getenv("NEO4J_PASSWORD")

def create_next_page_relations(tx, model_name):
    print(f"🔗[{model_name}] 페이지 선후 관계 연결 중...")
    tx.run("""
        MATCH (p1:Page {product_name: $model_name})
        MATCH (p2:Page {product_name: $model_name})
        WHERE p2.page_num = p1.page_num + 1
        MERGE (p1)-[:NEXT_PAGE]->(p2)
    """, model_name=model_name)

def create_fulltext_index(session):
    print(f"🔍 키워드 검색용 Full-text Index 생성 중...")
    session.run("""
        CREATE FULLTEXT INDEX page_keyword_index IF NOT EXISTS
        FOR (n:Page) ON EACH[n.text]
    """)

# 🌟 수정됨: model_name을 외부에서 받아오도록 변경!
def run(model_name: str):
    with GraphDatabase.driver(URI, auth=(USER, PASSWORD)) as driver:
        with driver.session() as session:
            create_fulltext_index(session)
            session.execute_write(create_next_page_relations, model_name)
            print(f"🏆 [{model_name}] DB 최적화 작업이 완벽하게 끝났습니다!")

if __name__ == "__main__":
    # 단독 실행할 때 테스트용 이름
    run("GMDS_MFL71890611_05_250625_00_WEB")