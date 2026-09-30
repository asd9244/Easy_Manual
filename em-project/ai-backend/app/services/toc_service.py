import json
import logging
import os

import fitz  # PyMuPDF 라이브러리

logger = logging.getLogger(__name__)


def extract_toc_from_pdf(pdf_path: str, output_base_dir: str, model_name: str):
    """
    PDF의 내장 북마크(목차)를 추출하여 계층 구조가 포함된 JSON 파일로 저장하는 함수.

    :param pdf_path: 원본 PDF 파일의 경로
    :param output_base_dir: JSON 파일이 저장될 최상위 폴더 (예: data/extracted_toc)
    :param model_name: 제품 모델명 (예: lg_aircon)
    """

    # 1. 저장할 폴더 만들기 (data/extracted_toc/lg_aircon)
    output_dir = os.path.join(output_base_dir, model_name)
    os.makedirs(output_dir, exist_ok=True)

    # 최종 저장될 JSON 파일 경로
    json_filepath = os.path.join(output_dir, f"{model_name}_toc.json")

    logger.info("[%s] PDF 북마크(목차) 추출 시작 (경로: %s)", model_name, pdf_path)

    try:
        # 2. PDF 문서 열기
        doc = fitz.open(pdf_path)

        # 3. PyMuPDF의 강력한 기능! 내장 북마크를 한 번에 리스트로 가져옵니다.
        # 형태: [[레벨, "제목", 페이지번호], [1, "안전을 위해 주의하기", 4],[2, "경고", 4], ...]
        raw_toc = doc.get_toc()

        if not raw_toc:
            logger.warning("이 PDF에는 내장 북마크가 없습니다. 수동 추출이 필요합니다.")
            return None

        structured_toc = []
        current_hierarchy = {}  # 현재 타고 내려가고 있는 목차의 족보를 기억할 딕셔너리

        # 4. 가져온 북마크를 Neo4j에 넣기 좋게 예쁘게 가공하기
        for item in raw_toc:
            level = item[0]  # 1(대분류), 2(중분류), 3(소분류)
            title = item[1].strip()  # 목차 제목 (공백 제거)
            page_num = item[2]  # 해당 페이지 번호

            # 현재 레벨의 제목을 족보에 기록
            current_hierarchy[level] = title

            # 1레벨부터 현재 레벨까지의 경로(Breadcrumb)를 리스트로 만듦
            # 예: ["안전을 위해 주의하기", "경고", "제품을 설치할 때"]
            hierarchy_path = [current_hierarchy[i] for i in range(1, level + 1)]

            toc_node = {
                "level": level,
                "title": title,
                "page_num": page_num,
                "hierarchy": hierarchy_path  # 🌟 나중에 Graph DB 엣지(Edge) 연결할 때 핵심!
            }
            structured_toc.append(toc_node)

            logger.info("[Lv.%s] %s (p.%s)", level, title, page_num)

        # 5. JSON 파일로 저장하기
        with open(json_filepath, "w", encoding="utf-8") as f:
            json.dump(structured_toc, f, ensure_ascii=False, indent=4)

        logger.info(
            "추출 완료: 목차 %s건 → %s",
            len(structured_toc),
            json_filepath,
        )
        return json_filepath

    except Exception as e:
        logger.exception("목차 추출 오류: %s", e)
        return None



# 🚀 실행 테스트 부분

if __name__ == "__main__":
    # 현재 파일(toc_service.py)의 위치: app/services/
    current_dir = os.path.dirname(os.path.abspath(__file__))
    app_dir = os.path.dirname(current_dir)  # app/
    project_root = os.path.dirname(app_dir)  # ai-backend/ (최상위)

    # 1. 원본 PDF 경로
    my_pdf_path = os.path.join(project_root, "data", "raw_pdf", "GMDS_MFL71839003_13_250911_00_WEB.pdf")

    # 2. 목차 데이터가 저장될 폴더 경로
    my_output_dir = os.path.join(project_root, "data", "extracted_toc")

    # 3. 모델명
    my_model_name = "GMDS_MFL71890611_05_250625_00_WEB"

    # 4. 함수 실행!
    extract_toc_from_pdf(
        pdf_path=my_pdf_path,
        output_base_dir=my_output_dir,
        model_name=my_model_name
    )