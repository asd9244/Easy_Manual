import logging

import app.config.bootstrap  # noqa: F401

from langchain_ollama import OllamaEmbeddings

from app.config.settings import get_settings
from app.neo4j_driver import get_neo4j_driver

logger = logging.getLogger(__name__)

_s = get_settings()
embeddings_model = OllamaEmbeddings(
    model=_s.embed_model,
    base_url=_s.ollama_base_url,
)


def create_vector_index(session):
    logger.info("Vector Index 세팅 중...")
    session.run("DROP INDEX page_text_embeddings IF EXISTS")
    session.run("""
        CREATE VECTOR INDEX page_text_embeddings IF NOT EXISTS
        FOR (p:Page) ON (p.embedding)
        OPTIONS {indexConfig: {
            `vector.dimensions`: 1024,
            `vector.similarity_function`: 'cosine'
        }}
    """)
    logger.info("Index 생성 완료.")


def update_embeddings(tx, model_name):
    # 아직 임베딩이 없는 페이지만 가져오기
    result = tx.run("""
        MATCH (p:Page {product_name: $model_name})
        WHERE p.text IS NOT NULL AND p.embedding IS NULL
        RETURN elementId(p) AS node_id, p.text AS text, p.page_num AS page_num
    """, model_name=model_name)

    records = list(result)
    if not records:
        logger.info("[%s] 모든 페이지가 이미 벡터화되어 있습니다.", model_name)
        return

    logger.info("[%s] 총 %s개 페이지 벡터화 시작...", model_name, len(records))

    for record in records:
        try:
            node_id = record["node_id"]
            text = record["text"]
            page_num = record["page_num"]

            embedding_vector = embeddings_model.embed_query(text)

            tx.run("""
                MATCH (p:Page) WHERE elementId(p) = $node_id
                SET p.embedding = $embedding
            """, node_id=node_id, embedding=embedding_vector)

            logger.info("%s페이지 완료", page_num)
        except Exception as e:
            logger.warning("%s페이지 실패: %s", record["page_num"], e)
            continue


def run_vectorization(model_name: str):
    driver = get_neo4j_driver()
    with driver.session() as session:
        create_vector_index(session)
        session.execute_write(update_embeddings, model_name)
        logger.info("[%s] 벡터화 공정 종료", model_name)


if __name__ == "__main__":
    run_vectorization("GMDS_MFL71890611_05_250625_00_WEB")
