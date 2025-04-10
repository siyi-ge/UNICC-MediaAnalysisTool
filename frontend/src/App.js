import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import HarmCategoryPie from "./HarmCategoryPie";
import KeywordWordCloud from "./KeywordWordCloud";



function App() {
  // 所有 useState
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileType, setFileType] = useState("text");
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [showConfig, setShowConfig] = useState(false);

  const [gptText, setGptText] = useState(""); //调用gpt做详细分析
  const [gptAudio, setGptAudio] = useState("");
  const [gptVideo, setGptVideo] = useState("");


  const textFileRef = useRef(null);
  const videoFileRef = useRef(null);
  const audioFileRef = useRef(null);

  const cardStyle = {
    marginTop: "1rem",
    padding: "1rem",
    background: "#e7f3ff",
    borderRadius: "8px",
    border: "1px solid #b3d4fc",
    whiteSpace: "pre-wrap"
  };

    //调用gpt做交叉验证+详细分析
    const callGptAnalysis = async (text, type) => {
      if (!apiKey || !text) return;
    
      const prompt = `Please analyze the following text from the following aspects:
    1. Emotion type (e.g., anger, sadness, neutral)
    2. Keywords
    3. Content summary
    4. Moderation suggestion
    
    Text:
    ${text}`;
    
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
          }),
        });
    
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "⚠️ GPT analysis failed";
    
        // 🎯 根据类型更新对应的分析结果
        if (type === "text") setGptText(content);
        else if (type === "audio") setGptAudio(content);
        else if (type === "video") setGptVideo(content);
      } catch (error) {
        console.error("GPT request error:", error);

        if (type === "text") setGptText("❌ GPT error");
        else if (type === "audio") setGptAudio("❌ GPT error");
        else if (type === "video") setGptVideo("❌ GPT error");
      }
    };
      //调用gpt做交叉验证+详细分析此处结束


  useEffect(() => {
    const savedApiKey = localStorage.getItem("openai_api_key");
    if (savedApiKey) setApiKey(savedApiKey);
  }, []);

  const saveApiKey = () => {
    localStorage.setItem("openai_api_key", apiKey);
    setShowConfig(false);
  };


  const handleFileUpload = async (fileInputRef, type) => {
    const fileInput = fileInputRef.current;
    if (!fileInput || !fileInput.files.length) {
      alert("请先选择文件");
      return;
    }
    if (!apiKey) {
      alert("请先设置API密钥");
      setShowConfig(true);
      return;
    }

  //调用fine-tuning模型分析
    const file = fileInput.files[0];
    setLoading(true);
    setError(null);

    try {
      //音频分析
      if (type === "audio") {
        const formData = new FormData();
        formData.append("file", file);
      
        try {
          const response = await axios.post("http://127.0.0.1:8000/analyze", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          
          // 提取后端转录返回数据
          const transcript = response.data?.transcript || "";
          const label = response.data?.label || "未返回";

          
          //展示 Fine-tuning 结果
          setResults([...results, {
            source: "audio",
            text_snippet: transcript.slice(0, 50) + "...",
            raw_text: `Label: ${label}\n\nTranscript: ${transcript || "未返回内容"}`
          }]);

          //展示gpt分析结果* 仅当 transcript 有值时再调用 GPT 分析
          if (transcript.trim() !== "") {
            callGptAnalysis(transcript, "audio");
          } else {
            setGptAudio("⚠️ 音频未能成功转录，因此 GPT 分析未执行。");
          }
      
          fileInputRef.current.value = "";
          return; 
          //展示gpt分析结果*
      

        } catch (err) {
          setError("Audio Analyze Fail：" + (err.response?.data?.detail || err.message));
          setLoading(false);
          return;
        }
      }
      
      const fileContent = await readFileContent(file);

      //文本分析
      if (type === "text") {
        const fileContent = await readFileContent(file);
      
        try {
          const response = await axios.post(
            "http://127.0.0.1:8000/analyze/fine-tuned",
            { text: fileContent },
            { headers: { "Content-Type": "application/json" } }
          );
      
          const { label } = response.data;
      
          setResults([
            ...results,
            {
              source: type,
              text_snippet: fileContent.substring(0, 50) + "...",
              raw_text: `Label: ${label}`
            }
          ]);

          //GPT分析结果展示*
          callGptAnalysis(fileContent, "text");
          //GPT分析结果展示*

        } catch (error) {
          setError(`Text Analyze fail: ${error.message}`);
        }

      
        fileInputRef.current.value = "";
        return;
      }
          
  


      fileInputRef.current.value = "";
    } catch (error) {
      console.error("分析失败:", error);
      setError(`分析失败: ${error.response?.data?.error?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith("text/")) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
      } else {
        resolve(`[${file.name}] - 文件内容无法直接读取`);
      }
    });
  };

  //分析到此处结束
  
  const fileTypeButtonStyle = (active) => ({
    padding: "0.5rem 1rem",
    margin: "0 0.5rem 1rem 0",
    fontSize: "16px",
    backgroundColor: active ? "#4f46e5" : "#e5e7eb",
    color: active ? "white" : "black",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  });

  const uploadButtonStyle = {
    marginTop: "0.5rem",
    padding: "0.5rem 1rem",
    fontSize: "16px",
    backgroundColor: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  };

  const fileInputContainerStyle = {
    marginTop: "1rem",
    padding: "1.5rem",
    border: "2px dashed #d1d5db",
    borderRadius: "8px",
    textAlign: "center"
  };

  const configPanelStyle = {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    padding: "2rem",
    backgroundColor: "white",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    borderRadius: "8px",
    zIndex: 1000,
    width: "80%",
    maxWidth: "500px"
  };


  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>🧠 Media Analysis Tool</h1>
      <div style={{ marginBottom: "1rem", textAlign: "right" }}>
        <button
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: apiKey ? "#10b981" : "#f59e0b",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
          onClick={() => setShowConfig(true)}
        >
          {apiKey ? "✓ API已配置" : "⚙️ 配置API"}
        </button>
      </div>

      {showConfig && (
        <div style={configPanelStyle}>
          <h2>API配置</h2>
          <p>请输入您的OpenAI API密钥：</p>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            style={{
              width: "100%",
              padding: "0.5rem",
              marginBottom: "1rem",
              border: "1px solid #d1d5db",
              borderRadius: "4px"
            }}
          />
          <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            您的API密钥将保存在本地浏览器中，不会发送到我们的服务器。
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#e5e7eb",
                color: "black",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
              onClick={() => setShowConfig(false)}
            >
              取消
            </button>
            <button
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#4f46e5",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
              onClick={saveApiKey}
            >
              保存
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: "1rem" }}>
        <button style={fileTypeButtonStyle(fileType === "text")} onClick={() => setFileType("text")}>📝 Text File</button>
        <button style={fileTypeButtonStyle(fileType === "video")} onClick={() => setFileType("video")}>🎬 Video FIle</button>
        <button style={fileTypeButtonStyle(fileType === "audio")} onClick={() => setFileType("audio")}>🎵 Audio File</button>
      </div>

      <div style={fileInputContainerStyle}>
        {fileType === "text" && (
          <div>
            <h3>Upload Text File</h3>
            <p>Supported Format: .txt</p>
            <input type="file" ref={textFileRef} accept=".txt,.doc,.docx,.pdf" style={{ display: "block", margin: "1rem auto" }} />
            <button style={uploadButtonStyle} onClick={() => handleFileUpload(textFileRef, "text")} disabled={loading}>
              {loading ? "Analyzing..." : "Go"}
            </button>
          </div>
        )}

        {fileType === "video" && (
          <div>
            <h3>上传视频文件</h3>
            <p>支持的格式: .mp4, .avi, .mov, .wmv</p>
            <input type="file" ref={videoFileRef} accept=".mp4,.avi,.mov,.wmv" style={{ display: "block", margin: "1rem auto" }} />
            <button style={uploadButtonStyle} onClick={() => handleFileUpload(videoFileRef, "video")} disabled={loading}>
              {loading ? "分析中..." : "分析视频"}
            </button>
          </div>
        )}

        {fileType === "audio" && (
          <div>
            <h3>Upload Audio File</h3>
            <p>Supported format: .mp3</p>
            <input type="file" ref={audioFileRef} accept=".mp3,.wav,.ogg,.m4a" style={{ display: "block", margin: "1rem auto" }} />
            <button style={uploadButtonStyle} onClick={() => handleFileUpload(audioFileRef, "audio")} disabled={loading}>
              {loading ? "Analyzing..." : "Go"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "4px" }}>
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: "1rem",
              padding: "1rem",
              background: "#fff8dc",
              borderRadius: "8px",
              border: "1px solid rgb(245, 240, 113)",
              whiteSpace: "pre-wrap" }}>
          <h3>📝 Fine-tuning Model Analysis：</h3>
          <p>{results[results.length - 1].raw_text}</p>
        </div>
      )}

      {/* Text GPT Analysis */}
      {gptText && (
      <div style={cardStyle}>
        <h3>📝 GPT on Text</h3>
        <p>{gptText}</p>
      </div>
    )}

    {gptAudio && (
      <div style={cardStyle}>
        <h3>🎵 GPT on Audio</h3>
        <p>{gptAudio}</p>
      </div>
    )}

    {gptVideo && (
      <div style={cardStyle}>
        <h3>🎬 GPT on Video</h3>
        <p>{gptVideo}</p>
      </div>
    )}

    </div>   
  ); 
}
      
export default App;
