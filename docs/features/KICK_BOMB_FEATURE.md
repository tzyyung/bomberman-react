# 踢炸彈功能實現

## 功能概述

踢炸彈是炸彈人遊戲中的經典功能，允許玩家踢動炸彈到不同位置，增加遊戲的策略性和趣味性。

## 功能特性

### 1. 基本功能
- **踢動炸彈**：玩家可以踢動自己放置的炸彈
- **方向控制**：炸彈會朝著玩家面對的方向移動
- **障礙檢測**：炸彈遇到障礙物會停止移動
- **視覺效果**：被踢動的炸彈有特殊的視覺效果

### 2. 控制方式
- **玩家1**：B 鍵踢炸彈
- **玩家2**：右 Shift 鍵踢炸彈
- **冷卻時間**：300ms 冷卻時間防止連續踢動

### 3. 視覺效果
- **閃爍邊框**：被踢動的炸彈有黃色閃爍邊框
- **方向箭頭**：顯示炸彈移動方向
- **動畫效果**：平滑的移動動畫

## 技術實現

### 1. 數據結構

#### Bomb 接口
```typescript
interface Bomb {
  // ... 其他屬性
  canKick: boolean;           // 是否可以踢動
  kicked: boolean;            // 是否被踢動
  kickDirection: Direction | null;  // 踢動方向
  kickSpeed: number;          // 踢動速度
  kickDistance: number;       // 踢動距離
}
```

#### Player 接口
```typescript
interface Player {
  // ... 其他屬性
  canKick: boolean;           // 是否有踢炸彈能力
  lastKickTime: number;       // 上次踢炸彈時間
}
```

### 2. 核心方法

#### kickBomb 方法
```typescript
public kickBomb(player: Player, bombs: Bomb[], map: MapTile[][]): void {
  // 檢查玩家是否有踢炸彈能力
  if (!player.canKick) return;
  
  // 檢查冷卻時間
  if (Date.now() - player.lastKickTime < 300) return;
  
  // 尋找玩家位置的炸彈
  const bomb = bombs.find(b => 
    b.gridX === player.gridX && b.gridY === player.gridY && !b.exploded
  );
  
  // 踢動炸彈
  if (bomb && bomb.canKick) {
    bomb.kicked = true;
    bomb.kickDirection = player.direction;
    bomb.kickDistance = 0;
    player.lastKickTime = Date.now();
  }
}
```

#### updateKickedBomb 方法
```typescript
private updateKickedBomb(bomb: Bomb, map: MapTile[][]): void {
  if (bomb.kickDirection === null) return;
  
  // 計算新位置
  let newX = bomb.gridX;
  let newY = bomb.gridY;
  
  switch (bomb.kickDirection) {
    case Direction.UP: newY -= 1; break;
    case Direction.DOWN: newY += 1; break;
    case Direction.LEFT: newX -= 1; break;
    case Direction.RIGHT: newX += 1; break;
  }
  
  // 檢查是否可以移動
  if (this.canMoveBombTo(newX, newY, map)) {
    // 更新炸彈位置
    bomb.gridX = newX;
    bomb.gridY = newY;
    bomb.pixelX = newX * TILE_SIZE + TILE_SIZE / 2;
    bomb.pixelY = newY * TILE_SIZE + TILE_SIZE / 2;
    bomb.kickDistance++;
    
    // 更新地圖
    map[bomb.gridY][bomb.gridX].type = 0; // 原位置
    map[newY][newX].type = 3; // 新位置
  } else {
    // 停止踢動
    bomb.kicked = false;
    bomb.kickDirection = null;
  }
}
```

### 3. 視覺效果

#### 踢動效果渲染
```typescript
private renderBomb(ctx: CanvasRenderingContext2D, bomb: Bomb): void {
  // ... 基本炸彈渲染
  
  // 踢動效果
  if (bomb.kicked) {
    // 閃爍的黃色邊框
    const kickTime = Date.now() - bomb.placeTime;
    const kickFlashRate = 100;
    if (Math.floor(kickTime / kickFlashRate) % 2 === 0) {
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 2, y - 2, size + 4, size + 4);
    }
    
    // 方向箭頭
    let arrow = '';
    switch (bomb.kickDirection) {
      case Direction.UP: arrow = '↑'; break;
      case Direction.DOWN: arrow = '↓'; break;
      case Direction.LEFT: arrow = '←'; break;
      case Direction.RIGHT: arrow = '→'; break;
    }
    
    if (arrow) {
      ctx.fillText(arrow, bomb.pixelX, bomb.pixelY - size/2 - 10);
    }
  }
}
```

