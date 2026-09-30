import logging
from contextlib import asynccontextmanager

import app.config.bootstrap  # noqa: F401 — .env 로드 (다른 app import보다 먼저)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
    force=True,
)

import os

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.routes import chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    try:
        from app.agents.graph import shutdown_checkpoint_resources
        from app.neo4j_driver import close_neo4j_driver

        shutdown_checkpoint_resources()
        close_neo4j_driver()
    except Exception:
        logging.getLogger(__name__).exception("lifespan shutdown cleanup failed")


app = FastAPI(
    title="Pixie AI Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# 매뉴얼 이미지 폴더를 웹으로 개방합니다.
# 프로젝트 최상위의 'data/processed_images' 폴더를 '/manual_images' 라는 URL로 연결합니다.
# 예: http://localhost:8000/manual_images/GMDS_.../page_01.png 로 접속 가능해집니다.
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
images_dir = os.path.join(project_root, "data", "processed_images")

if os.path.exists(images_dir):
    app.mount("/manual_images", StaticFiles(directory=images_dir), name="manual_images")

app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])


@app.get("/")
def read_root():
    return {"message": "Pixie AI Server is running! 🚀"}
