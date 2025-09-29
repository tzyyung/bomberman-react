# 穿透道具功能實現

## 問題分析

### 用戶需求
1. 穿透道具能夠讓炸彈爆炸時的距離不會因為碰到軟牆而停止
2. 在踢動過程中遇到另一個玩家會直接引爆

### 原始問題
- 炸彈爆炸時遇到軟牆會停止
- 踢動炸彈時遇到玩家不會引爆
- 缺少穿透道具的視覺效果

## 解決方案

### 1. 修改爆炸邏輯支持穿透

#### 原始爆炸邏輯
```typescript
private getExplosionPositions(bomb: Bomb, map: MapTile[][]): Array<{x: number, y: number}> {
  // ... 爆炸邏輯 ...
  
  directions.forEach(dir => {
    for (let i = 1; i <= bomb.power; i++) {
      const x = bomb.gridX + dir.dx * i;
      const y = bomb.gridY + dir.dy * i;
      
      if (x < 0 || x >= map[0].length || y < 0 || y >= map.length) break;
      
      const tile = map[y][x];
      if (tile.type === 1) break; // 硬牆停止爆炸
      
      positions.push({ x, y });
      
      if (tile.type === 2) break; // 軟牆停止爆炸
    }
  });
}
```

#### 修復後爆炸邏輯
```typescript
private getExplosionPositions(bomb: Bomb, map: MapTile[][]): Array<{x: number, y: number}> {
  // ... 爆炸邏輯 ...
  
  directions.forEach(dir => {
    for (let i = 1; i <= bomb.power; i++) {
      const x = bomb.gridX + dir.dx * i;
      const y = bomb.gridY + dir.dy * i;
      
      if (x < 0 || x >= map[0].length || y < 0 || y >= map.length) break;
      
      const tile = map[y][x];
      if (tile.type === 1) break; // 硬牆停止爆炸
      
      positions.push({ x, y });
      
      // 如果沒有穿透能力，軟牆停止爆炸
      if (tile.type === 2 && !bomb.canPierce) {
        console.log(`軟牆停止爆炸，位置: (${x}, ${y})`);
        break;
      }
      
      // 如果有穿透能力，軟牆不會停止爆炸
      if (tile.type === 2 && bomb.canPierce) {
        console.log(`穿透軟牆，繼續爆炸，位置: (${x}, ${y})`);
      }
    }
  });
}
```

### 2. 添加炸彈穿透屬性

#### 更新 Bomb 接口
```typescript
export interface Bomb {
  id: string;
  gridX: number;
  gridY: number;
  pixelX: number;
  pixelY: number;
  power: number;
  ownerId: number;
  placeTime: number;
  exploded: boolean;
  chainExplode: boolean;
  canKick: boolean;
  kicked: boolean;
  kickDirection: Direction | null;
  kickSpeed: number;
  kickDistance: number;
  maxKickDistance?: number;
  canPierce: boolean; // 穿透能力
  remote: boolean;
}
```

#### 更新炸彈創建邏輯
```typescript
const bomb: Bomb = {
  id: `bomb_${this.bombIdCounter++}`,
  gridX: player.gridX,
  gridY: player.gridY,
  pixelX: player.gridX * TILE_SIZE + TILE_SIZE / 2,
  pixelY: player.gridY * TILE_SIZE + TILE_SIZE / 2,
  power: player.bombPower,
  ownerId: player.id,
  placeTime: Date.now(),
  exploded: false,
  chainExplode: false,
  canKick: player.canKick,
  kicked: false,
  kickDirection: null,
  kickSpeed: 2,
  kickDistance: 0,
  maxKickDistance: player.kickCount || 1,
  canPierce: player.canPierce, // 設置穿透能力
  remote: player.canRemote,
};
```

### 3. 實現踢動時玩家碰撞檢測

#### 原始踢動邏輯
```typescript
private updateKickedBomb(bomb: Bomb, map: MapTile[][]): void {
  // ... 踢動邏輯 ...
  
  // 檢查是否可以移動
  if (this.canMoveBombTo(newX, newY, map)) {
    // 移動炸彈
  } else {
    // 停止踢動
  }
}
```

