import os
import json
from neo4j import GraphDatabase
from dotenv import load_dotenv

# 환경변수 불러오기
load_dotenv()
URI = os.getenv("NEO4J_URI")
USER = os.getenv("NEO4J_USER")
PASSWORD = os.getenv("NEO4J_PASSWORD")


def ingest_manual_to_graph(tx, model_name, ocr_data, toc_data):
    """
    [핵심 재사용 함수]
    어떤 매뉴얼이든 model_name, ocr_data, toc_data만 던져주면 완벽한 그래프를 그려줍니다.
    """

    # ==========================================
    # 1. 제품(Product) 노드와 전체 페이지(Page) 노드 생성 (OCR 텍스트 주입)
    # ==========================================
    # 제품 노드 생성
    tx.run("MERGE (p:Product {name: $model_name})", model_name=model_name)

    # OCR 데이터를 돌면서 모든 페이지 노드를 만들고 텍스트/이미지 정보를 넣습니다.
    for page in ocr_data:
        tx.run("""
            MATCH (p:Product {name: $model_name})
            MERGE (pg:Page {product_name: $model_name, page_num: $page_num})
            SET pg.image_filename = $image_filename
            MERGE (p)-[:CONTAINS_PAGE]->(pg)
        """,
               model_name=model_name,
               page_num=page['page_num'],
               image_filename=page['image_filename'])

    # ==========================================
    # 2. 목차(Topic) 노드 생성 및 페이지와 연결 (TOC 데이터 주입)
    # ==========================================
    for item in toc_data:
        hierarchy = item['hierarchy']
        page_num = item['page_num']

        for i in range(len(hierarchy)):
            current_title = hierarchy[i]
            current_level = i + 1
            # 고유 ID 생성 시 제품명도 포함하여 완벽히 격리 (예: "lg_aircon_안전을 위해 주의하기")
            current_id = f"{model_name}_{' > '.join(hierarchy[:i + 1])}"

            # 목차 노드 생성
            tx.run("""
                MERGE (t:Topic {id: $id, product_name: $model_name})
                ON CREATE SET t.title = $title, t.level = $level
            """, id=current_id, model_name=model_name, title=current_title, level=current_level)

            # 관계 연결
            if i == 0:
                # 대분류는 제품 노드와 연결
                tx.run("""
                    MATCH (p:Product {name: $model_name})
                    MATCH (t:Topic {id: $id})
                    MERGE (p)-[:HAS_TOPIC]->(t)
                """, model_name=model_name, id=current_id)
            else:
                # 중/소분류는 부모 목차와 연결
                parent_id = f"{model_name}_{' > '.join(hierarchy[:i])}"
                tx.run("""
                    MATCH (parent:Topic {id: $parent_id})
                    MATCH (child:Topic {id: $child_id})
                    MERGE (parent)-[:HAS_TOPIC]->(child)
                """, parent_id=parent_id, child_id=current_id)

        # 마지막으로 해당 목차를 실제 '페이지' 노드와 연결
        lowest_topic_id = f"{model_name}_{' > '.join(hierarchy)}"
        tx.run("""
            MATCH (t:Topic {id: $topic_id})
            MATCH (pg:Page {product_name: $model_name, page_num: $page_num})
            MERGE (t)-[:STARTS_AT_PAGE]->(pg)
        """, topic_id=lowest_topic_id, model_name=model_name, page_num=page_num)


# ==========================================
# 🚀 실행 컨트롤러 (다른 매뉴얼 추가 시 여기만 바꾸면 됨!)
# ==========================================
def run_pipeline(model_name: str):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)

    # JSON 파일 경로 자동 계산
    ocr_json_path = os.path.join(project_root, "data", "extracted_texts", model_name, f"{model_name}_text.json")
    toc_json_path = os.path.join(project_root, "data", "extracted_toc", model_name, f"{model_name}_toc.json")

    # 파일이 존재하는지 체크
    if not os.path.exists(ocr_json_path) or not os.path.exists(toc_json_path):
        print(f"❌ [{model_name}] 의 JSON 데이터가 부족합니다. ocr_service와 toc_service를 먼저 돌려주세요.")
        return

    # 데이터 읽어오기
    with open(ocr_json_path, "r", encoding="utf-8") as f:
        ocr_data = json.load(f)
    with open(toc_json_path, "r", encoding="utf-8") as f:
        toc_data = json.load(f)

    print(f"🚀 [{model_name}] Neo4j 적재 파이프라인 가동 중...")

    with GraphDatabase.driver(URI, auth=(USER, PASSWORD)) as driver:
        with driver.session() as session:
            # 🌟 주의: 기존 데이터 초기화 (개발 단계에서만 켜두세요. 나중엔 주석 처리!)
            # session.run("MATCH (n) DETACH DELETE n")

            # 핵심 함수 호출
            session.execute_write(ingest_manual_to_graph, model_name, ocr_data, toc_data)
            print(f"🎉[{model_name}] 적재 완료! (페이지: {len(ocr_data)}개, 목차: {len(toc_data)}개)")


if __name__ == "__main__":
    # 🌟 다른 매뉴얼을 넣고 싶다면?
    # 1. pdf_service, ocr_service, toc_service 에서 model_name="samsung_tv" 로 돌린다.
    # 2. 여기서 run_pipeline("samsung_tv") 라고 적고 실행하면 끝!

    run_pipeline("GMDS_MFL71890611_05_250625_00_WEB")