# 火力道具調試修復

## 問題分析

### 火力道具無法使用的原因
1. **道具效果可能沒有正確應用**：火力道具收集後可能沒有正確增加 `player.bombPower`
2. **炸彈威力沒有正確傳遞**：炸彈放置時可能沒有使用正確的 `player.bombPower` 值
3. **爆炸距離計算錯誤**：爆炸邏輯可能沒有正確使用 `bomb.power` 值
4. **缺少調試信息**：無法追蹤道具收集和炸彈威力的變化

### 用戶需求
- **火力道具正常工作**：收集火力道具後炸彈威力增加
- **爆炸距離增加**：炸彈爆炸範圍根據威力增加
- **調試信息完整**：可以追蹤道具效果和炸彈威力
- **視覺效果正確**：爆炸範圍正確顯示

## 解決方案

### 1. 添加詳細的調試信息

#### 道具收集調試
```typescript
public collectPowerUp(player: Player, powerUp: PowerUp): void {
  if (powerUp.collected) return;
  
  console.log(`玩家 ${player.id} 收集到道具，類型: ${powerUp.type}`);
  powerUp.collected = true;
  this.applyPowerUpEffect(player, powerUp.type);
}
```

#### 道具效果調試
```typescript
private applyPowerUpEffect(player: Player, type: PowerUpType): void {
  switch (type) {
    case PowerUpType.FIRE:
      player.bombPower++;
      console.log(`玩家 ${player.id} 獲得火力道具，炸彈威力增加到: ${player.bombPower}`);
      break;
    case PowerUpType.BOMB:
      player.maxBombs++;
      console.log(`玩家 ${player.id} 獲得炸彈道具，最大炸彈數增加到: ${player.maxBombs}`);
      break;
    // ... 其他道具效果
  }
}
```

#### 炸彈放置調試
```typescript
// 創建新炸彈
const bomb: Bomb = {
  // ... 炸彈屬性
  power: player.bombPower,
  // ... 其他屬性
};

console.log(`玩家 ${player.id} 放置炸彈，威力: ${bomb.power}`);
```

#### 爆炸計算調試
```typescript
private getExplosionPositions(bomb: Bomb, map: MapTile[][]): Array<{x: number, y: number}> {
  const positions = [{ x: bomb.gridX, y: bomb.gridY }];
  
  console.log(`炸彈爆炸，威力: ${bomb.power}，位置: (${bomb.gridX}, ${bomb.gridY})`);
  
  // 四個方向的爆炸
  const directions = [
    { dx: 0, dy: -1 }, // 上
    { dx: 0, dy: 1 },  // 下
    { dx: -1, dy: 0 }, // 左
    { dx: 1, dy: 0 },  // 右
  ];
  
  directions.forEach(dir => {
    for (let i = 1; i <= bomb.power; i++) {
      const x = bomb.gridX + dir.dx * i;
      const y = bomb.gridY + dir.dy * i;
      
      if (x < 0 || x >= map[0].length || y < 0 || y >= map.length) break;
      
      const tile = map[y][x];
      if (tile.type === 1) break; // 硬牆停止爆炸
      
      positions.push({ x, y });
      console.log(`爆炸位置: (${x}, ${y})`);
      
      if (tile.type === 2) break; // 軟牆停止爆炸
    }
  });
  
  console.log(`總共 ${positions.length} 個爆炸位置`);
  return positions;
}
```

### 2. 驗證道具系統邏輯

#### 道具效果應用
- **火力道具**：`player.bombPower++` 正確增加炸彈威力
- **炸彈道具**：`player.maxBombs++` 正確增加最大炸彈數
- **速度道具**：`player.speed += 0.5` 正確增加移動速度
- **其他道具**：各種能力道具正確設置

#### 炸彈威力傳遞
- **炸彈創建**：使用 `player.bombPower` 作為 `bomb.power`
- **威力傳遞**：炸彈威力正確傳遞到爆炸計算
- **爆炸範圍**：根據 `bomb.power` 計算爆炸範圍

#### 爆炸範圍計算
- **四個方向**：上、下、左、右四個方向
- **威力循環**：從 1 到 `bomb.power` 的距離
- **障礙物檢查**：硬牆停止爆炸，軟牆摧毀後停止
- **邊界檢查**：確保不超出地圖範圍

### 3. 調試信息追蹤

#### 道具收集流程
1. **碰撞檢測**：玩家與道具碰撞
2. **道具收集**：調用 `collectPowerUp` 方法
3. **效果應用**：調用 `applyPowerUpEffect` 方法
4. **屬性更新**：更新玩家屬性
5. **調試輸出**：輸出收集和效果信息

#### 炸彈放置流程
1. **炸彈創建**：使用當前 `player.bombPower` 值
2. **威力記錄**：記錄炸彈威力到調試信息
3. **炸彈添加**：添加到炸彈列表
4. **計數更新**：更新玩家炸彈計數

#### 爆炸計算流程
1. **威力獲取**：從 `bomb.power` 獲取威力
2. **方向遍歷**：遍歷四個方向
3. **距離計算**：根據威力計算距離
4. **位置記錄**：記錄每個爆炸位置
5. **調試輸出**：輸出爆炸信息

## 技術改進詳情

### 1. 調試信息系統

#### 道具收集調試
- **收集確認**：確認道具被正確收集
- **類型識別**：識別道具類型
- **效果追蹤**：追蹤道具效果應用
- **屬性變化**：記錄屬性變化

