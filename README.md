# 🎮 炸彈人遊戲 (Bomberman Game)

一個使用 React + TypeScript + HTML5 Canvas 開發的經典炸彈人遊戲。

## 🚀 快速開始

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm start

# 構建生產版本
npm run build
```

## 📁 項目結構

```
bomberman-react/
├── src/                    # 源代碼
│   ├── systems/           # 遊戲系統
│   ├── GameEngine.ts      # 遊戲引擎
│   ├── App.tsx            # 主應用組件
│   └── types.ts           # 類型定義
├── docs/                  # 文檔
│   ├── features/          # 功能文檔
│   ├── fixes/             # 修復文檔
│   ├── development/       # 開發文檔
│   └── README.md          # 詳細說明
├── tests/                 # 測試文件
│   ├── debug/             # 調試腳本
│   └── html/              # HTML 測試
├── scripts/               # 部署腳本
└── public/                # 靜態資源
```

## 🎯 主要功能

- ✅ 雙人對戰模式
- ✅ 流暢的玩家移動
- ✅ 智能炸彈系統
- ✅ 豐富的道具系統
- ✅ 踢炸彈功能
- ✅ 穿透爆炸效果
- ✅ 完整的音效系統
- ✅ 響應式 UI 設計

## 📚 文檔

- [詳細說明](docs/README.md)
- [開發者指南](docs/DEVELOPER_GUIDE.md)
- [遊戲架構](docs/GAME_ARCHITECTURE.md)
- [功能流程圖](docs/GAME_FEATURES_FLOW.md)
- [Sequence 流程圖](docs/SEQUENCE_DIAGRAMS.md)

## 🎮 操作說明

### 玩家 1 (藍色)
- **移動**: W, A, S, D
- **放置炸彈**: Space
- **踢炸彈**: B

### 玩家 2 (紅色)
- **移動**: ↑, ←, ↓, →
- **放置炸彈**: Enter
- **踢炸彈**: Shift

### 通用操作
- **重新開始**: R
- **暫停/繼續**: ESC

## 🛠️ 技術棧

- **React 18** - UI 框架
- **TypeScript** - 類型安全
- **HTML5 Canvas** - 遊戲渲染
- **Web Audio API** - 音效系統

## 📄 許可證

MIT License

---

*享受遊戲吧！* 🎉
