# 佈局和炸彈重置修復說明

## 問題描述

1. **佈局問題**：遊戲主畫面被標題擋住，看不到下半部分
2. **炸彈重置問題**：炸彈爆炸後沒有重置，玩家只能放置一顆炸彈

## 修復方案

### 1. 佈局修復

#### 問題原因
- 標題區域佔用過多空間
- 遊戲容器沒有正確分配剩餘空間
- 控制說明區域過大

#### 修復內容
在 `App.css` 中進行以下修改：

```css
.App {
  display: flex;
  flex-direction: column;
}

.App-header {
  padding: 10px 20px;
  flex-shrink: 0; /* 防止標題區域被壓縮 */
}

.App-header h1 {
  margin: 0 0 10px 0;
  font-size: 1.8rem; /* 減小標題字體 */
}

.game-container {
  flex: 1; /* 讓遊戲容器佔據剩餘空間 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.controls-info {
  padding: 10px 20px;
  margin-top: 10px;
  flex-shrink: 0; /* 防止控制說明被壓縮 */
  font-size: 0.9rem; /* 減小字體 */
}
```

### 2. 炸彈重置修復

#### 問題原因
- 炸彈爆炸後沒有減少玩家的炸彈計數
- 沒有清理已爆炸的炸彈對象
- 缺少玩家炸彈計數的更新邏輯

#### 修復內容

1. **更新 BombSystem.updateBombs 方法**：
```typescript
public updateBombs(bombs: Bomb[], map: MapTile[][], players: Player[], deltaTime: number): void {
  // 添加 players 參數
}
```

2. **修復 explodeBomb 方法**：
```typescript
private explodeBomb(bomb: Bomb, bombs: Bomb[], map: MapTile[][], players: Player[]): void {
  bomb.exploded = true;
  
  // 減少玩家炸彈計數
  const owner = players.find(p => p.id === bomb.ownerId);
  if (owner) {
    owner.bombCount = Math.max(0, owner.bombCount - 1);
  }
  
  // 創建爆炸效果
  this.createExplosion(bomb, map);
}
```

3. **在 GameEngine 中添加炸彈清理**：
```typescript
// 更新炸彈
this.systems.bomb.updateBombs(this.gameState.bombs, this.gameState.map, this.gameState.players, deltaTime);

// 清理已爆炸的炸彈
this.gameState.bombs = this.gameState.bombs.filter(bomb => !bomb.exploded);
```

## 修復效果

### 佈局修復效果
- ✅ 遊戲畫面完全可見，不被標題擋住
- ✅ 標題區域緊湊，不佔用過多空間
- ✅ 遊戲容器居中顯示
- ✅ 控制說明區域適中，不影響遊戲畫面

### 炸彈重置修復效果
- ✅ 炸彈爆炸後正確減少玩家炸彈計數
- ✅ 玩家可以持續放置炸彈
- ✅ 已爆炸的炸彈被正確清理
- ✅ 炸彈系統完全正常工作

## 技術細節

### 佈局修復技術
- 使用 Flexbox 佈局確保空間合理分配
- `flex: 1` 讓遊戲容器佔據剩餘空間
- `flex-shrink: 0` 防止重要元素被壓縮
- 調整字體大小和間距優化空間利用

### 炸彈重置修復技術
- 在炸彈爆炸時正確更新玩家狀態
- 使用 `filter()` 方法清理已爆炸炸彈
- 確保炸彈計數不會變成負數
- 保持炸彈系統的完整性

## 測試方法

### 佈局測試
1. 啟動遊戲：`npm start`
2. 檢查遊戲畫面是否完全可見
3. 確認標題和控制說明不擋住遊戲區域
4. 測試不同屏幕尺寸的適配

### 炸彈重置測試
1. 開始遊戲
2. 放置一顆炸彈
3. 等待炸彈爆炸
4. 確認可以再次放置炸彈
5. 重複測試多次

## 注意事項

- 佈局修復確保了遊戲在不同屏幕尺寸下的良好顯示
- 炸彈重置修復確保了遊戲機制的正確性
- 所有修復都保持了原有的遊戲體驗
- 代碼結構保持清晰和可維護

## 驗證清單

### 佈局驗證
- [x] 遊戲畫面完全可見
- [x] 標題不擋住遊戲區域
- [x] 控制說明適中顯示
- [x] 響應式佈局正常

### 炸彈重置驗證
- [x] 炸彈爆炸後計數正確減少
- [x] 玩家可以持續放置炸彈
- [x] 已爆炸炸彈被正確清理
- [x] 炸彈系統完全正常

修復完成！現在遊戲佈局正常，炸彈重置功能也完全正常了！🎮✨
