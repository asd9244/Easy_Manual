import os
import json
import fitz  # PyMuPDF 라이브러리


def extract_text_from_pdf(pdf_path: str, output_base_dir: str, model_name: str):
    """
    PDF 파일에서 페이지별로 텍스트를 추출하여 JSON 파일로 저장하는 함수.
    (다른 매뉴얼이 와도 model_name만 바꾸면 계속 재사용 가능합니다!)

    :param pdf_path: 원본 PDF 파일의 경로
    :param output_base_dir: JSON 파일이 저장될 최상위 폴더 (예: data/extracted_texts)
    :param model_name: 제품 모델명 (예: lg_aircon)
    """

    # 1. 저장할 폴더 만들기 (data/extracted_texts/lg_aircon)
    output_dir = os.path.join(output_base_dir, model_name)
    os.makedirs(output_dir, exist_ok=True)

    # 최종 저장될 JSON 파일 경로 (예: lg_aircon_text.json)
    json_filepath = os.path.join(output_dir, f"{model_name}_text.json")

    # 추출한 데이터를 차곡차곡 담을 빈 리스트
    extracted_data = []

    print(f" [{model_name}] 텍스트 추출 시작... (경로: {pdf_path})")

    try:
        # 2. PDF 문서 열기
        doc = fitz.open(pdf_path)
        total_pages = len(doc)

        # 3. 페이지를 한 장씩 넘기면서 글자만 쏙쏙 뽑아내기
        for page_num in range(total_pages):
            page = doc.load_page(page_num)

            # get_text("text")를 쓰면 해당 페이지의 모든 글자를 가져옵니다.
            raw_text = page.get_text("text")

            # 글자 앞뒤의 쓸데없는 공백이나 줄바꿈 정리 (깔끔하게 만들기)
            clean_text = raw_text.strip()

            # 4. 나중에 DB(Neo4j)에 넣기 딱 좋은 딕셔너리 형태로 포장하기
            page_info = {
                "page_num": page_num + 1,  # 페이지 번호 (1부터 시작)
                "text": clean_text,  # 추출된 전체 텍스트
                # 나중에 프론트엔드에 던져줄 이미지 이름도 미리 적어둡니다.
                "image_filename": f"page_{str(page_num + 1).zfill(2)}.png"
            }

            extracted_data.append(page_info)
            print(f"   ✅ {page_num + 1}페이지 텍스트 추출 완료 ({len(clean_text)} 글자)")

        # 5. 다 뽑은 데이터를 JSON 파일로 예쁘게 저장하기
        with open(json_filepath, "w", encoding="utf-8") as f:
            # ensure_ascii=False 를 해야 한글이 안 깨집니다!
            # indent=4 를 하면 사람이 읽기 좋게 줄바꿈이 됩니다.
            json.dump(extracted_data, f, ensure_ascii=False, indent=4)

        print(f"🎉 추출 완료! 데이터가 '{json_filepath}'에 안전하게 저장되었습니다.\n")
        return json_filepath

    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return None



# 실행 테스트 부분 (직접 실행할 때만 작동함)

if __name__ == "__main__":
    # 현재 파일(ocr_service.py)의 위치를 기준으로 최상위 폴더(ai-backend) 경로 찾기
    current_dir = os.path.dirname(os.path.abspath(__file__))  # app/services
    app_dir = os.path.dirname(current_dir)  # app
    project_root = os.path.dirname(app_dir)  # ai-backend (최상위)

    # 1. 원본 PDF 경로 (아까 이미지 변환할 때 썼던 그 파일)
    my_pdf_path = os.path.join(project_root, "data", "raw_pdf", "GMDS_MFL71839003_13_250911_00_WEB.pdf")

    # 2. 텍스트 데이터가 저장될 폴더 경로
    my_output_dir = os.path.join(project_root, "data", "extracted_texts")

    # 3. 모델명 (다른 매뉴얼 할 때는 이것만 "samsung_tv" 등으로 바꾸면 됩니다!)
    my_model_name = "GMDS_MFL71890611_05_250625_00_WEB"

    # 4. 함수 실행!
    extract_text_from_pdf(
        pdf_path=my_pdf_path,
        output_base_dir=my_output_dir,
        model_name=my_model_name
    )