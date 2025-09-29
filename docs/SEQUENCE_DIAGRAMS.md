# 🎮 炸彈人遊戲 Sequence 流程圖文檔

## 📋 目錄
1. [遊戲初始化流程](#1-遊戲初始化流程)
2. [遊戲開始流程](#2-遊戲開始流程)
3. [玩家移動流程](#3-玩家移動流程)
4. [炸彈放置流程](#4-炸彈放置流程)
5. [炸彈爆炸流程](#5-炸彈爆炸流程)
6. [道具收集流程](#6-道具收集流程)
7. [踢炸彈流程](#7-踢炸彈流程)
8. [遊戲結束流程](#8-遊戲結束流程)
9. [遊戲主循環流程](#9-遊戲主循環流程)
10. [系統架構圖](#10-系統架構圖)

---

## 1. 遊戲初始化流程

```mermaid
sequenceDiagram
    participant User as 用戶
    participant App as App.tsx
    participant GameEngine as GameEngine
    participant MapSystem as MapSystem
    participant PlayerSystem as PlayerSystem
    participant BombSystem as BombSystem
    participant PowerUpSystem as PowerUpSystem
    participant AudioSystem as AudioSystem
    participant UISystem as UISystem

    User->>App: 訪問遊戲頁面
    App->>App: useEffect 觸發
    App->>GameEngine: new GameEngine(canvas)
    GameEngine->>GameEngine: constructor()
    GameEngine->>MapSystem: new MapSystem()
    GameEngine->>PlayerSystem: new PlayerSystem()
    GameEngine->>BombSystem: new BombSystem()
    GameEngine->>PowerUpSystem: new PowerUpSystem()
    GameEngine->>AudioSystem: new AudioSystem()
    GameEngine->>UISystem: new UISystem()
    GameEngine->>GameEngine: setupEventListeners()
    App->>App: setInterval(updateGameState, 100)
    App->>User: 顯示主菜單
```

**說明：**
- 用戶訪問頁面觸發 React 組件掛載
- App.tsx 初始化遊戲引擎和各個子系統
- 設置事件監聽器和定期狀態更新
- 顯示主菜單等待用戶操作

---

## 2. 遊戲開始流程

```mermaid
sequenceDiagram
    participant User as 用戶
    participant App as App.tsx
    participant GameEngine as GameEngine
    participant MapSystem as MapSystem
    participant PlayerSystem as PlayerSystem

    User->>App: 點擊"開始遊戲"
    App->>GameEngine: startGame()
    GameEngine->>MapSystem: generateMap()
    MapSystem-->>GameEngine: 返回地圖數據
    GameEngine->>PlayerSystem: createPlayer(1, 1, 1, "blue")
    PlayerSystem-->>GameEngine: 返回玩家1
    GameEngine->>PlayerSystem: createPlayer(11, 9, 2, "red")
    PlayerSystem-->>GameEngine: 返回玩家2
    GameEngine->>GameEngine: 設置遊戲狀態為 'playing'
    GameEngine->>GameEngine: 開始遊戲循環
    GameEngine-->>App: 更新遊戲狀態
    App-->>User: 顯示遊戲畫面
```

**說明：**
- 用戶點擊開始遊戲按鈕
- 生成隨機地圖和創建兩個玩家
- 設置遊戲狀態並開始主循環
- 更新 UI 顯示遊戲畫面

---

## 3. 玩家移動流程

```mermaid
sequenceDiagram
    participant User as 用戶
    participant App as App.tsx
    participant GameEngine as GameEngine
    participant PlayerSystem as PlayerSystem
    participant MapSystem as MapSystem

    User->>App: 按下移動鍵 (WASD/箭頭鍵)
    App->>GameEngine: handleKeyDown()
    GameEngine->>GameEngine: handleInput()
    GameEngine->>GameEngine: 創建 InputEvent
    GameEngine->>PlayerSystem: movePlayer(player, direction, map)
    PlayerSystem->>PlayerSystem: 更新玩家方向
    PlayerSystem->>PlayerSystem: canMoveTo(newX, newY, map)
    MapSystem-->>PlayerSystem: 返回移動可行性
    alt 可以移動
        PlayerSystem->>PlayerSystem: 更新玩家位置
        PlayerSystem-->>GameEngine: 移動成功
    else 無法移動
        PlayerSystem-->>GameEngine: 移動被阻擋
    end
    GameEngine-->>App: 更新遊戲狀態
    App-->>User: 顯示更新後的畫面
```

**說明：**
- 用戶按下移動鍵觸發輸入事件
- 檢查移動目標位置是否可行
- 更新玩家位置和方向
- 實時更新遊戲畫面

---

## 4. 炸彈放置流程

```mermaid
sequenceDiagram
    participant User as 用戶
    participant App as App.tsx
    participant GameEngine as GameEngine
    participant BombSystem as BombSystem
    participant MapSystem as MapSystem

    User->>App: 按下炸彈鍵 (Space/Enter)
    App->>GameEngine: handleKeyDown()
    GameEngine->>GameEngine: handleInput()
    GameEngine->>BombSystem: placeBomb(player, bombs, map)
    BombSystem->>BombSystem: 檢查炸彈數量限制
    BombSystem->>BombSystem: 檢查冷卻時間
    BombSystem->>BombSystem: 檢查位置是否已有炸彈
    alt 可以放置
        BombSystem->>BombSystem: 創建新炸彈對象
        BombSystem->>MapSystem: 更新地圖格子類型為 BOMB
        BombSystem->>BombSystem: 增加玩家炸彈計數
        BombSystem-->>GameEngine: 炸彈放置成功
    else 無法放置
        BombSystem-->>GameEngine: 炸彈放置失敗
    end
    GameEngine-->>App: 更新遊戲狀態
    App-->>User: 顯示更新後的畫面
```

**說明：**
- 用戶按下炸彈鍵觸發放置事件
- 檢查各種放置條件（數量、冷卻、位置）
- 創建炸彈對象並更新地圖
- 更新玩家炸彈計數

---

## 5. 炸彈爆炸流程

```mermaid
sequenceDiagram
    participant GameEngine as GameEngine
    participant BombSystem as BombSystem
    participant MapSystem as MapSystem
    participant PowerUpSystem as PowerUpSystem
    participant PlayerSystem as PlayerSystem

    GameEngine->>BombSystem: updateBombs()
    BombSystem->>BombSystem: 檢查炸彈計時器
    alt 炸彈應該爆炸
        BombSystem->>BombSystem: explodeBomb()
        BombSystem->>MapSystem: 恢復地圖格子為 EMPTY
        BombSystem->>PlayerSystem: 減少玩家炸彈計數
        BombSystem->>BombSystem: createExplosion()
        BombSystem->>BombSystem: getExplosionPositions()
        loop 每個爆炸位置
            alt 位置是軟牆
                BombSystem->>MapSystem: 摧毀軟牆
                BombSystem->>PowerUpSystem: generatePowerUpAt()
                PowerUpSystem-->>BombSystem: 返回生成的道具
            end
        end
        BombSystem->>BombSystem: checkChainExplosion()
        BombSystem-->>GameEngine: 返回爆炸位置
    end
    GameEngine-->>GameEngine: 更新遊戲狀態
```

**說明：**
- 定期檢查炸彈是否應該爆炸
- 計算爆炸範圍並摧毀軟牆
- 有機率在軟牆位置生成道具
- 檢查連鎖爆炸效果

---

## 6. 道具收集流程

```mermaid
sequenceDiagram
    participant GameEngine as GameEngine
    participant PlayerSystem as PlayerSystem
    participant PowerUpSystem as PowerUpSystem
    participant MapSystem as MapSystem

    GameEngine->>GameEngine: checkCollisions()
    GameEngine->>PlayerSystem: 檢查玩家位置
    loop 每個玩家
        alt 玩家在道具位置
            GameEngine->>PowerUpSystem: collectPowerUp(player, powerUp)
            PowerUpSystem->>PowerUpSystem: 標記道具為已收集
            PowerUpSystem->>PowerUpSystem: applyPowerUpEffect()
            alt 道具類型
                case FIRE: PowerUpSystem->>PlayerSystem: 增加炸彈威力
                case BOMB: PowerUpSystem->>PlayerSystem: 增加最大炸彈數
                case SPEED: PowerUpSystem->>PlayerSystem: 增加移動速度
                case KICK: PowerUpSystem->>PlayerSystem: 啟用踢炸彈能力
                case PIERCE: PowerUpSystem->>PlayerSystem: 啟用穿透能力
                case REMOTE: PowerUpSystem->>PlayerSystem: 啟用遙控能力
                case SHIELD: PowerUpSystem->>PlayerSystem: 啟用防護罩
            end
            PowerUpSystem->>MapSystem: 清除地圖道具標記
        end
    end
    GameEngine-->>GameEngine: 更新遊戲狀態
```

**說明：**
- 檢查玩家與道具的碰撞
- 根據道具類型應用不同效果
- 更新玩家能力和地圖狀態
- 提供視覺和音效反饋

---

## 7. 踢炸彈流程

```mermaid
sequenceDiagram
    participant User as 用戶
    participant App as App.tsx
    participant GameEngine as GameEngine
    participant BombSystem as BombSystem
    participant MapSystem as MapSystem

    User->>App: 按下踢炸彈鍵 (B/ShiftRight)
    App->>GameEngine: handleKeyDown()
    GameEngine->>GameEngine: handleInput()
    GameEngine->>BombSystem: kickBomb(player, bombs, map)
    BombSystem->>BombSystem: 檢查玩家踢炸彈能力
    BombSystem->>BombSystem: findBombNearPlayer()
    alt 找到可踢動的炸彈
        BombSystem->>BombSystem: 設置炸彈踢動狀態
        BombSystem->>BombSystem: moveBombToPlayerFront()
        BombSystem->>MapSystem: 更新地圖格子類型
        BombSystem-->>GameEngine: 踢炸彈成功
    else 沒有找到炸彈
        BombSystem-->>GameEngine: 踢炸彈失敗
    end
    GameEngine-->>App: 更新遊戲狀態
    App-->>User: 顯示更新後的畫面
```

**說明：**
- 用戶按下踢炸彈鍵
- 檢查玩家是否具有踢炸彈能力
- 尋找附近可踢動的炸彈
- 設置炸彈移動狀態和方向

---

## 8. 遊戲結束流程

```mermaid
sequenceDiagram
    participant GameEngine as GameEngine
    participant PlayerSystem as PlayerSystem
    participant UISystem as UISystem
    participant App as App.tsx

    GameEngine->>GameEngine: update()
    GameEngine->>PlayerSystem: 檢查玩家存活狀態
    alt 有玩家死亡
        GameEngine->>GameEngine: 設置獲勝者
        GameEngine->>GameEngine: 設置遊戲狀態為 'over'
        GameEngine->>UISystem: renderGameOver()
        GameEngine-->>App: 更新遊戲狀態
        App-->>User: 顯示遊戲結束畫面
    end
    
    User->>App: 點擊"再玩一次"
    App->>GameEngine: restartGame()
    GameEngine->>GameEngine: 重置所有遊戲狀態
    GameEngine->>MapSystem: generateMap()
    GameEngine->>PlayerSystem: 重新創建玩家
    GameEngine->>GameEngine: 設置遊戲狀態為 'playing'
    GameEngine-->>App: 更新遊戲狀態
    App-->>User: 顯示新遊戲畫面
```

**說明：**
- 檢查玩家存活狀態
- 設置獲勝者和遊戲結束狀態
- 提供重新開始功能
- 重置所有遊戲數據

---

## 9. 遊戲主循環流程

```mermaid
sequenceDiagram
    participant GameEngine as GameEngine
    participant MapSystem as MapSystem
    participant PlayerSystem as PlayerSystem
    participant BombSystem as BombSystem
    participant PowerUpSystem as PowerUpSystem
    participant UISystem as UISystem
    participant AudioSystem as AudioSystem

    loop 每幀 (60 FPS)
        GameEngine->>GameEngine: update()
        GameEngine->>GameEngine: 處理輸入事件
        GameEngine->>PlayerSystem: updatePlayers()
        GameEngine->>BombSystem: updateBombs()
        GameEngine->>PowerUpSystem: updatePowerUps()
        GameEngine->>GameEngine: checkCollisions()
        GameEngine->>GameEngine: 檢查遊戲結束條件
        GameEngine->>GameEngine: render()
        GameEngine->>MapSystem: render()
        GameEngine->>PlayerSystem: render()
        GameEngine->>BombSystem: render()
        GameEngine->>PowerUpSystem: render()
        GameEngine->>UISystem: render()
        GameEngine->>AudioSystem: 播放音效
    end
```

**說明：**
- 60 FPS 的遊戲循環
- 每幀更新所有系統
- 處理輸入、碰撞檢測、渲染
- 播放相應的音效

---

## 10. 系統架構圖

```mermaid
graph TB
    subgraph "React 應用層"
        App[App.tsx]
        Index[index.tsx]
    end
    
    subgraph "遊戲引擎層"
        GameEngine[GameEngine.ts]
    end
    
    subgraph "遊戲系統層"
        MapSystem[MapSystem.ts]
        PlayerSystem[PlayerSystem.ts]
        BombSystem[BombSystem.ts]
        PowerUpSystem[PowerUpSystem.ts]
        AudioSystem[AudioSystem.ts]
        UISystem[UISystem.ts]
    end
    
    subgraph "數據層"
        Types[types.ts]
        Constants[constants.ts]
    end
    
    App --> GameEngine
    Index --> App
    GameEngine --> MapSystem
    GameEngine --> PlayerSystem
    GameEngine --> BombSystem
    GameEngine --> PowerUpSystem
    GameEngine --> AudioSystem
    GameEngine --> UISystem
    MapSystem --> Types
    PlayerSystem --> Types
    BombSystem --> Types
    PowerUpSystem --> Types
    AudioSystem --> Types
    UISystem --> Types
    GameEngine --> Constants
```

---

## 🎯 遊戲設計核心邏輯

### 1. **模組化設計**
- 每個系統都有明確的職責
- 系統間通過接口進行通信
- 便於維護和擴展

### 2. **事件驅動架構**
- 用戶輸入觸發事件
- 事件在系統間傳遞
- 狀態更新驅動渲染

### 3. **狀態管理**
- 集中式遊戲狀態管理
- 狀態變更觸發重新渲染
- 確保數據一致性

### 4. **碰撞檢測**
- 網格基礎的碰撞檢測
- 實時位置驗證
- 多層次碰撞處理

### 5. **時間管理**
- 基於時間的遊戲邏輯
- 冷卻時間控制
- 動畫和效果同步

---

## 📝 使用說明

這些 sequence 流程圖展示了炸彈人遊戲的完整設計邏輯，從初始化到遊戲循環，每個系統都有明確的職責和交互方式。可以用於：

1. **開發參考** - 理解系統間的交互關係
2. **調試輔助** - 追蹤問題的數據流向
3. **功能擴展** - 了解如何添加新功能
4. **代碼維護** - 快速理解現有代碼結構
5. **團隊協作** - 統一對系統架構的理解

---

## 🔄 更新記錄

- **2024-01-XX** - 初始版本，包含所有主要流程圖
- **2024-01-XX** - 添加系統架構圖和設計說明
- **2024-01-XX** - 完善註解和文檔結構

---

*此文檔將隨著遊戲功能的更新而持續維護和改進。*