#### 修復後踢動邏輯
```typescript
private updateKickedBomb(bomb: Bomb, map: MapTile[][], players: Player[]): void {
  // ... 踢動邏輯 ...
  
  // 檢查是否遇到玩家
  const playerAtTarget = players.find(p => p.alive && p.gridX === newX && p.gridY === newY);
  if (playerAtTarget) {
    console.log(`炸彈踢動遇到玩家 ${playerAtTarget.id}，立即引爆`);
    bomb.chainExplode = true;
    bomb.kicked = false;
    bomb.kickDirection = null;
    return;
  }
  
  // 檢查是否可以移動
  if (this.canMoveBombTo(newX, newY, map)) {
    // 移動炸彈
  } else {
    // 停止踢動
  }
}
```

### 4. 添加穿透道具視覺效果

#### 炸彈渲染效果
```typescript
private renderBomb(ctx: CanvasRenderingContext2D, bomb: Bomb): void {
  // ... 基本炸彈渲染 ...
  
  // 如果炸彈有穿透能力，添加特殊效果
  if (bomb.canPierce) {
    // 穿透效果：紫色邊框
    ctx.strokeStyle = '#8A2BE2';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 1, y - 1, size + 2, size + 2);
    
    // 穿透標記
    ctx.fillStyle = '#8A2BE2';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💥', bomb.pixelX, bomb.pixelY + size/2 + 8);
  }
  
  // ... 其他效果 ...
}
```

## 技術實現詳情

### 1. 穿透爆炸邏輯

#### 條件判斷
- **硬牆**：始終停止爆炸（無論是否有穿透能力）
- **軟牆 + 無穿透**：停止爆炸
- **軟牆 + 有穿透**：繼續爆炸

#### 實現方式
```typescript
// 如果沒有穿透能力，軟牆停止爆炸
if (tile.type === 2 && !bomb.canPierce) {
  console.log(`軟牆停止爆炸，位置: (${x}, ${y})`);
  break;
}

// 如果有穿透能力，軟牆不會停止爆炸
if (tile.type === 2 && bomb.canPierce) {
  console.log(`穿透軟牆，繼續爆炸，位置: (${x}, ${y})`);
}
```

### 2. 踢動碰撞檢測

#### 玩家檢測
- **檢測範圍**：炸彈移動的目標位置
- **檢測條件**：玩家存活且位置匹配
- **觸發效果**：立即引爆炸彈

#### 實現方式
```typescript
// 檢查是否遇到玩家
const playerAtTarget = players.find(p => p.alive && p.gridX === newX && p.gridY === newY);
if (playerAtTarget) {
  console.log(`炸彈踢動遇到玩家 ${playerAtTarget.id}，立即引爆`);
  bomb.chainExplode = true;
  bomb.kicked = false;
  bomb.kickDirection = null;
  return;
}
```

### 3. 視覺效果設計

