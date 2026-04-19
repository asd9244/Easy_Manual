"""
LangGraph Multi-Agent 오케스트레이션 패키지.

기존 ``app/api/routes/chat.py``가 담당하던 Neo4j 벡터 검색 + gemma4:e4b 답변 생성 +
대화 요약을 Router/Retriever/Answerer/Summarizer/Fallback 다섯 노드로 분해하고,
``StateGraph``로 조립한 뒤 PostgreSQL 체크포인트로 room_id 기반 멀티턴 대화를 지원한다.

외부에는 ``build_graph``와 ``AgentState``만 노출한다.
"""

from app.agents.state import AgentState
from app.agents.graph import build_graph, get_graph

__all__ = ["AgentState", "build_graph", "get_graph"]
