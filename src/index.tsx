/**
 * 應用程序入口點 (index.tsx)
 * 
 * 功能說明：
 * - 初始化 React 應用程序
 * - 創建 React DOM 根節點
 * - 渲染主應用組件
 * - 啟用 React StrictMode 開發模式
 * - 設置性能監控
 * 
 * 主要功能：
 * - React 應用程序啟動
 * - DOM 根節點創建和渲染
 * - 開發模式嚴格檢查
 * - 性能監控初始化
 */

import React from 'react'; // React 核心庫
import ReactDOM from 'react-dom/client'; // React DOM 客戶端渲染
import './index.css'; // 全局樣式文件
import App from './App'; // 主應用組件
import reportWebVitals from './reportWebVitals'; // 性能監控工具

// 創建 React DOM 根節點
// 獲取 HTML 中 id 為 'root' 的元素作為渲染目標
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// 渲染主應用組件
// 使用 React.StrictMode 啟用開發模式的嚴格檢查
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 性能監控設置
// 如果需要在應用中測量性能，可以傳入一個函數
// 來記錄結果（例如：reportWebVitals(console.log)）
// 或發送到分析端點。了解更多：https://bit.ly/CRA-vitals
reportWebVitals();
