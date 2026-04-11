"""
[1회성 스크립트] 기존 페이지 중심 DB 데이터 정리

기존 Page 노드에서 불필요해진 속성(text, embedding)과
관계(NEXT_PAGE), 인덱스(page_text_embeddings, page_keyword_index)를 제거합니다.
"""

import os
import sys
sys.stdout.reconfigure(encoding='utf-8')

from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()
URI = os.getenv("NEO4J_URI")
USER = os.getenv("NEO4J_USER")
PASSWORD = os.getenv("NEO4J_PASSWORD")


def run_cleanup():
    print("=" * 50)
    print("[cleanup_legacy] 기존 페이지 중심 데이터 정리 시작")
    print("=" * 50)

    with GraphDatabase.driver(URI, auth=(USER, PASSWORD)) as driver:
        with driver.session() as session:

            # 1. Page 노드에서 text, embedding 속성 제거
            print("Step 1: Page 노드에서 text, embedding 속성 제거 중...")
            result = session.run("""
                MATCH (p:Page)
                WHERE p.text IS NOT NULL OR p.embedding IS NOT NULL
                REMOVE p.text, p.embedding
                RETURN count(p) AS cleaned_count
            """)
            count = result.single()["cleaned_count"]
            print(f"   -> {count}개 Page 노드 정리 완료")

            # 2. NEXT_PAGE 관계 제거
            print("Step 2: NEXT_PAGE 관계 제거 중...")
            result = session.run("""
                MATCH ()-[r:NEXT_PAGE]->()
                DELETE r
                RETURN count(r) AS deleted_count
            """)
            count = result.single()["deleted_count"]
            print(f"   -> {count}개 NEXT_PAGE 관계 삭제 완료")

            # 3. 기존 벡터 인덱스 삭제
            print("Step 3: 기존 page_text_embeddings 벡터 인덱스 삭제 중...")
            try:
                session.run("DROP INDEX page_text_embeddings IF EXISTS")
                print("   -> page_text_embeddings 인덱스 삭제 완료")
            except Exception as e:
                print(f"   -> 인덱스 삭제 스킵 (이미 없거나 오류): {e}")

            # 4. 기존 Full-text 인덱스 삭제
            print("Step 4: 기존 page_keyword_index Full-text 인덱스 삭제 중...")
            try:
                session.run("DROP INDEX page_keyword_index IF EXISTS")
                print("   -> page_keyword_index 인덱스 삭제 완료")
            except Exception as e:
                print(f"   -> 인덱스 삭제 스킵 (이미 없거나 오류): {e}")

            # 5. 정리 후 상태 확인
            print("\n[결과] 정리 후 DB 상태 확인:")
            result = session.run("""
                MATCH (p:Page)
                RETURN count(p) AS page_count,
                       count(p.text) AS has_text,
                       count(p.embedding) AS has_embedding
            """)
            record = result.single()
            print(f"   Page 노드: {record['page_count']}개")
            print(f"   text 속성 보유: {record['has_text']}개 (0이어야 정상)")
            print(f"   embedding 속성 보유: {record['has_embedding']}개 (0이어야 정상)")

    print("\n" + "=" * 50)
    print("[완료] 기존 데이터 정리가 완료되었습니다!")
    print("   이제 build_sections.py를 실행하여 섹션을 생성하세요.")
    print("=" * 50)


if __name__ == "__main__":
    run_cleanup()
