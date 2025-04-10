from fastapi import FastAPI, UploadFile, File, Request as FastAPIRequest
from google.auth.transport.requests import Request as GoogleAuthRequest
from fastapi.middleware.cors import CORSMiddleware
from google.oauth2 import service_account
from transformers import pipeline
from transformers import XLMRobertaTokenizer, XLMRobertaForSequenceClassification
import torch
import base64
import json
import os
import requests
import whisper
import tempfile


app = FastAPI()

#转录音频文件为文本
whisper_model= whisper.load_model("base")  # 加载 Whisper 模型一次即可
print("🧠 Whisper 模型已加载")  # ✅ 这句能否输出


@app.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    # 将上传的音频保存到临时文件
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        print("🎧 开始调用 Whisper 转写...")
        result = whisper_model.transcribe(tmp_path)
        print("🔥 Whisper 转写结果：", result)
        transcript = result["text"]

        return {
            "transcript": transcript,
            "label": "placeholder"
        }

    except Exception as e:
        print("❌ Whisper 转写失败：", str(e))  # ✅ 打印错误
        return { "error": str(e) }



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Google Cloud Service Account 配置
SERVICE_ACCOUNT_FILE = "thermal-origin-454105-s5-c6291f413f44.json"
SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]

credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)

credentials.refresh(GoogleAuthRequest())
access_token = credentials.token

# Vertex AI endpoint 设置
project_id = "thermal-origin-454105"  
region = "us-central1"
endpoint_id = "6002987141494210560" 
predict_url = f"https://{region}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{region}/endpoints/{endpoint_id}:predict"

@app.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    file_bytes = await file.read()
    base64_audio = base64.b64encode(file_bytes).decode("utf-8")

    instance = {
        "mime_type": file.content_type,
        "data": base64_audio
    }

    body = {
        "instances": [instance]
    }

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    response = requests.post(predict_url, headers=headers, data=json.dumps(body))
    print("模型响应：", response.json())

    return response.json()


    if response.status_code != 200:
        return {"error": "调用 Vertex AI 失败", "details": response.text}

    return response.json()

# === HuggingFace Text Classification Setup ===
# 加载 fine-tuned 模型和 tokenizer（只需加载一次）
classification_model= XLMRobertaForSequenceClassification.from_pretrained("momoali23/multilingual-hate-detector")
tokenizer = XLMRobertaTokenizer.from_pretrained("momoali23/multilingual-hate-detector")

@app.post("/analyze/fine-tuned")
async def analyze_custom_model(request: FastAPIRequest):
    data = await request.json()
    text = data.get("text", "")

    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = classification_model(**inputs)
        prediction = torch.argmax(outputs.logits, dim=1).item()
        score = torch.softmax(outputs.logits, dim=1).max().item()

    label_map = {
        0: "✅ Normal",
        1: "🚨 Hate Speech"
    }

    return {
        "label": label_map[prediction],
    }