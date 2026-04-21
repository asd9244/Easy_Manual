from neo4j import GraphDatabase

URI = "bolt://localhost:7687"
AUTH = ("neo4j", "12341234") # 로컬 비번

def check_data():
    driver = GraphDatabase.driver(URI, auth=AUTH)
    with driver.session() as session:
        # 시각 정보([시각 정보 설명])가 포함된 섹션 노드를 찾습니다.
        query = """
        MATCH (s:Section) 
        WHERE s.combined_text CONTAINS '[시각 정보 설명]'
        RETURN count(s) as count, s.product_name as product
        LIMIT 5
        """
        result = session.run(query)
        print("=== 로컬 데이터 확인 결과 ===")
        found = False
        for record in result:
            found = True
            print(f"📍 제품: {record['product']} | 시각 정보가 포함된 섹션: {record['count']}개")
        
        if not found:
            print("❌ 시각 정보([시각 정보 설명])가 포함된 데이터를 찾지 못했습니다.")
            print("팁: 젬마가 분석할 때 다른 키워드를 썼을 수도 있으니, s.combined_text 내용을 한번 확인해볼까요?")

    driver.close()

if __name__ == "__main__":
    check_data()
