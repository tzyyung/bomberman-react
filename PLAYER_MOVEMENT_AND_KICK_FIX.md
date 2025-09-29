# 玩家移動和踢炸彈功能修復

## 問題分析

### 原始問題
1. **移動限制**：玩家碰到障礙物時無法改變方向
2. **踢炸彈範圍**：玩家可以踢動任何方向的炸彈
3. **炸彈移動**：炸彈被踢動後沒有立即移動到適當位置

### 用戶需求
1. **方向更新**：玩家碰到障礙物時仍能改變方向
2. **面前踢炸彈**：只能踢動玩家面前的炸彈
3. **炸彈定位**：炸彈被踢動後移動到玩家面前的位置

## 解決方案

### 1. 修復玩家移動邏輯

#### 原始邏輯
```typescript
// 檢查是否可以移動到新位置
if (this.canMoveTo(newX, newY, map)) {
  player.gridX = newX;
  player.gridY = newY;
  player.direction = direction;
  // 更新像素位置
}
```

#### 修復後邏輯
```typescript
// 首先更新玩家方向，無論是否能移動
player.direction = direction;

// 檢查是否可以移動到新位置
if (this.canMoveTo(newX, newY, map)) {
  player.gridX = newX;
  player.gridY = newY;
  // 更新像素位置
  console.log(`玩家 ${player.id} 移動到 (${newX}, ${newY})`);
} else {
  console.log(`玩家 ${player.id} 無法移動到 (${newX}, ${newY})，但方向已更新為 ${direction}`);
}
```

### 2. 修改踢炸彈檢測邏輯

#### 原始邏輯
```typescript
// 檢查玩家旁邊的炸彈（相鄰格子）
const adjacentPositions = [
  { x: player.gridX - 1, y: player.gridY }, // 左
  { x: player.gridX + 1, y: player.gridY }, // 右
  { x: player.gridX, y: player.gridY - 1 }, // 上
  { x: player.gridX, y: player.gridY + 1 }  // 下
];
```

#### 修復後邏輯
```typescript
// 只檢查玩家面對方向的炸彈
let targetX = player.gridX;
let targetY = player.gridY;

switch (player.direction) {
  case Direction.UP:
    targetY = player.gridY - 1;
    break;
  case Direction.DOWN:
    targetY = player.gridY + 1;
    break;
  case Direction.LEFT:
    targetX = player.gridX - 1;
    break;
  case Direction.RIGHT:
    targetX = player.gridX + 1;
    break;
}

bomb = bombs.find(b => 
  b.gridX === targetX && b.gridY === targetY && !b.exploded
);
```

### 3. 添加炸彈立即移動功能

#### 新增方法
```typescript
private moveBombToPlayerFront(bomb: Bomb, player: Player, map: MapTile[][]): void {
  // 計算玩家面前的位置
  let frontX = player.gridX;
  let frontY = player.gridY;
  
  switch (player.direction) {
    case Direction.UP:
      frontY = player.gridY - 1;
      break;
    case Direction.DOWN:
      frontY = player.gridY + 1;
      break;
    case Direction.LEFT:
      frontX = player.gridX - 1;
      break;
    case Direction.RIGHT:
      frontX = player.gridX + 1;
      break;
  }
  
  // 檢查玩家面前的位置是否可以放置炸彈
  if (this.canMoveBombTo(frontX, frontY, map)) {
    // 恢復原位置的地圖格子類型
    map[bomb.gridY][bomb.gridX].type = 0; // EMPTY
    
    // 移動炸彈到玩家面前
    bomb.gridX = frontX;
    bomb.gridY = frontY;
    bomb.pixelX = frontX * TILE_SIZE + TILE_SIZE / 2;
    bomb.pixelY = frontY * TILE_SIZE + TILE_SIZE / 2;
    
    // 更新新位置的地圖格子類型
    map[frontY][frontX].type = 3; // BOMB
    
    console.log(`炸彈移動到玩家面前位置: (${frontX}, ${frontY})`);
  } else {
    console.log(`玩家面前位置 (${frontX}, ${frontY}) 無法放置炸彈`);
  }
}
```

#### 踢炸彈時調用
```typescript
if (bomb) {
  console.log(`玩家 ${player.id} 踢動炸彈，方向: ${player.direction}，炸彈位置: (${bomb.gridX}, ${bomb.gridY})`);
  bomb.kicked = true;
  bomb.kickDirection = player.direction;
  bomb.kickDistance = 0;
  bomb.maxKickDistance = player.kickCount || 1;
  player.lastKickTime = Date.now();
  
  // 立即移動炸彈到玩家面前的位置
  this.moveBombToPlayerFront(bomb, player, map);
} else {
  console.log(`玩家 ${player.id} 面前沒有炸彈可踢`);
}
```

## 技術實現詳情

### 1. 玩家移動改進

#### 方向優先更新
- **即時方向**：無論是否能移動都先更新方向
- **位置檢查**：然後檢查是否可以移動到新位置
- **狀態同步**：確保玩家方向始終反映按鍵輸入

#### 調試信息
- **移動成功**：記錄玩家移動到的新位置
- **移動失敗**：記錄無法移動但方向已更新
- **狀態追蹤**：清楚顯示玩家的移動狀態

### 2. 踢炸彈檢測改進

#### 方向性檢測
- **面前檢測**：只檢測玩家面對方向的炸彈
- **精確定位**：根據玩家方向計算目標位置
- **即時反饋**：清楚顯示檢測結果

