from fastapi import FastAPI
from app.api.routes import chat  # 🌟 방금 만든 라우터 불러오기

app = FastAPI(
    title="Pixie AI Backend",
    version="1.0.0"
)

# 🌟 라우터 등록 (Spring의 @RequestMapping("/api/chat") 과 같은 역할)
# 유비콘 서버 실행 코드: uvicorn app.main:app --reload
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

@app.get("/")
def read_root():
    return {"message": "Pixie AI Server is running! 🚀"}