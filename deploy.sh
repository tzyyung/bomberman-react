#!/bin/bash

# 炸彈超人 React 版部署腳本

echo "🚀 開始部署炸彈超人 React 版..."

# 檢查 Node.js 是否安裝
if ! command -v node &> /dev/null; then
    echo "❌ 錯誤: 未找到 Node.js，請先安裝 Node.js"
    exit 1
fi

# 檢查 npm 是否安裝
if ! command -v npm &> /dev/null; then
    echo "❌ 錯誤: 未找到 npm，請先安裝 npm"
    exit 1
fi

echo "📦 安裝依賴..."
npm install

echo "🔨 構建項目..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 構建成功！"
    echo ""
    echo "🎮 遊戲已準備就緒！"
    echo ""
    echo "📁 構建文件位於: ./build/"
    echo "🌐 可以使用以下命令啟動本地服務器:"
    echo "   npx serve -s build"
    echo ""
    echo "🚀 或者運行開發服務器:"
    echo "   npm start"
else
    echo "❌ 構建失敗，請檢查錯誤信息"
    exit 1
fi

