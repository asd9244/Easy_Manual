import logging
import os

import fitz  # PyMuPDF 라이브러리

logger = logging.getLogger(__name__)


def convert_pdf_to_images(pdf_path: str, output_base_dir: str, model_name: str, dpi: int = 200):
    """
    PDF 파일을 페이지별 고화질 이미지(PNG)로 변환하여 로컬 폴더에 저장하는 함수.

    :param pdf_path: 원본 PDF 파일의 경로
    :param output_base_dir: 이미지가 저장될 최상위 폴더 경로 (예: data/processed_images)
    :param model_name: 제품 모델명 (이 이름으로 하위 폴더가 생성됨)
    :param dpi: 해상도 (기본 200. OCR 및 Vision AI 인식을 위해 고화질 권장)
    :return: 생성된 이미지들의 저장 경로 리스트
    """

    # 1. 제품 모델명으로 전용 저장 폴더 생성 (예: data/processed_images/lg_aircon)
    output_dir = os.path.join(output_base_dir, model_name)
    os.makedirs(output_dir, exist_ok=True)

    # 생성된 이미지 경로를 담을 리스트
    saved_image_paths = []

    logger.info("[%s] PDF 변환 시작 (경로: %s)", model_name, pdf_path)

    try:
        # 2. PDF 문서 열기
        doc = fitz.open(pdf_path)
        total_pages = len(doc)

        # 해상도 설정 (Zoom 팩터 계산)
        # PyMuPDF 기본 DPI는 72이므로, 200 DPI를 원하면 약 2.7배 확대해야 함
        zoom_factor = dpi / 72.0
        matrix = fitz.Matrix(zoom_factor, zoom_factor)

        # 3. 페이지별로 돌면서 이미지로 변환
        for page_num in range(total_pages):
            page = doc.load_page(page_num)  # 페이지 로드
            pix = page.get_pixmap(matrix=matrix)  # 이미지로 렌더링

            # 파일명 지정 (예: page_01.png, page_02.png)
            # zfill(2)는 한 자리 숫자일 경우 앞에 0을 붙여줍니다 (1 -> 01)
            image_filename = f"page_{str(page_num + 1).zfill(2)}.png"
            image_filepath = os.path.join(output_dir, image_filename)

            # 이미지 파일 저장
            pix.save(image_filepath)
            saved_image_paths.append(image_filepath)

            logger.info("저장 완료: %s (%s/%s)", image_filename, page_num + 1, total_pages)

        logger.info("변환 완료: 총 %s장 → %s", total_pages, output_dir)
        return saved_image_paths

    except Exception as e:
        logger.exception("PDF 변환 오류: %s", e)
        return

# 실제로 함수를 실행하는 부분

if __name__ == "__main__":
    # 1. 현재 스크립트(pdf_service.py)의 위치를 기준으로 절대 경로를 자동으로 잡기 위한 팁
    # (이렇게 하면 윈도우/맥 상관없이, 폴더 위치가 바뀌어도 에러가 안 납니다)
    current_dir = os.path.dirname(os.path.abspath(__file__)) # scripts 폴더 위치
    project_root = os.path.dirname(current_dir)              # ai-backend 폴더 위치 (최상위)

    # 2. 내가 변환할 원본 PDF 파일의 실제 위치
    # (미리 data/raw_pdf 폴더 안에 매뉴얼 pdf를 넣어두셔야 합니다!)
    my_pdf_path = os.path.join(project_root, "data", "raw_pdf", "GMDS_MFL71890611_05_250625_00_WEB")

    # 3. 이미지가 저장될 최상위 폴더 위치
    my_output_dir = os.path.join(project_root, "data", "processed_images")

    # 4. 이 매뉴얼의 모델명 (이 이름으로 폴더가 예쁘게 자동 생성됩니다)
    my_model_name = "lg_aircon"

    # 5. 드디어 함수 실행! (위에서 적은 변수들을 함수 구멍에 쏙쏙 넣어줍니다)
    convert_pdf_to_images(
        pdf_path=my_pdf_path,
        output_base_dir=my_output_dir,
        model_name=my_model_name,
        dpi=200 # 화질 설정 (필요시 300으로 올리면 더 선명해집니다)
    )