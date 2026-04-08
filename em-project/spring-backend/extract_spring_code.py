import os

# ==========================================
# ⚙️ 추출 설정
# ==========================================
# 1. 무시할 폴더들 (빌드 찌꺼기, 설정 폴더 등은 AI에게 필요 없음)
IGNORE_DIRS = {'.git', '.gradle', '.idea', 'build', 'out', 'target', 'venv', '.venv', 'node_modules'}

# 2. 추출할 파일 확장자 (Spring Boot 핵심 파일들만)
ALLOWED_EXTENSIONS = {'.java', '.yml', '.yaml', '.properties', '.gradle'}

# 3. 결과물이 저장될 파일 이름
OUTPUT_FILE = "spring_code_context.txt"

def generate_tree(startpath):
    """프로젝트의 폴더 구조(Tree)를 문자열로 만들어주는 함수"""
    tree_str = "📂 [프로젝트 폴더 구조]\n"
    for root, dirs, files in os.walk(startpath):
        # 무시할 폴더 제외
        dirs[:] =[d for d in dirs if d not in IGNORE_DIRS]

        level = root.replace(startpath, '').count(os.sep)
        indent = ' ' * 4 * (level)
        tree_str += f"{indent}📁 {os.path.basename(root)}/\n"

        subindent = ' ' * 4 * (level + 1)
        for f in files:
            if any(f.endswith(ext) for ext in ALLOWED_EXTENSIONS):
                tree_str += f"{subindent}📄 {f}\n"
    return tree_str + "\n" + "="*50 + "\n\n"

def extract_code(startpath):
    """파일의 실제 내용들을 읽어서 하나의 문자열로 합쳐주는 함수"""
    content_str = "💻[소스 코드 상세 내용]\n\n"

    for root, dirs, files in os.walk(startpath):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for file in files:
            if any(file.endswith(ext) for ext in ALLOWED_EXTENSIONS):
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, startpath)

                content_str += f"### File: {relative_path} ###\n"
                content_str += "```" + ("java" if file.endswith(".java") else "yaml" if file.endswith((".yml", ".yaml")) else "groovy") + "\n"

                try:
                    # 한글 깨짐 방지를 위해 utf-8로 읽기
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content_str += f.read() + "\n"
                except Exception as e:
                    content_str += f"// 파일 읽기 오류: {e}\n"

                content_str += "```\n\n"
    return content_str

if __name__ == "__main__":
    # 현재 스크립트가 실행되는 위치 (spring-backend 폴더)
    current_dir = os.path.abspath(".")

    print("🚀 Spring Boot 코드 추출을 시작합니다...")

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