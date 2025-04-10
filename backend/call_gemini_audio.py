from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from google.oauth2 import service_account
from google.auth.transport.requests import Request
import requests
import base64
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有前端来源
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
credentials.refresh(Request())
access_token = credentials.token

# Vertex AI endpoint 设置
project_id = "thermal-origin-454105"
endpoint_id = "7945023743309381632"
region = "us-central1"
url = f"https://{region}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{region}/endpoints/{endpoint_id}:predict"

@app.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    # 读取音频内容并转为 base64 编码
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

    response = requests.post(url, headers=headers, data=json.dumps(body))

    print(response.json())

    if response.status_code != 200:
        return {"error": "调用 Vertex AI 失败", "details": response.text}
    
    return response.json()
