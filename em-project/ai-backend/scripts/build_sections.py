"""
[핵심 스크립트] 섹션 중심 DB 구축

TOC Level 3 기준으로 섹션을 분할하고:
1. 섹션별 페이지 이미지를 제미나이로 사전 처리 (시각 정보 텍스트화)
2. OCR 텍스트 + visual_description을 합산하여 combined_text 생성
3. bge-m3로 임베딩
4. Section 노드 생성 + 벡터 인덱스 생성
"""

import os
import sys
import json
import time
import base64

sys.stdout.reconfigure(encoding='utf-8')

# Windows 버퍼링 문제 해결: 모든 print를 즉시 출력
import builtins
_original_print = builtins.print
def print(*args, **kwargs):
    kwargs.setdefault('flush', True)
    _original_print(*args, **kwargs)

from neo4j import GraphDatabase
from langchain_ollama import OllamaEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv

load_dotenv()
URI = os.getenv("NEO4J_URI")
USER = os.getenv("NEO4J_USER")
PASSWORD = os.getenv("NEO4J_PASSWORD")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# 모델 초기화
embeddings_model = OllamaEmbeddings(model="bge-m3", base_url="http://127.0.0.1:11434")
vlm = ChatGoogleGenerativeAI(model="gemini-3.1-pro-preview", google_api_key=GOOGLE_API_KEY, temperature=0.1)


# ==========================================
# Step 1: TOC에서 Level 3 섹션 경계 계산
# ==========================================
def calculate_section_boundaries(toc_data, total_pages):
    """
    TOC Level 3 항목을 기준으로 섹션 경계를 계산합니다.
    Level 4 항목은 해당 Level 3 섹션에 자동 포함됩니다.
    """
    # Level 3 항목만 추출
    level3_items = [item for item in toc_data if item['level'] == 3]

    sections = []
    for i, item in enumerate(level3_items):
        start_page = item['page_num']

        # 다음 Level 3 항목의 시작 페이지로 끝 경계 계산
        if i + 1 < len(level3_items):
            next_start = level3_items[i + 1]['page_num']
            # 다음 섹션이 같은 페이지에서 시작하면, 현재 섹션은 해당 페이지만 포함
            end_page = next_start if next_start > start_page else start_page
        else:
            end_page = total_pages  # 마지막 섹션은 매뉴얼 끝까지

        sections.append({
            'title': item['title'],
            'hierarchy': ' > '.join(item['hierarchy']),
            'start_page': start_page,
            'end_page': end_page,
            'page_range': list(range(start_page, end_page + 1))
        })

    return sections


# ==========================================
# Step 2: 섹션별 제미나이 시각 정보 추출
# ==========================================
def extract_visual_description(section, images_dir, model_name):
    """
    섹션에 해당하는 페이지 이미지들을 묶어서 제미나이에게 전송하고,
    시각 정보를 텍스트로 추출합니다.
    """
    content_blocks = [
        {
            "type": "text",
            "text": f"""이것은 [{section['title']}] 섹션에 해당하는 매뉴얼 {section['start_page']}~{section['end_page']}페이지입니다.
각 페이지의 시각적 요소(표, 그림, 다이어그램, 버튼 배치, 아이콘 등)를 페이지별로 구분하여 텍스트로 상세히 설명해주세요.
OCR이 놓칠 수 있는 시각적 정보에 집중해주세요. 특히:
- 표가 있으면 표의 내용을 텍스트로 재구성
- 그림/다이어그램이 있으면 위치, 내용, 화살표 방향 등을 설명
- 버튼 배치도가 있으면 각 버튼의 이름과 위치를 설명
- 아이콘이나 기호가 있으면 의미를 설명"""
        }
    ]

    image_count = 0
    for page_num in section['page_range']:
        img_filename = f"page_{page_num:02d}.png"
        img_path = os.path.join(images_dir, model_name, img_filename)

        if os.path.exists(img_path):
            content_blocks.append({
                "type": "text",
                "text": f"[아래는 매뉴얼 {page_num}페이지 원본 이미지입니다]"
            })
            with open(img_path, "rb") as f:
                encoded = base64.b64encode(f.read()).decode('utf-8')
                content_blocks.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{encoded}"}
                })
            image_count += 1

    if image_count == 0:
        return ""

    try:
        messages = [HumanMessage(content=content_blocks)]
        response = vlm.invoke(messages)

        if isinstance(response.content, list):
            return "".join([str(item.get("text", "")) for item in response.content if isinstance(item, dict) and "text" in item])
        return str(response.content)
    except Exception as e:
        print(f"      [!] 제미나이 호출 실패: {e}")
        return ""


