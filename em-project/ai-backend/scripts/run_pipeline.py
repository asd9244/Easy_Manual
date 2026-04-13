import os
import sys

# 프로젝트 루트 경로를 시스템 경로에 추가 (app 폴더를 찾기 위해)
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

# 우리가 만든 부품(Service)들 불러오기
from app.services.pdf_service import convert_pdf_to_images
from app.services.ocr_service import extract_text_from_pdf
from app.services.toc_service import extract_toc_from_pdf
from scripts.ingest_to_neo4j import run_pipeline as ingest_to_neo4j
from scripts.build_sections import run as build_sections


def run_total_pipeline(pdf_filename, model_name):
    """
    모든 전처리 과정을 한 번에 실행하는 마스터 파이프라인
    """
    print(f"\n{'=' * 50}")
    print(f"[{model_name}] 통합 전처리 파이프라인 가동 시작")
    print(f"{'=' * 50}\n")

    # 0. 경로 설정
    pdf_path = os.path.join(project_root, "data", "raw_pdf", pdf_filename)
    image_output_dir = os.path.join(project_root, "data", "processed_images")
    text_output_dir = os.path.join(project_root, "data", "extracted_texts")
    toc_output_dir = os.path.join(project_root, "data", "extracted_toc")

    # 1. PDF -> 이미지 변환
    print("Step 1: PDF 이미지 변환 진행 중...")
    convert_pdf_to_images(pdf_path, image_output_dir, model_name)

    # 2. 텍스트(OCR) 추출
    print("Step 2: 페이지별 텍스트 추출 진행 중...")
    extract_text_from_pdf(pdf_path, text_output_dir, model_name)

    # 3. 목차(TOC) 추출
    print("Step 3: 목차 계층 구조 추출 진행 중...")
    extract_toc_from_pdf(pdf_path, toc_output_dir, model_name)

    # 4. Neo4j 기본 적재 (Page는 이미지 파일명만, Topic 계층 구조)
    print("Step 4: Neo4j 기본 그래프 적재 진행 중...")
    ingest_to_neo4j(model_name)

    # 5. 섹션 생성 + 제미나이 사전 처리 + 임베딩 + 인덱스 (올인원)
    print("Step 5: 섹션 생성 및 사전 처리 진행 중...")
    build_sections(model_name)

    print(f"\n{'=' * 50}")
    print(f"✅ [{model_name}] 모든 전처리 공정이 완료되었습니다!")
    print(f"이제 Neo4j에서 화려한 그래프를 확인하세요.")
    print(f"{'=' * 50}\n")


if __name__ == "__main__":
    # 🌟 앞으로 매뉴얼이 추가되면 여기 두 줄만 바꾸고 이 파일만 실행하면 끝!
    TARGET_PDF = "REF_KOR_MFL71401523_00_250731_00_OM_WEB.pdf"
    TARGET_MODEL = "REF_KOR_MFL71401523_00_250731_00_OM_WEB"

    run_total_pipeline(TARGET_PDF, TARGET_MODEL)