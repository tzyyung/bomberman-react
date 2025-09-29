# 炸彈超人 React 版 - 遊戲設計文檔

## 📋 文檔概述

本文檔詳細記錄了炸彈超人 React 版的完整設計規劃、技術架構和實現細節，作為後續開發和維護的參考資料。

## 🎯 遊戲概述

### 遊戲類型
- **類型**: 動作策略遊戲
- **模式**: 本地雙人對戰
- **平台**: 網頁瀏覽器
- **技術棧**: React + TypeScript + HTML5 Canvas

### 核心玩法
- 玩家在地圖上移動，放置炸彈摧毀對手
- 收集道具增強能力
- 避免被炸彈炸到
- 成為最後的倖存者

## 🏗️ 技術架構

### 整體架構
```
┌─────────────────────────────────────────┐
│                React App                │
├─────────────────────────────────────────┤
│            GameEngine (核心)             │
├─────────────────────────────────────────┤
│  MapSystem │ PlayerSystem │ BombSystem  │
│ PowerUpSys │ AudioSystem  │ UISystem    │
├─────────────────────────────────────────┤
│        Canvas 2D + Web Audio API        │
├─────────────────────────────────────────┤
│             瀏覽器環境                   │
└─────────────────────────────────────────┘
```

### 模組化設計原則
1. **單一職責**: 每個系統只負責特定功能
2. **低耦合**: 系統間通過接口通信
3. **高內聚**: 相關功能集中在同一系統
4. **可擴展**: 易於添加新功能

## 🎮 遊戲系統設計

### 1. 遊戲引擎 (GameEngine)
**職責**: 遊戲核心控制器
- 管理遊戲狀態轉換
- 協調各個子系統
- 處理用戶輸入
- 控制遊戲循環
- 管理碰撞檢測

**核心方法**:
```typescript
class GameEngine {
  startGame(): void
  pauseGame(): void
  resumeGame(): void
  restartGame(): void
  showMenu(): void
  update(deltaTime: number): void
  render(): void
}
```

### 2. 地圖系統 (MapSystem)
**職責**: 地圖管理和碰撞檢測
- 隨機生成地圖
- 管理瓦片渲染
- 處理碰撞檢測
- 摧毀軟牆

**地圖元素**:
- `EMPTY (0)`: 空地
- `HARD_WALL (1)`: 硬牆（不可破壞）
- `SOFT_WALL (2)`: 軟牆（可破壞）
- `BOMB (3)`: 炸彈
- `EXPLOSION (4)`: 爆炸
- `POWERUP (5)`: 道具

### 3. 玩家系統 (PlayerSystem)
**職責**: 玩家管理和移動
- 創建和管理玩家
- 處理移動邏輯
- 管理玩家屬性
- 應用道具效果

**玩家屬性**:
```typescript
interface Player {
  id: number
  alive: boolean
  position: { gridX: number, gridY: number, pixelX: number, pixelY: number }
  direction: Direction
  speed: number
  maxBombs: number
  bombPower: number
  abilities: {
    canKick: boolean
    canPierce: boolean
    canRemote: boolean
    hasShield: boolean
  }
}
```

### 4. 炸彈系統 (BombSystem)
**職責**: 炸彈管理和爆炸邏輯
- 放置炸彈
- 處理爆炸邏輯
- 連鎖爆炸
- 踢炸彈功能
- 遙控引爆

**炸彈生命週期**:
1. 放置 → 2. 計時 → 3. 爆炸 → 4. 清理

### 5. 道具系統 (PowerUpSystem)
**職責**: 道具管理和效果
- 生成道具
- 收集道具
- 應用效果

**道具類型**:
- `FIRE`: 增加炸彈威力
- `BOMB`: 增加炸彈數量
- `SPEED`: 增加移動速度
- `KICK`: 可以踢炸彈
- `PIERCE`: 炸彈穿透軟牆
- `REMOTE`: 遙控引爆
- `SHIELD`: 無敵狀態

### 6. 音頻系統 (AudioSystem)
**職責**: 音效和音樂管理
- 播放音效
- 背景音樂
- 音量控制

### 7. UI系統 (UISystem)
**職責**: 用戶界面渲染
- 遊戲HUD
- 菜單界面
- 遊戲結束界面

## 🎨 視覺設計

### 顏色方案
```typescript
// 基本顏色
BLACK = '#000000'
WHITE = '#FFFFFF'
GRAY = '#808080'

// 玩家顏色
BLUE = '#0000FF'    // 玩家1
RED = '#FF0000'     // 玩家2

// 道具顏色
GREEN = '#00FF00'   // 踢炸彈
YELLOW = '#FFFF00'  // 速度
ORANGE = '#FFA500'  // 穿透
PURPLE = '#800080'  // 防護罩

// 地圖顏色
BROWN = '#8B4513'      // 硬牆
LIGHT_BROWN = '#A0522D' // 軟牆
```

### 瓦片設計
- **尺寸**: 64x64 像素
- **風格**: 簡潔的幾何圖形
- **動畫**: 炸彈閃爍、爆炸效果

