# syntax=docker/dockerfile:1
# -----------------------------------------------------------------------------
# React(Vite) 개발 서버 이미지 — 프로덕션용 nginx 정적 빌드가 아니라 npm run dev 입니다.
# 브라우저 → localhost:3000, Vite 가 spring/ai 로 프록시(compose 의 VITE_PROXY_* 참고)
# -----------------------------------------------------------------------------

FROM node:22-bookworm-slim

WORKDIR /app

# package-lock.json 이 있으면 npm ci 로 재현 가능한 설치
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
