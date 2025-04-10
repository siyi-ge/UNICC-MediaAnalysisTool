// src/HarmCategoryPie.js
import React from "react";
import { Pie } from "react-chartjs-2";

function HarmCategoryPie({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <p>暂无有害内容分类数据</p>;
  }
  
  const labels = Object.keys(data);
  const values = Object.values(data);
  

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          "#f87171", // Hate Speech
          "#60a5fa", // Misinformation
          "#34d399", // Discrimination
          "#fbbf24", // Fearmongering
          "#c084fc", // Others
        ],
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: "bottom",
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div style={{ height: "300px", marginTop: "2rem" }}>
      <h4>🧨 有害内容占比</h4>
      <Pie data={chartData} options={options} />
    </div>
  );
}

export default HarmCategoryPie;
