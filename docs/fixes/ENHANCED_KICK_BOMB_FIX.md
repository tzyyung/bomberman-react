# 增強踢炸彈功能修復

## 問題分析

### 原始問題
1. **位置限制**：玩家必須站在炸彈的同一格子上才能踢炸彈
2. **距離固定**：炸彈踢動距離固定，無法根據道具數量增加
3. **體驗不佳**：需要精確站位，操作困難

### 用戶需求
1. **相鄰踢炸彈**：玩家在炸彈旁邊就可以踢炸彈
2. **距離累積**：根據吃到的踢炸彈道具數量增加踢動距離
3. **智能檢測**：檢查玩家與炸彈的距離和方向

## 解決方案

### 1. 智能炸彈檢測

#### 原始邏輯
```typescript
// 只檢查玩家當前位置
const bomb = bombs.find(b => 
  b.gridX === player.gridX && b.gridY === player.gridY && !b.exploded
);
```

#### 增強邏輯
```typescript
private findBombNearPlayer(player: Player, bombs: Bomb[]): Bomb | null {
  // 檢查玩家當前位置是否有炸彈
  let bomb = bombs.find(b => 
    b.gridX === player.gridX && b.gridY === player.gridY && !b.exploded
  );
  
  if (bomb) {
    return bomb;
  }
  
  // 檢查玩家旁邊的炸彈（相鄰格子）
  const adjacentPositions = [
    { x: player.gridX - 1, y: player.gridY }, // 左
    { x: player.gridX + 1, y: player.gridY }, // 右
    { x: player.gridX, y: player.gridY - 1 }, // 上
    { x: player.gridX, y: player.gridY + 1 }  // 下
  ];
  
  for (const pos of adjacentPositions) {
    bomb = bombs.find(b => 
      b.gridX === pos.x && b.gridY === pos.y && !b.exploded
    );
    
    if (bomb) {
      return bomb;
    }
  }
  
  return null;
}
```

### 2. 動態踢動距離

#### 數據結構更新
```typescript
// Player 接口
interface Player {
  // ... 其他屬性
  kickCount: number; // 踢炸彈道具數量
}

// Bomb 接口
interface Bomb {
  // ... 其他屬性
  maxKickDistance?: number; // 最大踢動距離
}
```

#### 道具累積效果
```typescript
case PowerUpType.KICK:
  player.canKick = true;
  player.kickCount = (player.kickCount || 0) + 1;
  console.log(`玩家 ${player.id} 獲得踢炸彈道具，可以踢炸彈，踢動距離: ${player.kickCount}`);
  break;
```

#### 炸彈踢動距離設置
```typescript
// 踢炸彈時設置最大距離
bomb.maxKickDistance = player.kickCount || 1;

// 炸彈創建時設置初始距離
maxKickDistance: player.kickCount || 1,
```

### 3. 智能踢動更新

#### 距離檢查
```typescript
private updateKickedBomb(bomb: Bomb, map: MapTile[][]): void {
  if (bomb.kickDirection === null) return;
  
  // 檢查是否達到最大踢動距離
  const maxDistance = bomb.maxKickDistance || 1;
  if (bomb.kickDistance >= maxDistance) {
    console.log(`炸彈踢動達到最大距離 ${maxDistance}，停止踢動`);
    bomb.kicked = false;
    bomb.kickDirection = null;
    return;
  }
  
  // ... 移動邏輯
}
```

## 技術實現詳情

### 1. 智能檢測系統

#### 檢測範圍
- **當前位置**：玩家站立的格子
- **相鄰位置**：上下左右四個相鄰格子
- **優先級**：當前位置優先，相鄰位置次之

#### 檢測邏輯
```typescript
const adjacentPositions = [
  { x: player.gridX - 1, y: player.gridY }, // 左
  { x: player.gridX + 1, y: player.gridY }, // 右
  { x: player.gridX, y: player.gridY - 1 }, // 上
  { x: player.gridX, y: player.gridY + 1 }  // 下
];
```

### 2. 距離累積系統

#### 道具收集
- **初始狀態**：`kickCount = 0`
- **獲得道具**：`kickCount += 1`
- **距離計算**：`maxKickDistance = kickCount`

#### 距離應用
- **新炸彈**：創建時設置 `maxKickDistance`
- **舊炸彈**：獲得道具時更新 `maxKickDistance`
- **踢動檢查**：每次移動前檢查距離限制

### 3. 狀態同步系統

#### 玩家狀態更新
```typescript
private updatePlayerBombsKickAbility(player: Player): void {
  this.gameState.bombs.forEach(bomb => {
    if (bomb.ownerId === player.id && !bomb.exploded) {
      bomb.canKick = player.canKick;
      bomb.maxKickDistance = player.kickCount || 1;
    }
  });
}
```