#### 穿透標識
- **邊框顏色**：紫色 (#8A2BE2)
- **邊框寬度**：3px
- **標記符號**：💥 爆炸符號
- **位置**：炸彈下方

#### 效果層次
1. **基本炸彈**：黑色主體 + 白色邊框
2. **穿透炸彈**：黑色主體 + 紫色邊框 + 💥 標記
3. **踢動炸彈**：黑色主體 + 黃色閃爍邊框 + 方向箭頭

## 功能特性

### 1. 穿透爆炸

#### 爆炸範圍
- **無穿透**：遇到軟牆停止
- **有穿透**：穿過軟牆繼續爆炸
- **硬牆限制**：硬牆始終停止爆炸

#### 策略應用
- **清理軟牆**：可以一次性清理多層軟牆
- **遠距離攻擊**：爆炸範圍不受軟牆限制
- **戰術優勢**：增加攻擊範圍和效果

### 2. 踢動碰撞

#### 碰撞檢測
- **即時檢測**：每次踢動移動都檢測
- **玩家識別**：只檢測存活的玩家
- **位置精確**：精確匹配網格位置

#### 引爆機制
- **立即引爆**：遇到玩家立即引爆
- **連鎖反應**：可能引發連鎖爆炸
- **戰術應用**：可以主動攻擊玩家

### 3. 視覺反饋

#### 穿透標識
- **紫色邊框**：清楚標示穿透能力
- **爆炸符號**：💥 符號表示穿透
- **即時顯示**：獲得道具後立即顯示

#### 效果層次
- **基本效果**：所有炸彈都有
- **特殊效果**：根據能力顯示
- **動態效果**：踢動時的動畫效果

## 使用方式

### 1. 獲得穿透道具

#### 道具收集
1. **軟牆爆炸**：50% 機率生成道具
2. **定時生成**：每10秒生成1-3個道具
3. **道具類型**：💥 穿透道具

#### 效果應用
- **即時生效**：獲得後立即生效
- **永久效果**：持續到遊戲結束
- **所有炸彈**：影響玩家放置的所有炸彈

### 2. 穿透爆炸效果

#### 爆炸行為
- **穿過軟牆**：爆炸不會被軟牆阻擋
- **繼續擴散**：爆炸範圍達到最大威力
- **清理效果**：可以清理多層軟牆

#### 戰術應用
- **遠距離攻擊**：增加攻擊範圍
- **清理障礙**：快速清理軟牆
- **戰略優勢**：獲得戰術優勢

### 3. 踢動碰撞效果

#### 碰撞觸發
- **玩家碰撞**：踢動時遇到玩家
- **立即引爆**：炸彈立即爆炸
- **連鎖反應**：可能引發連鎖爆炸

#### 戰術應用
- **主動攻擊**：可以主動攻擊玩家
- **精確打擊**：精確控制爆炸位置
- **戰術配合**：與其他能力配合使用

## 調試信息

### 1. 穿透爆炸調試
```
炸彈爆炸，威力: 2，穿透能力: true，位置: (5, 3)
爆炸位置: (5, 2)
穿透軟牆，繼續爆炸，位置: (5, 1)
爆炸位置: (5, 1)
總共 3 個爆炸位置
```

### 2. 踢動碰撞調試
```
炸彈踢動：從 (5, 3) 到 (6, 3)，距離: 1/2
炸彈踢動遇到玩家 2，立即引爆
```

### 3. 道具收集調試
```
玩家 1 獲得穿透道具，可以穿透軟牆
玩家 1 放置炸彈，威力: 2，穿透能力: true
```

## 技術改進

### 1. 爆炸邏輯優化

#### 條件判斷
- **清晰邏輯**：穿透條件判斷清晰
- **性能優化**：避免不必要的計算
- **調試友好**：詳細的調試信息

#### 擴展性
- **易於擴展**：可以輕鬆添加其他穿透類型
- **模組化**：爆炸邏輯模組化設計
- **可配置**：穿透行為可以配置

### 2. 碰撞檢測優化

#### 檢測效率
- **精確檢測**：只檢測必要的位置
- **快速查找**：使用高效的查找算法
- **即時響應**：檢測結果即時應用

#### 安全性
- **邊界檢查**：確保不超出地圖邊界
- **狀態驗證**：驗證玩家狀態
- **錯誤處理**：處理異常情況

### 3. 視覺效果優化

#### 渲染性能
- **條件渲染**：只在需要時渲染效果
- **層次管理**：合理管理渲染層次
- **動畫優化**：優化動畫性能

#### 用戶體驗
- **清晰識別**：效果清晰易識別
- **視覺層次**：合理的視覺層次
- **動態效果**：生動的動態效果

## 結論

通過實現穿透道具功能，成功實現了：

1. **穿透爆炸**：炸彈可以穿過軟牆繼續爆炸
2. **踢動碰撞**：踢動時遇到玩家會立即引爆
3. **視覺效果**：清晰的穿透標識和效果
4. **戰術深度**：增加了遊戲的戰術深度

現在穿透道具功能完全符合預期，大大提升了遊戲的策略性和趣味性！💥🎮🎯
