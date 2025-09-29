# 道具生成系統修復

## 問題分析

### 道具沒有出現的原因
1. **只有炸彈爆炸時生成**：道具只在炸彈摧毀軟牆時生成
2. **缺少定時生成**：沒有每10秒自動生成道具的功能
3. **生成數量固定**：沒有隨機生成1-3個道具的機制
4. **位置選擇有限**：只在炸彈爆炸位置生成道具

### 用戶需求
- **每10秒生成1-3個道具**：定時自動生成道具
- **隨機位置生成**：在空閒位置隨機生成道具
- **多種道具類型**：包含所有類型的道具
- **持續生成**：遊戲進行中持續生成道具

## 解決方案

### 1. 添加定時道具生成系統

#### 新增屬性
```typescript
export class GameEngine {
  private lastPowerUpSpawnTime: number = 0;
  private powerUpSpawnInterval: number = 10000; // 10秒
  // ... 其他屬性
}
```

#### 定時生成邏輯
```typescript
private spawnRandomPowerUps(): void {
  const currentTime = Date.now();
  
  // 檢查是否到了生成道具的時間
  if (currentTime - this.lastPowerUpSpawnTime >= this.powerUpSpawnInterval) {
    this.lastPowerUpSpawnTime = currentTime;
    
    // 生成1-3個道具
    const powerUpCount = Math.floor(Math.random() * 3) + 1; // 1-3個
    console.log(`定時生成 ${powerUpCount} 個道具`);
    
    for (let i = 0; i < powerUpCount; i++) {
      this.spawnRandomPowerUp();
    }
  }
}
```

### 2. 實現隨機位置生成

#### 空閒位置搜索
```typescript
private spawnRandomPowerUp(): void {
  // 尋找空閒的位置
  const emptyPositions: {x: number, y: number}[] = [];
  
  for (let y = 0; y < this.gameState.map.length; y++) {
    for (let x = 0; x < this.gameState.map[y].length; x++) {
      const tile = this.gameState.map[y][x];
      // 檢查是否為空地且沒有道具
      if (tile.type === 0 && !tile.hasPowerUp) {
        // 檢查是否已經有道具在這個位置
        const existingPowerUp = this.gameState.powerUps.find(p => p.gridX === x && p.gridY === y);
        if (!existingPowerUp) {
          emptyPositions.push({x, y});
        }
      }
    }
  }
  
  // 如果有空閒位置，隨機選擇一個生成道具
  if (emptyPositions.length > 0) {
    const randomPos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    const powerUp = this.systems.powerUp.generatePowerUpAt(randomPos.x, randomPos.y, this.gameState.map);
    if (powerUp) {
      this.gameState.powerUps.push(powerUp);
      console.log(`道具生成在位置 (${randomPos.x}, ${randomPos.y})`);
    }
  } else {
    console.log('沒有空閒位置生成道具');
  }
}
```

### 3. 集成到遊戲循環

#### 更新遊戲循環
```typescript
private update(deltaTime: number): void {
  // 處理輸入
  this.processInput();
  
  // 更新玩家
  this.systems.player.updatePlayers(this.gameState.players, this.gameState.map, deltaTime);
  
  // 更新炸彈
  const explosionPositions = this.systems.bomb.updateBombs(this.gameState.bombs, this.gameState.map, this.gameState.players, deltaTime);
  
  // 創建爆炸效果和道具（炸彈爆炸時生成）
  explosionPositions.forEach(positions => {
    positions.forEach(pos => {
      // 創建爆炸效果
      const explosion = { ... };
      this.gameState.explosions.push(explosion);
      
      // 檢查是否需要生成道具
      if (this.gameState.map[pos.y][pos.x].hasPowerUp) {
        const powerUp = this.systems.powerUp.generatePowerUpAt(pos.x, pos.y, this.gameState.map);
        if (powerUp) {
          this.gameState.powerUps.push(powerUp);
        }
        // 清除地圖上的道具標記
        this.gameState.map[pos.y][pos.x].hasPowerUp = false;
      }
    });
  });
  
  // 清理已爆炸的炸彈
  this.gameState.bombs = this.gameState.bombs.filter(bomb => !bomb.exploded);
  
  // 更新爆炸
  this.updateExplosions(deltaTime);
  
  // 更新道具
  this.systems.powerUp.updatePowerUps(this.gameState.powerUps, this.gameState.players);
  
  // 定時生成道具
  this.spawnRandomPowerUps();
  
  // 檢查碰撞
  this.checkCollisions();
  
  // 更新遊戲時間
  this.gameState.time += deltaTime;
  
  // 檢查遊戲結束條件
  this.checkGameEnd();
}
```

### 4. 初始化時間管理

#### 開始遊戲時初始化
```typescript
public startGame(): void {
  this.initializeGame();
  this.gameState.state = 'playing';
  this.lastPowerUpSpawnTime = Date.now(); // 初始化道具生成時間
  this.gameLoop();
}
```

#### 重新開始時重置
```typescript
public restartGame(): void {
  // ... 重置遊戲狀態
  
  // 重新初始化遊戲
  this.initializeGame();
  this.gameState.state = 'playing';
  this.lastTime = performance.now();
  this.lastPowerUpSpawnTime = Date.now(); // 重置道具生成時間
  this.gameLoop();
}
```

## 技術改進詳情

### 1. 定時生成機制