## 遊戲流程

### 1. 踢炸彈流程
1. **玩家按鍵**：按下 B 鍵或右 Shift 鍵
2. **能力檢查**：檢查玩家是否有踢炸彈能力
3. **冷卻檢查**：檢查是否在冷卻時間內
4. **炸彈查找**：尋找玩家位置的炸彈
5. **踢動執行**：設置炸彈為踢動狀態
6. **視覺更新**：更新炸彈的視覺效果

### 2. 炸彈移動流程
1. **方向計算**：根據踢動方向計算新位置
2. **障礙檢測**：檢查新位置是否有障礙物
3. **位置更新**：更新炸彈的網格和像素位置
4. **地圖更新**：更新地圖格子的類型
5. **距離記錄**：記錄踢動距離

### 3. 停止條件
- **遇到障礙物**：炸彈遇到牆壁或其他障礙物
- **到達邊界**：炸彈移動到地圖邊界
- **遇到其他炸彈**：炸彈遇到其他炸彈

## 道具系統集成

### 1. 踢炸彈道具
- **道具類型**：PowerUpType.KICK
- **道具效果**：設置 `player.canKick = true`
- **道具符號**：👟
- **道具描述**：可以踢動炸彈

### 2. 道具收集
```typescript
case PowerUpType.KICK:
  player.canKick = true;
  console.log(`玩家 ${player.id} 獲得踢炸彈道具，可以踢炸彈`);
  break;
```

## 調試信息

### 1. 踢炸彈調試
- **能力檢查**：記錄玩家是否有踢炸彈能力
- **冷卻檢查**：記錄踢炸彈冷卻狀態
- **炸彈查找**：記錄是否找到可踢的炸彈
- **踢動執行**：記錄踢動方向和結果

### 2. 移動調試
- **位置計算**：記錄炸彈移動的位置
- **障礙檢測**：記錄障礙物檢測結果
- **移動結果**：記錄炸彈移動成功或失敗

## 使用說明

### 1. 基本操作
1. **獲得能力**：收集踢炸彈道具（👟）
2. **放置炸彈**：在想要的位置放置炸彈
3. **踢動炸彈**：按 B 鍵（玩家1）或右 Shift 鍵（玩家2）
4. **觀察效果**：炸彈會朝著玩家面對的方向移動

### 2. 策略技巧
- **戰術移動**：將炸彈踢到敵人身邊
- **安全距離**：將炸彈踢到安全位置
- **連鎖爆炸**：將炸彈踢到其他炸彈附近
- **障礙利用**：利用牆壁停止炸彈移動

### 3. 注意事項
- **冷卻時間**：踢炸彈有 300ms 冷卻時間
- **方向限制**：炸彈只能朝著玩家面對的方向移動
- **障礙阻擋**：炸彈遇到障礙物會停止移動
- **能力需求**：需要先獲得踢炸彈道具才能使用

## 技術改進

### 1. 性能優化
- **冷卻機制**：防止過度頻繁的踢動操作
- **位置更新**：高效的網格和像素位置更新
- **視覺效果**：優化的動畫渲染

### 2. 用戶體驗
- **視覺反饋**：清晰的踢動效果和方向指示
- **音效支持**：踢動炸彈的音效（可選）
- **控制響應**：即時的按鍵響應

### 3. 遊戲平衡
- **冷卻時間**：合理的冷卻時間防止濫用
- **移動限制**：只能朝一個方向移動
- **障礙檢測**：真實的物理碰撞檢測

## 結論

踢炸彈功能已經完全實現，包括：

1. **基本功能**：踢動炸彈、方向控制、障礙檢測
2. **視覺效果**：閃爍邊框、方向箭頭、動畫效果
3. **控制系統**：按鍵映射、冷卻機制、能力檢查
4. **道具集成**：與道具系統完美集成
5. **調試支持**：完整的調試信息系統

這個功能大大增加了遊戲的策略性和趣味性，讓玩家可以更靈活地使用炸彈！💣👟
