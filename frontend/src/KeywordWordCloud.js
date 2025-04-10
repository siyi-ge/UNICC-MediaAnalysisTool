import React from "react";
import ReactWordCloud from "react-d3-cloud";

function KeywordWordCloud({ words }) {
  // 添加调试日志
  console.log("接收到的词云数据:", words);
  
  if (!words || words.length === 0) return <p>暂无关键词数据</p>;
  
  // 确保数据格式正确
  const formattedWords = words.map(item => ({
    text: item.word || "",
    value: item.count || 0
  }));
  
  const fontSizeMapper = word => Math.log2(word.value) * 5;
  const rotate = word => word.value % 360;
  
  return (
    <div style={{ height: "300px", marginTop: "2rem" }}>
      <h4>🔍 关键词词云</h4>
      <ReactWordCloud
        data={formattedWords}
        fontSizeMapper={fontSizeMapper}
        rotate={rotate}
        width={500}
        height={300}
      />
    </div>
  );
}


export default KeywordWordCloud;
