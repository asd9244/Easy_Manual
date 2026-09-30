# syntax=docker/dockerfile:1
# -----------------------------------------------------------------------------
# FastAPI(AI) 이미지 — Python 의존성 설치 후 uvicorn 으로 8000 포트에서 서비스
# -----------------------------------------------------------------------------

FROM python:3.12-slim-bookworm

WORKDIR /app

# opencv-python 이 이미지에서 동작하려면 시스템에 OpenGL/GLIB 등이 필요(apt)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libgl1 \
        libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 먼저 requirements 만 복사하면 소스 변경 시 pip 캐시를 더 잘 탐
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app app
COPY scripts scripts

EXPOSE 8000
# 0.0.0.0 — 컨테이너 "밖"(호스트·다른 컨테이너)에서 접속 가능하게 바인딩
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