#### 檢測邏輯
```typescript
// 計算玩家面對的位置
let targetX = player.gridX;
let targetY = player.gridY;

switch (player.direction) {
  case Direction.UP: targetY = player.gridY - 1; break;
  case Direction.DOWN: targetY = player.gridY + 1; break;
  case Direction.LEFT: targetX = player.gridX - 1; break;
  case Direction.RIGHT: targetX = player.gridX + 1; break;
}
```

### 3. 炸彈立即移動

#### 位置計算
- **面前位置**：根據玩家方向計算面前位置
- **位置檢查**：檢查面前位置是否可以放置炸彈
- **即時移動**：如果可以則立即移動炸彈

#### 地圖更新
- **原位置**：恢復為空地（EMPTY）
- **新位置**：設置為炸彈（BOMB）
- **像素位置**：同步更新像素坐標

## 功能特性

### 1. 智能移動系統

#### 方向更新
- ✅ **即時響應**：按鍵後立即更新方向
- ✅ **障礙處理**：碰到障礙物仍能改變方向
- ✅ **狀態同步**：方向與按鍵輸入保持同步

#### 移動邏輯
- ✅ **位置檢查**：移動前檢查目標位置
- ✅ **條件移動**：只有空地和道具位置可以移動
- ✅ **像素同步**：網格位置與像素位置同步

### 2. 精確踢炸彈系統

#### 檢測範圍
- ✅ **面前檢測**：只檢測玩家面對方向的炸彈
- ✅ **精確定位**：根據玩家方向計算目標位置
- ✅ **即時反饋**：清楚顯示檢測結果

#### 踢動邏輯
- ✅ **方向性**：炸彈朝著玩家面對的方向移動
- ✅ **距離控制**：根據道具數量控制踢動距離
- ✅ **障礙檢測**：遇到障礙物會停止移動

### 3. 炸彈定位系統

#### 立即移動
- ✅ **面前定位**：炸彈立即移動到玩家面前
- ✅ **位置檢查**：檢查面前位置是否可以放置
- ✅ **地圖更新**：同步更新地圖格子類型

#### 狀態管理
- ✅ **位置同步**：網格位置與像素位置同步
- ✅ **地圖同步**：地圖格子類型與炸彈位置同步
- ✅ **狀態保持**：保持炸彈的其他屬性

## 使用方式

### 1. 玩家移動

#### 基本操作
1. **按方向鍵**：WASD 或方向鍵
2. **方向更新**：玩家方向立即更新
3. **位置移動**：如果可以移動則移動到新位置
4. **障礙處理**：碰到障礙物時方向仍會更新

#### 移動規則
- **空地**：可以移動
- **道具**：可以移動並收集
- **牆壁**：不能移動但方向會更新
- **炸彈**：不能移動但方向會更新

### 2. 踢炸彈操作

#### 基本操作
1. **獲得道具**：收集踢炸彈道具（👟）
2. **面對炸彈**：讓玩家面對想要踢動的炸彈
3. **按鍵踢動**：按 B 鍵（玩家1）或右 Shift 鍵（玩家2）
4. **觀察效果**：炸彈立即移動到玩家面前

#### 踢動規則
- **面前檢測**：只能踢動玩家面前的炸彈
- **方向性**：炸彈朝著玩家面對的方向移動
- **距離控制**：根據道具數量控制踢動距離
- **障礙檢測**：遇到障礙物會停止移動

### 3. 策略技巧

#### 移動策略
- **方向控制**：利用方向更新來調整面對方向
- **位置選擇**：選擇合適的位置來踢動炸彈
- **障礙利用**：利用牆壁來停止炸彈移動

#### 踢炸彈策略
- **精確定位**：確保玩家面對正確的炸彈
- **距離規劃**：根據道具數量規劃踢動距離
- **時機把握**：在合適的時機踢動炸彈

## 調試信息

### 1. 移動調試
```
玩家 1 移動到 (5, 3)
玩家 1 無法移動到 (6, 3)，但方向已更新為 3
```

### 2. 踢炸彈調試
```
玩家 1 面前有炸彈，位置: (5, 3)，方向: 3
玩家 1 踢動炸彈，方向: 3，炸彈位置: (5, 3)
炸彈移動到玩家面前位置: (6, 3)
```

### 3. 炸彈移動調試
```
炸彈踢動：從 (5, 3) 到 (6, 3)，距離: 1/2
炸彈踢動成功，距離: 1/2
炸彈踢動達到最大距離 2，停止踢動
```

## 技術改進

### 1. 移動系統
- **方向優先**：確保方向始終反映按鍵輸入
- **狀態同步**：方向與位置狀態保持同步
- **調試支持**：完整的移動狀態調試信息

### 2. 踢炸彈系統
- **精確檢測**：只檢測玩家面對方向的炸彈
- **即時移動**：炸彈立即移動到玩家面前
- **方向性**：炸彈朝著玩家面對的方向移動

### 3. 用戶體驗
- **操作直觀**：移動和踢炸彈操作更加直觀
- **反饋清晰**：清楚的調試信息幫助理解狀態
- **策略深度**：增加遊戲的策略性和趣味性

## 結論

通過修復玩家移動和踢炸彈功能，成功實現了：

1. **智能移動**：玩家碰到障礙物時仍能改變方向
2. **精確踢炸彈**：只能踢動玩家面前的炸彈
3. **炸彈定位**：炸彈被踢動後立即移動到適當位置
4. **狀態同步**：確保所有狀態保持同步

現在玩家移動和踢炸彈功能更加智能和精確，大大提升了遊戲的操作體驗和策略性！🎮💣👟
