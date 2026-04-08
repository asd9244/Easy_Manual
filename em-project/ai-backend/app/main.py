from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles # 정적 파일 서빙을 위해 추가
from app.api.routes import chat
import os # 경로 설정을 위해 추가

app = FastAPI(
    title="Pixie AI Backend",
    version="1.0.0"
)

# 매뉴얼 이미지 폴더를 웹으로 개방합니다.
# 프로젝트 최상위의 'data/processed_images' 폴더를 '/manual_images' 라는 URL로 연결합니다.
# 예: http://localhost:8000/manual_images/GMDS_.../page_01.png 로 접속 가능해집니다.
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
images_dir = os.path.join(project_root, "data", "processed_images")

# 폴더가 존재할 때만 마운트하도록 안전장치 추가
if os.path.exists(images_dir):
    app.mount("/manual_images", StaticFiles(directory=images_dir), name="manual_images")

app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

@app.get("/")
def read_root():
    return {"message": "Pixie AI Server is running! 🚀"}