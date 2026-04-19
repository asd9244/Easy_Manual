"""
LLM/임베딩 인스턴스를 모듈 레벨 싱글톤으로 공유하는 모듈.

gemma4:e4b 같은 무거운 모델을 노드마다 새로 로드하면 Ollama가 매번 워밍업을
반복해 Router 지연이 커진다. Answerer/Router가 동일 인스턴스를 참조하도록
이 모듈을 경유한다.
"""

from __future__ import annotations

import os

from langchain_ollama import ChatOllama, OllamaEmbeddings


_OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")

# 답변/요약/Router 모두 동일 모델을 공유한다. Router에서 가벼운 분류만 돌릴
# 때는 max_tokens를 작게 제한해 지연을 줄인다 (router.py 참고).
_ANSWER_MODEL = os.getenv("ANSWER_MODEL", "gemma4:e4b")
_ROUTER_MODEL = os.getenv("ROUTER_MODEL", _ANSWER_MODEL)
_EMBED_MODEL = os.getenv("EMBED_MODEL", "bge-m3")


embeddings_model = OllamaEmbeddings(model=_EMBED_MODEL, base_url=_OLLAMA_BASE)

answer_llm = ChatOllama(
    model=_ANSWER_MODEL,
    base_url=_OLLAMA_BASE,
    temperature=0.1,
)

# Router는 분류 목적이라 짧은 출력만 요구한다. temperature=0으로 고정해 같은
# 질문이 같은 intent로 라우팅되도록 한다.
router_llm = ChatOllama(
    model=_ROUTER_MODEL,
    base_url=_OLLAMA_BASE,
    temperature=0.0,
    num_predict=32,
)


def llm_text(response) -> str:
    """ChatOllama 응답의 content가 문자열/리스트 어느 쪽이든 텍스트로 평탄화."""

    if isinstance(response.content, list):
        return "".join(
            str(item.get("text", ""))
            for item in response.content
            if isinstance(item, dict) and "text" in item
        )
    return str(response.content)