# ==========================================
# Step 3~6: 섹션 생성, 임베딩, DB 저장
# ==========================================
def build_sections_for_manual(model_name):
    """
    특정 매뉴얼에 대해 섹션을 생성하고 DB에 저장합니다.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)

    # 파일 경로
    ocr_json_path = os.path.join(project_root, "data", "extracted_texts", model_name, f"{model_name}_text.json")
    toc_json_path = os.path.join(project_root, "data", "extracted_toc", model_name, f"{model_name}_toc.json")
    images_dir = os.path.join(project_root, "data", "processed_images")

    # 데이터 읽기
    if not os.path.exists(ocr_json_path) or not os.path.exists(toc_json_path):
        print(f"[ERROR] [{model_name}] OCR 또는 TOC JSON 파일이 없습니다.")
        return

    with open(ocr_json_path, "r", encoding="utf-8") as f:
        ocr_data = json.load(f)
    with open(toc_json_path, "r", encoding="utf-8") as f:
        toc_data = json.load(f)

    total_pages = len(ocr_data)
    # OCR 데이터를 page_num 기준으로 딕셔너리화
    ocr_by_page = {page['page_num']: page['text'] for page in ocr_data}

    print("=" * 50)
    print(f"[build_sections] [{model_name}] 섹션 생성 시작")
    print(f"   총 페이지: {total_pages}, TOC 항목: {len(toc_data)}개")
    print("=" * 50)

    # Step 1: 섹션 경계 계산
    sections = calculate_section_boundaries(toc_data, total_pages)
    print(f"\n[Step 1] Level 3 기준 {len(sections)}개 섹션 분할 완료")

    for s in sections:
        print(f"   - {s['title']} (p{s['start_page']}~p{s['end_page']})")

    # Step 2~5: 각 섹션별 처리
    print(f"\n[Step 2~5] 섹션별 사전 처리 + 임베딩 + DB 저장 시작")

    with GraphDatabase.driver(URI, auth=(USER, PASSWORD)) as driver:
        with driver.session() as session:

            # 기존 Section 노드가 있으면 삭제 (재실행 대비)
            session.run("""
                MATCH (s:Section {product_name: $model_name})
                DETACH DELETE s
            """, model_name=model_name)

            for idx, section in enumerate(sections):
                print(f"\n   [{idx+1}/{len(sections)}] '{section['title']}' (p{section['start_page']}~p{section['end_page']})")

                # 2-1: OCR 텍스트 합산 (JSON에서 직접 읽기)
                ocr_texts = []
                for page_num in section['page_range']:
                    if page_num in ocr_by_page:
                        ocr_texts.append(f"--- {page_num}페이지 ---\n{ocr_by_page[page_num]}")
                ocr_combined = "\n\n".join(ocr_texts)

                # 2-2: 제미나이 시각 정보 추출
                print(f"      -> 제미나이 시각 정보 추출 중...")
                visual_desc = extract_visual_description(section, images_dir, model_name)

                if visual_desc:
                    print(f"      -> 시각 정보 추출 완료 ({len(visual_desc)}자)")
                else:
                    print(f"      -> 시각 정보 없음 (이미지 미존재 또는 호출 실패)")

                # 3: combined_text 조립
                combined_text = f"[목차 위치: {section['hierarchy']}]\n\n"
                combined_text += f"[OCR 텍스트]\n{ocr_combined}\n\n"
                if visual_desc:
                    combined_text += f"[시각 정보 설명]\n{visual_desc}"

                # 4: 임베딩
                print(f"      -> bge-m3 임베딩 중...")
                embedding = embeddings_model.embed_query(combined_text)

                # 5: Neo4j에 Section 노드 생성
                print(f"      -> Section 노드 DB 저장 중...")
                session.run("""
                    MATCH (prod:Product {name: $model_name})
                    CREATE (s:Section {
                        title: $title,
                        hierarchy: $hierarchy,
                        combined_text: $combined_text,
                        embedding: $embedding,
                        product_name: $model_name,
                        start_page: $start_page,
                        end_page: $end_page
                    })
                    MERGE (prod)-[:HAS_SECTION]->(s)
                """,
                    model_name=model_name,
                    title=section['title'],
                    hierarchy=section['hierarchy'],
                    combined_text=combined_text,
                    embedding=embedding,
                    start_page=section['start_page'],
                    end_page=section['end_page']
                )

                # Section -> Page 관계 연결 (COVERS_PAGE)
                for page_num in section['page_range']:
                    session.run("""
                        MATCH (s:Section {product_name: $model_name, title: $title, start_page: $start_page})
                        MATCH (pg:Page {product_name: $model_name, page_num: $page_num})
                        MERGE (s)-[:COVERS_PAGE]->(pg)
                    """,
                        model_name=model_name,
                        title=section['title'],
                        start_page=section['start_page'],
                        page_num=page_num
                    )

                print(f"      -> 완료!")

                # API 과부하 방지
                if idx < len(sections) - 1:
                    time.sleep(2)

            # Step 6: 벡터 인덱스 생성
            print(f"\n[Step 6] section_text_embeddings 벡터 인덱스 생성 중...")
            session.run("DROP INDEX section_text_embeddings IF EXISTS")
            session.run("""
                CREATE VECTOR INDEX section_text_embeddings IF NOT EXISTS
                FOR (s:Section) ON (s.embedding)
                OPTIONS {indexConfig: {
                    `vector.dimensions`: 1024,
                    `vector.similarity_function`: 'cosine'
                }}
            """)
            print("   -> 벡터 인덱스 생성 완료")

            # 최종 확인
            result = session.run("""
                MATCH (s:Section {product_name: $model_name})
                RETURN count(s) AS section_count
            """, model_name=model_name)
            count = result.single()["section_count"]

    print("\n" + "=" * 50)
    print(f"[완료] [{model_name}] {count}개 Section 노드 생성 완료!")
    print("=" * 50)


def run(model_name: str):
    build_sections_for_manual(model_name)


if __name__ == "__main__":
    run("GMDS_MFL71890611_05_250625_00_WEB")