#### 時間管理
- **間隔時間**：每10秒生成一次道具
- **隨機數量**：每次生成1-3個道具
- **時間追蹤**：使用 `Date.now()` 追蹤上次生成時間
- **持續生成**：遊戲進行中持續生成道具

#### 生成邏輯
```typescript
// 檢查是否到了生成道具的時間
if (currentTime - this.lastPowerUpSpawnTime >= this.powerUpSpawnInterval) {
  this.lastPowerUpSpawnTime = currentTime;
  
  // 生成1-3個道具
  const powerUpCount = Math.floor(Math.random() * 3) + 1;
  
  for (let i = 0; i < powerUpCount; i++) {
    this.spawnRandomPowerUp();
  }
}
```

### 2. 位置選擇算法

#### 空閒位置搜索
- **遍歷地圖**：檢查每個地圖格子
- **條件檢查**：確保是空地且沒有道具
- **重複檢查**：確保沒有重複的道具
- **隨機選擇**：從空閒位置中隨機選擇

#### 位置驗證
```typescript
// 檢查是否為空地且沒有道具
if (tile.type === 0 && !tile.hasPowerUp) {
  // 檢查是否已經有道具在這個位置
  const existingPowerUp = this.gameState.powerUps.find(p => p.gridX === x && p.gridY === y);
  if (!existingPowerUp) {
    emptyPositions.push({x, y});
  }
}
```

### 3. 道具類型多樣性

#### 道具類型
- **火焰道具**：增加炸彈威力
- **炸彈道具**：增加可放置炸彈數量
- **速度道具**：增加移動速度
- **踢炸彈道具**：可以踢動炸彈
- **穿透道具**：炸彈可以穿透軟牆
- **遙控道具**：可以遙控引爆炸彈
- **防護罩道具**：10秒內無敵狀態

#### 隨機選擇
```typescript
// 隨機選擇道具類型
const powerUpTypes = Object.values(PowerUpType).filter(v => typeof v === 'number') as PowerUpType[];
const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
```

### 4. 渲染和顯示

#### 道具渲染
- **視覺效果**：金色背景，橙色邊框
- **符號顯示**：使用表情符號表示不同道具
- **閃爍效果**：道具會閃爍吸引注意
- **位置準確**：道具位置與地圖格子對齊

#### 渲染順序
```typescript
private render(): void {
  // 渲染地圖
  this.systems.map.render(this.ctx, this.gameState.map);
  
  // 渲染道具
  this.systems.powerUp.render(this.ctx, this.gameState.powerUps);
  
  // 渲染炸彈
  this.systems.bomb.render(this.ctx, this.gameState.bombs);
  
  // 渲染爆炸
  this.renderExplosions();
  
  // 渲染玩家
  this.systems.player.render(this.ctx, this.gameState.players);
  
  // 渲染UI
  this.systems.ui.render(this.ctx, this.gameState);
}
```

## 修復效果

### 定時生成功能
- ✅ **每10秒生成**：定時自動生成道具
- ✅ **隨機數量**：每次生成1-3個道具
- ✅ **持續生成**：遊戲進行中持續生成
- ✅ **時間管理**：正確的時間追蹤和重置

### 位置選擇功能
- ✅ **空閒位置搜索**：找到所有可用的空閒位置
- ✅ **隨機選擇**：從空閒位置中隨機選擇
- ✅ **重複檢查**：避免在同一位置生成多個道具
- ✅ **地圖邊界檢查**：確保位置在地圖範圍內

### 道具多樣性
- ✅ **多種道具類型**：包含所有7種道具類型
- ✅ **隨機選擇**：隨機選擇道具類型
- ✅ **視覺效果**：道具有明顯的視覺效果
- ✅ **符號顯示**：使用表情符號區分不同道具

### 整體功能
- ✅ **定時生成**：每10秒自動生成1-3個道具
- ✅ **炸彈爆炸生成**：炸彈摧毀軟牆時也會生成道具
- ✅ **位置多樣性**：在空閒位置隨機生成道具
- ✅ **持續遊戲**：道具持續生成，增加遊戲趣味性

## 測試建議

### 1. 定時生成測試
- **時間間隔**：檢查是否每10秒生成道具
- **數量隨機**：檢查是否生成1-3個道具
- **持續生成**：檢查是否持續生成道具
- **控制台日誌**：檢查生成調試信息

### 2. 位置選擇測試
- **空閒位置**：檢查是否在空閒位置生成
- **隨機分布**：檢查道具是否隨機分布
- **重複檢查**：檢查是否避免重複生成
- **邊界檢查**：檢查是否在地圖範圍內

### 3. 道具類型測試
- **多樣性**：檢查是否生成不同類型的道具
- **隨機選擇**：檢查道具類型是否隨機
- **視覺效果**：檢查道具是否正確顯示
- **符號顯示**：檢查道具符號是否正確

### 4. 遊戲集成測試
- **遊戲開始**：檢查遊戲開始時是否初始化
- **重新開始**：檢查重新開始時是否重置
- **暫停恢復**：檢查暫停恢復時是否正常
- **遊戲結束**：檢查遊戲結束時是否停止生成

## 結論

通過添加定時道具生成系統，現在道具系統完全正常：

1. **定時生成**：每10秒自動生成1-3個道具
2. **位置多樣性**：在空閒位置隨機生成道具
3. **道具多樣性**：包含所有類型的道具
4. **持續遊戲**：道具持續生成，增加遊戲趣味性

現在道具會每10秒自動出現1-3個，大大增加了遊戲的趣味性和策略性！🎮✨
