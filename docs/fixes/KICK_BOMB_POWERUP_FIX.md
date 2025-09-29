# 踢炸彈道具修復

## 問題分析

### 問題描述
玩家吃到了踢炸彈道具（👟），但是已經放置的炸彈卻不能踢動。

### 根本原因
當玩家獲得踢炸彈道具時，只有 `player.canKick` 被設置為 `true`，但是已經放置的炸彈的 `canKick` 屬性沒有更新。這導致：

1. **新炸彈**：可以踢動（因為創建時會複製 `player.canKick`）
2. **舊炸彈**：不能踢動（因為 `bomb.canKick` 仍然是 `false`）

### 問題流程
1. **玩家放置炸彈**：`bomb.canKick = player.canKick`（此時為 `false`）
2. **玩家獲得道具**：`player.canKick = true`
3. **嘗試踢炸彈**：檢查 `bomb.canKick`（仍然是 `false`）
4. **踢動失敗**：因為炸彈的 `canKick` 屬性沒有更新

## 解決方案

### 1. 在道具收集時更新已放置的炸彈

#### 修改 GameEngine.checkCollisions 方法
```typescript
// 檢查玩家與道具的碰撞
this.gameState.players.forEach(player => {
  if (!player.alive) return;
  
  this.gameState.powerUps.forEach(powerUp => {
    if (!powerUp.collected && this.isColliding(player, powerUp)) {
      this.systems.powerUp.collectPowerUp(player, powerUp);
      this.systems.audio.playSound('powerup_collect');
      
      // 如果獲得踢炸彈道具，更新玩家已放置的炸彈
      if (powerUp.type === 3) { // PowerUpType.KICK
        this.updatePlayerBombsKickAbility(player);
      }
    }
  });
});
```

#### 添加 updatePlayerBombsKickAbility 方法
```typescript
private updatePlayerBombsKickAbility(player: Player): void {
  console.log(`更新玩家 ${player.id} 的炸彈踢動能力`);
  
  // 更新玩家已放置的炸彈的 canKick 屬性
  this.gameState.bombs.forEach(bomb => {
    if (bomb.ownerId === player.id && !bomb.exploded) {
      bomb.canKick = player.canKick;
      console.log(`更新炸彈 ${bomb.id} 的踢動能力: ${bomb.canKick}`);
    }
  });
}
```

### 2. 修復要點

#### 道具類型檢查
- **正確類型**：使用 `powerUp.type === 3` 檢查踢炸彈道具
- **類型對應**：`PowerUpType.KICK = 3`

#### 炸彈更新邏輯
- **所有者檢查**：只更新屬於該玩家的炸彈
- **狀態檢查**：只更新未爆炸的炸彈
- **屬性同步**：將 `player.canKick` 同步到 `bomb.canKick`

#### 調試信息
- **更新確認**：記錄炸彈踢動能力的更新過程
- **狀態追蹤**：追蹤每個炸彈的 `canKick` 狀態

## 技術實現詳情

### 1. 道具收集流程

#### 原始流程
1. **道具碰撞檢測**：檢查玩家與道具的碰撞
2. **道具收集**：調用 `PowerUpSystem.collectPowerUp`
3. **效果應用**：設置 `player.canKick = true`
4. **道具移除**：從遊戲中移除道具

#### 修復後流程
1. **道具碰撞檢測**：檢查玩家與道具的碰撞
2. **道具收集**：調用 `PowerUpSystem.collectPowerUp`
3. **效果應用**：設置 `player.canKick = true`
4. **炸彈更新**：更新玩家已放置的炸彈
5. **道具移除**：從遊戲中移除道具

### 2. 炸彈更新邏輯

#### 更新條件
- **所有者匹配**：`bomb.ownerId === player.id`
- **未爆炸**：`!bomb.exploded`
- **道具類型**：`powerUp.type === 3`（踢炸彈道具）

#### 更新過程
```typescript
this.gameState.bombs.forEach(bomb => {
  if (bomb.ownerId === player.id && !bomb.exploded) {
    bomb.canKick = player.canKick;
    console.log(`更新炸彈 ${bomb.id} 的踢動能力: ${bomb.canKick}`);
  }
});
```

### 3. 調試信息系統

#### 更新確認
- **玩家確認**：記錄哪個玩家獲得了踢炸彈能力
- **炸彈更新**：記錄每個炸彈的更新狀態
- **能力同步**：確認 `bomb.canKick` 與 `player.canKick` 同步

#### 調試輸出示例
```
玩家 1 獲得踢炸彈道具，可以踢炸彈
更新玩家 1 的炸彈踢動能力
更新炸彈 bomb_123 的踢動能力: true
更新炸彈 bomb_456 的踢動能力: true
```

## 修復效果

### 1. 功能修復
- ✅ **新炸彈**：可以正常踢動
- ✅ **舊炸彈**：獲得道具後也可以踢動
- ✅ **能力同步**：玩家能力與炸彈能力保持同步
- ✅ **即時生效**：獲得道具後立即可以踢動所有炸彈

### 2. 用戶體驗
- ✅ **一致性**：所有炸彈都可以踢動
- ✅ **即時性**：獲得道具後立即生效
- ✅ **可預測性**：行為符合玩家預期

### 3. 技術改進
- ✅ **狀態同步**：玩家狀態與炸彈狀態保持同步
- ✅ **調試支持**：完整的調試信息系統
- ✅ **性能優化**：只更新必要的炸彈

## 測試驗證

### 1. 基本功能測試
1. **放置炸彈**：在獲得踢炸彈道具前放置炸彈
2. **獲得道具**：收集踢炸彈道具（👟）
3. **嘗試踢動**：嘗試踢動之前放置的炸彈
4. **驗證結果**：確認炸彈可以被踢動

### 2. 調試信息驗證
1. **控制台輸出**：檢查是否有更新炸彈能力的調試信息
2. **狀態確認**：確認 `bomb.canKick` 被正確設置
3. **能力同步**：確認玩家和炸彈的能力保持同步

### 3. 邊界情況測試
1. **多個炸彈**：測試多個炸彈的更新
2. **已爆炸炸彈**：確認不會更新已爆炸的炸彈
3. **其他玩家炸彈**：確認不會更新其他玩家的炸彈

## 結論

通過在道具收集時更新玩家已放置的炸彈的 `canKick` 屬性，成功修復了踢炸彈道具的問題：

1. **問題根源**：已放置炸彈的 `canKick` 屬性沒有更新
2. **解決方案**：在獲得踢炸彈道具時更新所有相關炸彈
3. **修復效果**：所有炸彈都可以正常踢動
4. **技術改進**：狀態同步和調試支持

現在玩家獲得踢炸彈道具後，所有已放置的炸彈都可以正常踢動了！💣👟