## 🎮 控制設計

### 鍵盤映射
```typescript
const KEY_MAPPING = {
  player1: {
    up: 'KeyW',
    down: 'KeyS', 
    left: 'KeyA',
    right: 'KeyD',
    bomb: 'Space',
    kick: 'KeyB',
    remote: 'KeyV'
  },
  player2: {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft', 
    right: 'ArrowRight',
    bomb: 'Enter',
    kick: 'ShiftRight',
    remote: 'Slash'
  }
}
```

## 📊 遊戲平衡

### 數值設計
```typescript
// 基本數值
PLAYER_SPEED = 3.0        // 玩家移動速度
BOMB_TIMER = 3000         // 炸彈爆炸時間 (3秒)
EXPLOSION_DURATION = 500  // 爆炸持續時間 (0.5秒)
TILE_SIZE = 64            // 瓦片大小

// 道具效果
FIRE_POWER_INCREASE = 1   // 火焰道具威力增加
BOMB_COUNT_INCREASE = 1   // 炸彈道具數量增加
SPEED_INCREASE = 0.5      // 速度道具速度增加
SHIELD_DURATION = 10000   // 防護罩持續時間 (10秒)
```

### 地圖生成規則
1. 邊界設置硬牆
2. 內部每隔一個位置設置硬牆
3. 30% 機率放置軟牆
4. 確保玩家起始位置安全

## 🔧 技術實現細節

### 遊戲循環
```typescript
function gameLoop() {
  const currentTime = performance.now()
  const deltaTime = currentTime - lastTime
  lastTime = currentTime
  
  if (!paused) {
    update(deltaTime)
  }
  render()
  
  requestAnimationFrame(gameLoop)
}
```

### 碰撞檢測
```typescript
function isColliding(obj1: any, obj2: any): boolean {
  const distance = Math.sqrt(
    Math.pow(obj1.pixelX - obj2.pixelX, 2) + 
    Math.pow(obj1.pixelY - obj2.pixelY, 2)
  )
  return distance < TILE_SIZE / 2
}
```

### 狀態管理
```typescript
interface GameState {
  state: 'menu' | 'playing' | 'paused' | 'over'
  winner: number | null
  players: Player[]
  bombs: Bomb[]
  powerUps: PowerUp[]
  explosions: Explosion[]
  map: MapTile[][]
  score: { player1: number, player2: number }
  time: number
  paused: boolean
}
```

## 🚀 性能優化

### 渲染優化
- 使用 Canvas 2D 進行硬體加速渲染
- 只渲染可見區域
- 避免不必要的重繪

### 內存管理
- 及時清理已爆炸的炸彈
- 移除已收集的道具
- 使用對象池管理頻繁創建的對象

### 事件優化
- 防抖處理輸入事件
- 使用 requestAnimationFrame 控制幀率
- 避免在渲染循環中進行重計算

## 📱 響應式設計

### 屏幕適配
- 支持不同屏幕尺寸
- 保持遊戲比例
- 適配移動設備

### 控制適配
- 鍵盤控制為主
- 預留觸控接口
- 支持遊戲手柄

## 🧪 測試策略

### 單元測試
- 各系統獨立測試
- 邊界條件測試
- 錯誤處理測試

### 集成測試
- 系統間交互測試
- 遊戲流程測試
- 性能測試

### 用戶測試
- 易用性測試
- 平衡性測試
- 兼容性測試

## 🔮 未來擴展計劃

### 短期目標
- [ ] 修復 ESLint 警告
- [ ] 添加觸控支持
- [ ] 優化音頻系統
- [ ] 添加更多動畫效果

### 中期目標
- [ ] 網絡多人遊戲
- [ ] 更多地圖主題
- [ ] 成就系統
- [ ] 遊戲錄像功能

### 長期目標
- [ ] 3D 版本
- [ ] 移動端原生應用
- [ ] 雲端對戰平台
- [ ] AI 對手

## 📚 開發規範

### 代碼風格
- 使用 TypeScript 嚴格模式
- 遵循 ESLint 規則
- 使用有意義的變量名
- 添加詳細註釋

### Git 工作流
- 功能分支開發
- 代碼審查
- 自動化測試
- 版本標籤

### 文檔維護
- 及時更新設計文檔
- 記錄重要決策
- 維護 API 文檔
- 用戶手冊更新

## 🎯 成功指標

### 技術指標
- 60 FPS 穩定運行
- 內存使用 < 100MB
- 加載時間 < 3秒
- 無重大 bug

### 用戶體驗指標
- 易學易用
- 流暢的遊戲體驗
- 良好的視覺效果
- 穩定的網絡連接

## 📝 總結

本文檔記錄了炸彈超人 React 版的完整設計規劃，包括技術架構、遊戲系統、視覺設計、性能優化等各個方面。這將作為後續開發、維護和擴展的重要參考資料。

通過模組化的設計和清晰的架構，這個項目具有良好的可維護性和可擴展性，為未來的功能添加和優化奠定了堅實的基礎。

