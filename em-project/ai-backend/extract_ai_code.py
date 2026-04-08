import os

# ==========================================
# ⚙️ 추출 설정 (AI 서버 맞춤형)
# ==========================================
# 1. 무시할 폴더들 (가상환경, 캐시, 데이터 폴더 등은 AI에게 필요 없음)
IGNORE_DIRS = {
    '.git', '.idea', '.vscode', '__pycache__',
    'venv', '.venv', 'env',
    'data', 'marked_images', 'uploads'  # 🌟 이미지나 PDF 원본 데이터 폴더는 제외!
}

# 2. 추출할 파일 확장자 및 특정 파일명 (FastAPI 핵심 파일들)
ALLOWED_EXTENSIONS = {'.py', '.env', '.txt', '.md'}
ALLOWED_FILES = {'requirements.txt', '.env', 'docker-compose.yml'}  # 확장자가 없거나 특정 이름인 파일들

# 3. 결과물이 저장될 파일 이름
OUTPUT_FILE = "ai_code_context.txt"


def generate_tree(startpath):
    """프로젝트의 폴더 구조(Tree)를 문자열로 만들어주는 함수"""
    tree_str = "📂 [AI 서버 프로젝트 폴더 구조]\n"
    for root, dirs, files in os.walk(startpath):
        # 무시할 폴더 제외 (리스트 슬라이싱으로 원본 리스트 수정)
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        level = root.replace(startpath, '').count(os.sep)
        indent = ' ' * 4 * (level)
        tree_str += f"{indent}📁 {os.path.basename(root)}/\n"

        subindent = ' ' * 4 * (level + 1)
        for f in files:
            if any(f.endswith(ext) for ext in ALLOWED_EXTENSIONS) or f in ALLOWED_FILES:
                # 자기 자신(추출 스크립트)과 결과물 파일은 제외
                if f not in [os.path.basename(__file__), OUTPUT_FILE]:
                    tree_str += f"{subindent}📄 {f}\n"
    return tree_str + "\n" + "=" * 50 + "\n\n"


def extract_code(startpath):
    """파일의 실제 내용들을 읽어서 하나의 문자열로 합쳐주는 함수"""
    content_str = "💻 [AI 서버 소스 코드 상세 내용]\n\n"

    for root, dirs, files in os.walk(startpath):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for file in files:
            if any(file.endswith(ext) for ext in ALLOWED_EXTENSIONS) or file in ALLOWED_FILES:
                if file in [os.path.basename(__file__), OUTPUT_FILE]:
                    continue  # 자기 자신과 결과물 파일은 건너뜀

                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, startpath)

                content_str += f"### File: {relative_path} ###\n"

                # 마크다운 코드 블록 언어 설정
                lang = "python" if file.endswith(".py") else "text"
                content_str += f"```{lang}\n"

                try:
                    # 한글 주석 깨짐 방지를 위해 utf-8로 읽기
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content_str += f.read() + "\n"
                except Exception as e:
                    content_str += f"// 파일 읽기 오류: {e}\n"

                content_str += "```\n\n"
    return content_str


if __name__ == "__main__":
    # 현재 스크립트가 실행되는 위치 (ai-backend 폴더)
    current_dir = os.path.abspath(".")

    print("🚀 AI 서버(FastAPI) 코드 추출을 시작합니다...")

    # 1. 폴더 구조 생성
    tree_output = generate_tree(current_dir)

    # 2. 코드 내용 추출
    code_output = extract_code(current_dir)

    # 3. 하나의 텍스트 파일로 저장 (한글 깨짐 방지 utf-8)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(tree_output)
        f.write(code_output)

    print(f"🎉 추출 완료! '{OUTPUT_FILE}' 파일이 생성되었습니다.")
    print("이 파일의 내용을 복사해서 AI에게 먹여주세요!")