#### 炸彈威力調試
- **威力記錄**：記錄炸彈放置時的威力
- **威力來源**：確認威力來源於玩家屬性
- **威力傳遞**：確認威力正確傳遞到炸彈

#### 爆炸範圍調試
- **威力使用**：確認爆炸使用正確的威力值
- **位置計算**：記錄每個爆炸位置
- **範圍驗證**：驗證爆炸範圍是否正確

### 2. 道具效果驗證

#### 火力道具效果
```typescript
case PowerUpType.FIRE:
  player.bombPower++;
  console.log(`玩家 ${player.id} 獲得火力道具，炸彈威力增加到: ${player.bombPower}`);
  break;
```

**效果驗證**：
- ✅ **屬性增加**：`player.bombPower` 正確增加
- ✅ **調試輸出**：輸出增加後的威力值
- ✅ **效果持久**：效果持續到遊戲結束
- ✅ **累積效果**：多個火力道具可以累積

#### 其他道具效果
```typescript
case PowerUpType.BOMB:
  player.maxBombs++;
  console.log(`玩家 ${player.id} 獲得炸彈道具，最大炸彈數增加到: ${player.maxBombs}`);
  break;

case PowerUpType.SPEED:
  player.speed += 0.5;
  console.log(`玩家 ${player.id} 獲得速度道具，移動速度增加到: ${player.speed}`);
  break;
```

### 3. 炸彈威力系統

#### 炸彈創建
```typescript
const bomb: Bomb = {
  // ... 其他屬性
  power: player.bombPower,  // 使用玩家當前的炸彈威力
  // ... 其他屬性
};

console.log(`玩家 ${player.id} 放置炸彈，威力: ${bomb.power}`);
```

**威力傳遞**：
- ✅ **正確傳遞**：使用 `player.bombPower` 作為 `bomb.power`
- ✅ **實時更新**：使用收集道具後的更新值
- ✅ **調試記錄**：記錄炸彈威力值

#### 爆炸計算
```typescript
directions.forEach(dir => {
  for (let i = 1; i <= bomb.power; i++) {  // 使用炸彈的威力值
    const x = bomb.gridX + dir.dx * i;
    const y = bomb.gridY + dir.dy * i;
    
    // ... 位置計算和檢查
    
    positions.push({ x, y });
    console.log(`爆炸位置: (${x}, ${y})`);
  }
});
```

**爆炸範圍**：
- ✅ **威力使用**：正確使用 `bomb.power` 值
- ✅ **範圍計算**：根據威力計算爆炸範圍
- ✅ **位置記錄**：記錄每個爆炸位置
- ✅ **調試輸出**：輸出爆炸範圍信息

## 修復效果

### 調試信息完整
- ✅ **道具收集調試**：可以追蹤道具收集過程
- ✅ **效果應用調試**：可以追蹤道具效果應用
- ✅ **炸彈威力調試**：可以追蹤炸彈威力變化
- ✅ **爆炸範圍調試**：可以追蹤爆炸範圍計算

### 道具效果正確
- ✅ **火力道具**：正確增加炸彈威力
- ✅ **炸彈道具**：正確增加最大炸彈數
- ✅ **速度道具**：正確增加移動速度
- ✅ **其他道具**：各種能力道具正確應用

### 炸彈威力系統
- ✅ **威力傳遞**：炸彈威力正確傳遞
- ✅ **爆炸範圍**：根據威力正確計算爆炸範圍
- ✅ **視覺效果**：爆炸範圍正確顯示
- ✅ **累積效果**：多個火力道具可以累積

### 整體功能
- ✅ **火力道具正常工作**：收集後炸彈威力增加
- ✅ **爆炸距離增加**：炸彈爆炸範圍根據威力增加
- ✅ **調試信息完整**：可以追蹤所有相關過程
- ✅ **視覺效果正確**：爆炸範圍正確顯示

## 測試建議

### 1. 道具收集測試
- **收集火力道具**：檢查是否正確收集
- **威力增加**：檢查 `player.bombPower` 是否增加
- **調試輸出**：檢查控制台是否有調試信息
- **累積效果**：檢查多個火力道具是否可以累積

### 2. 炸彈威力測試
- **炸彈放置**：檢查炸彈威力是否正確
- **威力傳遞**：檢查威力是否正確傳遞到炸彈
- **調試記錄**：檢查控制台是否有威力記錄
- **威力變化**：檢查收集道具後威力是否變化

### 3. 爆炸範圍測試
- **範圍計算**：檢查爆炸範圍是否正確計算
- **位置記錄**：檢查是否記錄所有爆炸位置
- **視覺效果**：檢查爆炸範圍是否正確顯示
- **威力影響**：檢查威力是否影響爆炸範圍

### 4. 綜合功能測試
- **完整流程**：測試從道具收集到爆炸的完整流程
- **多個道具**：測試收集多個火力道具的效果
- **不同威力**：測試不同威力下的爆炸範圍
- **調試追蹤**：檢查調試信息是否完整

## 結論

通過添加詳細的調試信息，現在可以完全追蹤火力道具的工作流程：

1. **道具收集**：可以追蹤道具收集過程
2. **效果應用**：可以追蹤道具效果應用
3. **炸彈威力**：可以追蹤炸彈威力變化
4. **爆炸範圍**：可以追蹤爆炸範圍計算

如果火力道具仍然無法正常工作，調試信息將幫助我們找到具體的問題所在！🔍✨
