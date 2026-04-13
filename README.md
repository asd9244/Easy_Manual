# Fixie (Easy_Manual)

전자제품에 대한 질문을 매뉴얼 데이터를 기반으로 답변하는 서비스입니다.

## 구성 요약

| 구분              | 경로                            | 포트     | 역할                                                                |
| ----------------- | ------------------------------- | -------- | ------------------------------------------------------------------- |
| 프론트엔드        | `em-project/frontend`           | **3000** | React, Vite — `/api` 등을 Spring으로 프록시                         |
| API (Spring Boot) | `em-project/spring-backend`     | **8080** | 인증(JWT·OAuth2), PostgreSQL 영속성, 채팅 API — AI는 FastAPI에 위임 |
| AI (FastAPI)      | `em-project/ai-backend`         | **8000** | Neo4j 벡터 검색, 임베딩(Ollama), LLM(Gemini 등)                     |
| 데이터 파이프라인 | `em-project/ai-backend/scripts` | —        | PDF·OCR·Neo4j 적재 (`run_pipeline.py` 등)                           |

외부 저장소는 저장소 루트의 [docker-compose.yml](docker-compose.yml)로 기동합니다.

| 서비스        | 포트                               | 기본 계정·DB (compose 기준)                     |
| ------------- | ---------------------------------- | ----------------------------------------------- |
| PostgreSQL 18 | **5432**                           | DB `pixie`, 사용자 `postgres` / 비밀번호 `1234` |
| Neo4j 5       | **7474**(브라우저), **7687**(Bolt) | 사용자 `neo4j` / 비밀번호 `12341234`            |

## 권장 실행 순서 (로컬)

1. **Docker**  
   저장소 루트에서 PostgreSQL·Neo4j를 띄웁니다.  
   `docker compose up -d` (또는 `docker-compose up -d`)

2. **환경 변수**
   - Spring: `em-project/spring-backend/.env.example` → `.env`로 복사 후 수정
   - AI: `em-project/ai-backend/.env.example` → `.env`로 복사 후 `GOOGLE_API_KEY` 등 설정
   - 프론트(선택): `em-project/frontend/.env.example` 참고

   Spring은 `application.yaml`에서 `optional:file:.env`를 읽습니다. **실행 작업 디렉터리**가 `spring-backend`일 때 같은 폴더의 `.env`가 사용됩니다.

3. **Ollama (임베딩)**  
   AI 채팅 라우트는 `http://127.0.0.1:11434`에서 **모델 `bge-m3`** 를 사용합니다. Ollama를 별도 설치·실행한 뒤 해당 모델을 받아 두어야 합니다.

4. **Spring Boot**  
   `em-project/spring-backend`에서 애플리케이션 실행 (Gradle: `./gradlew bootRun`, Windows는 `gradlew.bat bootRun`). 포트 **8080**.

5. **FastAPI**  
   `em-project/ai-backend`에서 가상환경·의존성 설치 후, 예: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`. 포트 **8000**.  
   Spring의 [WebClientConfig](em-project/spring-backend/src/main/java/com/easymanual/springbackend/global/config/WebClientConfig.java) 기본값이 `http://localhost:8000`입니다.

6. **프론트엔드**  
   `em-project/frontend`에서 `npm install` 후 `npm run dev` — 포트 **3000**.

## 의존 관계 (요청 흐름)

- 브라우저 → **Vite(3000)** → 프록시 → **Spring(8080)** → **PostgreSQL**
- 채팅 질의 시: **Spring** → **FastAPI(8000)** → **Neo4j** + **Ollama** + **Google API**(Gemini)

매뉴얼 그래프·벡터 데이터는 Python 스크립트로 Neo4j에 적재해야 하며, Spring `Manual` 메타데이터와 `manual_id`(매뉴얼 코드)가 AI 쪽 `product_name` 필터와 일치해야 질의응답이 동작합니다.

## 인증·CORS 참고

- 프론트는 `localhost:3000` / `127.0.0.1:3000` 만 [SecurityConfig](em-project/spring-backend/src/main/java/com/easymanual/springbackend/global/config/SecurityConfig.java) CORS에 허용되어 있습니다.
- 소셜 로그인(Google/Kakao)을 쓰려면 `.env`의 OAuth 클라이언트 값을 실제 키로 채워야 합니다. 이메일 가입·로그인만 사용하는 경우에도 `application.yaml` 플레이스홀더 때문에 빈 값이면 기동이 실패할 수 있으므로, 로컬용 더미 값이 필요하면 팀 규칙에 맞게 설정하세요.

## 환경 정합성 체크리스트

- [ ] Docker에서 Postgres·Neo4j가 떠 있고, `.env`의 DB·Neo4j URL·비밀번호가 compose와 동일한지
- [ ] `JWT_SECRET`·`JWT_EXPIRATION`(밀리초) 설정
- [ ] AI: `NEO4J_*`, `GOOGLE_API_KEY`, Ollama `bge-m3`
- [ ] 포트 **3000 / 8080 / 8000** 이 충돌하지 않는지

자세한 변수 목록은 각 디렉터리의 `.env.example`을 참고하세요.
