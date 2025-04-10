# 🧠 UNICC Media Analysis Tool

The UNICC Media Analysis Tool is a web application for analyzing media content including **text**, **audio**, and **video** files. It supports detecting harmful content, summarizing topics, assessing tone, and extracting keywords.

## 🚀 Features

- 📄 Upload and analyze **text documents**
- 🎙 Upload and analyze **audio files** (e.g., `.mp3`, `.wav`)
- 🎥 Upload and analyze **video files**
- 🧠 AI-powered analysis:
  - Topic and subtopic identification
  - Summarization in bullet points
  - Tone analysis (positive, negative, neutral)
  - Harmful content classification (e.g., hate speech, misinformation)
  - Risk scoring and reasoning
  - Keyword extraction

## 🧩 Technologies

- **Frontend:** React, Chart.js, Axios, Tailwind CSS
- **Backend:** FastAPI, Google Cloud Vertex AI, OpenAI API
- **Other tools:** Git, GitHub, JSON, FormData

## 📂 Project Structure

📁 frontend/ # React frontend for file upload and result display 📁 backend/ # FastAPI backend for audio processing and AI model calling 📄 README.md # Project documentation


## ⚙️ Setup Instructions

### Prerequisites

- Node.js + npm
- Python 3.9+
- Google Cloud service account + deployed Vertex AI model
- OpenAI API Key

### Frontend & Backend Setup

```bash
cd frontend
npm install
npm start


cd backend
pip install -r requirements.txt
uvicorn call_gemini_audio:app --reload
```

⚠️ Ensure your service_account.json (need to be added manually!!) is in the correct backend folder and NOT pushed to GitHub.