#### 即時同步
- **道具收集時**：立即更新所有相關炸彈
- **狀態保持**：確保玩家和炸彈狀態一致
- **距離同步**：新舊炸彈都使用最新距離

## 功能特性

### 1. 智能踢炸彈

#### 檢測範圍
- ✅ **當前位置**：玩家站立的格子
- ✅ **相鄰位置**：上下左右四個相鄰格子
- ✅ **優先級**：當前位置優先檢測

#### 操作便利性
- ✅ **無需精確站位**：在炸彈旁邊就可以踢
- ✅ **方向靈活**：可以從任何方向踢炸彈
- ✅ **即時響應**：按鍵後立即檢測

### 2. 動態距離系統

#### 距離累積
- ✅ **道具累積**：每獲得一個踢炸彈道具增加1格距離
- ✅ **即時生效**：獲得道具後立即更新所有炸彈
- ✅ **狀態同步**：新舊炸彈都使用最新距離

#### 距離限制
- ✅ **最大距離**：根據道具數量設置最大踢動距離
- ✅ **距離檢查**：每次移動前檢查是否達到最大距離
- ✅ **自動停止**：達到最大距離後自動停止踢動

### 3. 調試信息系統

#### 檢測調試
```
玩家 1 在炸彈位置 (5, 3)
玩家 1 旁邊有炸彈，位置: (6, 3)
玩家 1 旁邊沒有炸彈可踢
```

#### 距離調試
```
玩家 1 獲得踢炸彈道具，可以踢炸彈，踢動距離: 2
炸彈踢動：從 (5, 3) 到 (6, 3)，距離: 1/2
炸彈踢動成功，距離: 1/2
炸彈踢動達到最大距離 2，停止踢動
```

## 使用方式

### 1. 基本操作

#### 踢炸彈步驟
1. **獲得道具**：收集踢炸彈道具（👟）
2. **靠近炸彈**：站在炸彈旁邊（相鄰格子）
3. **按鍵踢動**：按 B 鍵（玩家1）或右 Shift 鍵（玩家2）
4. **觀察效果**：炸彈朝著玩家面對的方向移動

#### 距離累積
1. **第一個道具**：踢動距離 1 格
2. **第二個道具**：踢動距離 2 格
3. **第三個道具**：踢動距離 3 格
4. **以此類推**：每獲得一個道具增加 1 格距離

### 2. 策略技巧

#### 戰術應用
- **遠距離踢動**：利用多個道具增加踢動距離
- **方向控制**：從不同方向踢動炸彈
- **障礙利用**：利用牆壁停止炸彈移動
- **連鎖爆炸**：將炸彈踢到其他炸彈附近

#### 操作技巧
- **相鄰站位**：不需要精確站在炸彈上
- **方向選擇**：選擇合適的踢動方向
- **距離控制**：根據需要控制踢動距離
- **時機把握**：在合適的時機踢動炸彈

### 3. 注意事項

#### 限制條件
- **道具需求**：需要先獲得踢炸彈道具
- **冷卻時間**：踢炸彈有 300ms 冷卻時間
- **距離限制**：不能超過最大踢動距離
- **障礙阻擋**：遇到障礙物會停止移動

#### 最佳實踐
- **道具收集**：盡可能收集多個踢炸彈道具
- **位置選擇**：選擇合適的位置踢動炸彈
- **方向規劃**：提前規劃炸彈的移動路徑
- **時機把握**：在關鍵時刻使用踢炸彈

## 技術改進

### 1. 智能檢測
- **範圍擴大**：從單一格子擴展到相鄰格子
- **優先級**：當前位置優先，相鄰位置次之
- **效率優化**：快速檢測最近的炸彈

### 2. 距離系統
- **動態距離**：根據道具數量動態調整
- **狀態同步**：確保所有炸彈使用最新距離
- **即時更新**：獲得道具後立即生效

### 3. 用戶體驗
- **操作簡化**：不需要精確站位
- **視覺反饋**：清楚的調試信息
- **策略深度**：增加遊戲的策略性

## 結論

通過智能檢測和動態距離系統，成功實現了增強的踢炸彈功能：

1. **智能檢測**：玩家在炸彈旁邊就可以踢炸彈
2. **距離累積**：根據道具數量增加踢動距離
3. **狀態同步**：確保所有炸彈使用最新距離
4. **用戶體驗**：大大提升了操作的便利性

現在踢炸彈功能更加智能和靈活，大大增加了遊戲的策略性和趣味性！💣👟⚡
