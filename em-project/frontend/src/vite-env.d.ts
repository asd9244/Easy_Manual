/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** axios `baseURL` (예: `/api` 또는 절대 URL). 미설정 시 `/api`. */
  readonly VITE_API_BASE_URL?: string;
  /** Vite dev 프록시: Spring Boot. 미설정 시 `http://localhost:8080`. */
  readonly VITE_PROXY_SPRING_ORIGIN?: string;
  /** Vite dev 프록시: FastAPI(매뉴얼 이미지). 미설정 시 `http://localhost:8000`. */
  readonly VITE_PROXY_AI_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
