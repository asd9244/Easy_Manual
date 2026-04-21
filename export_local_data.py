from neo4j import GraphDatabase
import json

URI = "bolt://localhost:7687"
AUTH = ("neo4j", "12341234")

def export_sections():
    driver = GraphDatabase.driver(URI, auth=AUTH)
    with driver.session() as session:
        # 모든 섹션의 제품명, 목차위치, 전체 텍스트를 가져옵니다.
        query = "MATCH (s:Section) RETURN s.product_name as product, s.hierarchy as hierarchy, s.combined_text as text"
        result = session.run(query)
        
        data_cache = {}
        count = 0
        
        for record in result:
            product = record['product']
            hierarchy = record['hierarchy']
            text = record['text']
            
            # '[시각 정보 설명]' 부분만 추출합니다.
            if "[시각 정보 설명]" in text:
                visual_desc = text.split("[시각 정보 설명]")[-1].strip()
                
                if product not in data_cache:
                    data_cache[product] = {}
                
                # '목차위치'를 키로 해서 저장합니다.
                data_cache[product][hierarchy] = visual_desc
                count += 1
        
        print(f"📊 총 {count}개의 시각 정보 설명을 추출했습니다.")
        
        # JSON 파일로 저장
        with open("section_cache.json", "w", encoding="utf-8") as f:
            json.dump(data_cache, f, ensure_ascii=False, indent=2)
        
        print("✅ 'section_cache.json' 파일이 생성되었습니다!")

    driver.close()

if __name__ == "__main__":
    export_sections()
