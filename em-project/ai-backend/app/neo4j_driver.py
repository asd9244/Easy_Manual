"""Neo4j 드라이버 단일 인스턴스 (연결 풀 재사용). ``lifespan`` 종료 시 ``close``."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from app.config.settings import get_settings

if TYPE_CHECKING:
    from neo4j import Driver

logger = logging.getLogger(__name__)

_driver: Driver | None = None


def get_neo4j_driver() -> Driver:
    global _driver
    if _driver is not None:
        return _driver

    s = get_settings()
    uri, user, password = s.neo4j_uri, s.neo4j_user, s.neo4j_password
    if not uri or user is None or password is None:
        raise RuntimeError(
            "NEO4J_URI / NEO4J_USER / NEO4J_PASSWORD 가 설정되지 않았습니다."
        )

    from neo4j import GraphDatabase

    _driver = GraphDatabase.driver(uri, auth=(user, password))
    logger.debug("Neo4j driver initialized")
    return _driver


def close_neo4j_driver() -> None:
    global _driver
    if _driver is not None:
        try:
            _driver.close()
        except Exception:
            logger.exception("Neo4j driver close failed")
        _driver = None
