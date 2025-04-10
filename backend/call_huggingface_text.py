from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline

app = FastAPI()

# 跨域配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

classifier = pipeline("text-classification", model="FacebookAI/xlm-roberta-base", tokenizer="FacebookAI/xlm-roberta-base")

@app.post("/analyze/huggingface")
async def analyze_text(request: Request):
    data = await request.json()
    text = data.get("text", "")
    result = classifier(text)[0]

    return {
        "label": result["label"],
        "score": result["score"],
        "categories": {
            result["label"]: result["score"]
        }
    }
