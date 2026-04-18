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
    # 1. 제품(Product) 노드와 전체 페이지(Page) 노드 생성
    # ==========================================
    tx.run("MERGE (p:Product {name: $model_name})", model_name=model_name)

    page_map = {p['page_num']: p.get('text', '') for p in ocr_data}
    
    for page in ocr_data:
        tx.run("""
            MATCH (p:Product {name: $model_name})
            MERGE (pg:Page {product_name: $model_name, page_num: $page_num})
            SET pg.image_filename = $image_filename,
                pg.text = $text
            MERGE (p)-[:CONTAINS_PAGE]->(pg)
        """,
               model_name=model_name,
               page_num=page['page_num'],
               image_filename=page['image_filename'],
               text=page.get('text', ''))

    # ==========================================
    # 2. 섹션(Section) 노드 생성 및 페이지 범위 계산 (TOC 데이터 주입)
    # ==========================================
    # 2-1. 목차 정렬 (페이지 순)
    sorted_toc = sorted(toc_data, key=lambda x: x['page_num'])
    max_page = max(page_map.keys()) if page_map else 0

    for idx, item in enumerate(sorted_toc):
        hierarchy = item['hierarchy']
        start_page = item['page_num']
        
        # 다음 목차 시작 전까지를 해당 섹션의 범위로 간주
        if idx + 1 < len(sorted_toc):
            end_page = sorted_toc[idx+1]['page_num'] - 1
        else:
            end_page = max_page
        
        # 실제 텍스트 합산
        section_text_parts = []
        for p_num in range(start_page, end_page + 1):
            if p_num in page_map:
                section_text_parts.append(page_map[p_num])
        
        combined_text = "\n\n".join(section_text_parts)
        hierarchy_str = " > ".join(hierarchy)

        for i in range(len(hierarchy)):
            current_title = hierarchy[i]
            current_level = i + 1
            current_id = f"{model_name}_{' > '.join(hierarchy[:i + 1])}"

            # 섹션 노드 생성 (라벨을 Section으로 통일)
            tx.run("""
                MERGE (s:Section {id: $id, product_name: $model_name})
                ON CREATE SET s.title = $title, s.level = $level
                SET s.hierarchy = $hierarchy_str,
                    s.combined_text = $combined_text
            """, id=current_id, model_name=model_name, title=current_title, level=current_level, 
                hierarchy_str=hierarchy_str, combined_text=combined_text)

            # 관계 연결
            if i == 0:
                tx.run("""
                    MATCH (p:Product {name: $model_name})
                    MATCH (s:Section {id: $id})
                    MERGE (p)-[:HAS_SECTION]->(s)
                """, model_name=model_name, id=current_id)
            else:
                parent_id = f"{model_name}_{' > '.join(hierarchy[:i])}"
                tx.run("""
                    MATCH (parent:Section {id: $parent_id})
                    MATCH (child:Section {id: $child_id})
                    MERGE (parent)-[:HAS_SECTION]->(child)
                """, parent_id=parent_id, child_id=current_id)

        # 2-2. 섹션과 페이지들 연결 (COVERS_PAGE)
        lowest_section_id = f"{model_name}_{' > '.join(hierarchy)}"
        for p_num in range(start_page, end_page + 1):
            tx.run("""
                MATCH (s:Section {id: $section_id})
                MATCH (pg:Page {product_name: $model_name, page_num: $page_num})
                MERGE (s)-[:COVERS_PAGE]->(pg)
            """, section_id=lowest_section_id, model_name=model_name, page_num=p_num)


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