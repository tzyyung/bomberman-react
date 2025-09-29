# 移動卡頓問題分析和解決方案

## 問題分析

### 1. 移動卡頓的主要原因

#### A. Web Worker 通信延遲
- **問題**：主線程和 Worker 之間的 `postMessage` 通信有延遲
- **影響**：輸入響應延遲，移動不夠即時
- **解決方案**：優化通信機制，減少不必要的數據傳輸

#### B. 渲染和邏輯更新不同步
- **問題**：渲染循環和遊戲邏輯更新頻率不一致
- **影響**：視覺上的卡頓和跳躍
- **解決方案**：統一更新頻率，優化渲染循環

#### C. 輸入處理延遲
- **問題**：輸入事件處理不夠及時
- **影響**：按鍵響應延遲
- **解決方案**：優化輸入處理機制

#### D. 平滑移動算法問題
- **問題**：移動插值計算可能造成卡頓
- **影響**：移動不流暢
- **解決方案**：優化移動算法

## 解決方案

### 1. 優化 Web Worker 通信

#### 減少通信頻率
```typescript
// 只在必要時發送輸入
private processInput(): void {
  while (this.inputQueue.length > 0) {
    const input = this.inputQueue.shift()!;
    
    if (this.worker && this.useWorker) {
      // 批量處理輸入，減少通信次數
      this.batchInputs.push(input);
      
      if (this.batchInputs.length >= 5 || Date.now() - this.lastInputTime > 16) {
        this.worker.postMessage({
          type: 'BATCH_INPUT',
          data: this.batchInputs
        });
        this.batchInputs = [];
        this.lastInputTime = Date.now();
      }
    } else {
      this.handleInput(input);
    }
  }
}
```

#### 優化數據傳輸
```typescript
// 只傳輸必要的數據
private sendGameStateUpdate(): void {
  if (this.worker && this.useWorker) {
    const minimalState = {
      players: this.gameState.players.map(p => ({
        id: p.id,
        pixelX: p.pixelX,
        pixelY: p.pixelY,
        gridX: p.gridX,
        gridY: p.gridY,
        direction: p.direction,
        alive: p.alive
      })),
      bombs: this.gameState.bombs.filter(b => !b.exploded),
      explosions: this.gameState.explosions,
      powerUps: this.gameState.powerUps.filter(p => !p.collected)
    };
    
    this.worker.postMessage({
      type: 'GAME_UPDATE',
      data: minimalState
    });
  }
}
```

### 2. 優化渲染循環

#### 統一更新頻率
```typescript
private gameLoop(): void {
  const currentTime = performance.now();
  const deltaTime = currentTime - this.lastTime;
  this.lastTime = currentTime;

  // 限制更新頻率到 60 FPS
  if (deltaTime >= 16.67) {
    if (!this.gameState.paused) {
      this.update(deltaTime);
    }
    
    this.render();
  }
  
  this.animationId = requestAnimationFrame(() => this.gameLoop());
}
```

#### 優化渲染性能
```typescript
private render(): void {
  // 清除畫布
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
  // 只渲染可見區域
  this.renderVisibleArea();
  
  // 使用離屏畫布緩存靜態元素
  this.renderStaticElements();
  
  // 渲染動態元素
  this.renderDynamicElements();
}
```

### 3. 優化輸入處理

#### 即時輸入響應
```typescript
private handleKeyDown(event: KeyboardEvent): void {
  event.preventDefault();
  
  const input = this.getInputFromKey(event.key);
  if (input) {
    // 立即處理移動輸入
    if (input.action === 'move') {
      this.handleImmediateMovement(input);
    } else {
      this.inputQueue.push(input);
    }
  }
}

private handleImmediateMovement(input: InputEvent): void {
  const player = this.gameState.players.find(p => p.id === input.playerId);
  if (!player || !player.alive) return;
  
  // 立即更新玩家位置，不等待 Worker
  this.updatePlayerPositionImmediate(player, input.direction);
  
  // 同時發送到 Worker 進行同步
  if (this.worker && this.useWorker) {
    this.worker.postMessage({
      type: 'INPUT',
      data: input
    });
  }
}
```

### 4. 優化移動算法

#### 改進平滑移動
```typescript
private updatePlayerPositionImmediate(player: Player, direction: Direction): void {
  // 檢查玩家是否已經在移動中
  const targetX = player.gridX * TILE_SIZE + TILE_SIZE / 2;
  const targetY = player.gridY * TILE_SIZE + TILE_SIZE / 2;
  const dx = targetX - player.pixelX;
  const dy = targetY - player.pixelY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // 如果玩家還在移動中，不允許新的移動
  if (distance > 1) return;
  
  let newX = player.gridX;
  let newY = player.gridY;
  
  switch (direction) {
    case Direction.UP:
      newY = player.gridY - 1;
      break;
    case Direction.DOWN:
      newY = player.gridY + 1;
      break;
    case Direction.LEFT:
      newX = player.gridX - 1;
      break;
    case Direction.RIGHT:
      newX = player.gridX + 1;
      break;
  }
  
  // 檢查是否可以移動到新位置
  if (this.canMoveToImmediate(newX, newY)) {
    player.gridX = newX;
    player.gridY = newY;
    player.direction = direction;
    
    // 立即開始平滑移動
    this.startSmoothMovement(player);
  }
}

private startSmoothMovement(player: Player): void {
  const targetX = player.gridX * TILE_SIZE + TILE_SIZE / 2;
  const targetY = player.gridY * TILE_SIZE + TILE_SIZE / 2;
  
  // 使用更平滑的移動算法
  const moveSpeed = player.speed * 0.2; // 調整移動速度
  
  const dx = targetX - player.pixelX;
  const dy = targetY - player.pixelY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance > 0.5) {
    const moveX = (dx / distance) * moveSpeed;
    const moveY = (dy / distance) * moveSpeed;
    
    player.pixelX += moveX;
    player.pixelY += moveY;
  } else {
    player.pixelX = targetX;
    player.pixelY = targetY;
  }
}
```

### 5. 混合模式解決方案

#### 主線程處理移動，Worker 處理其他邏輯
```typescript
export class GameEngine {
  private useHybridMode: boolean = true;
  
  private update(deltaTime: number): void {
    // 主線程處理移動
    this.updatePlayerMovement(deltaTime);
    
    if (this.worker && this.useWorker) {
      // Worker 處理其他邏輯
      this.worker.postMessage({
        type: 'UPDATE_LOGIC',
        data: { deltaTime, gameState: this.gameState }
      });
    } else {
      // 回退到主線程處理所有邏輯
      this.updateGameLogic(deltaTime);
    }
  }
  
  private updatePlayerMovement(deltaTime: number): void {
    this.gameState.players.forEach(player => {
      if (!player.alive) return;
      
      this.updatePlayerPositionSmooth(player, deltaTime);
    });
  }
}
```

## 實施建議

### 1. 立即實施
- 修復編譯錯誤
- 優化輸入處理
- 改進移動算法

### 2. 中期優化
- 實現混合模式
- 優化 Web Worker 通信
- 改進渲染性能

### 3. 長期優化
- 實現預測性移動
- 添加網絡同步
- 優化整體架構

## 測試方法

### 1. 性能測試
```typescript
// 添加性能監控
private monitorPerformance(): void {
  const fps = 1000 / (performance.now() - this.lastFrameTime);
  this.lastFrameTime = performance.now();
  
  if (fps < 55) {
    console.warn('FPS 過低:', fps);
  }
}
```

### 2. 移動測試
- 測試快速連續移動
- 測試長時間移動
- 測試不同方向的移動

### 3. 響應性測試
- 測試按鍵響應時間
- 測試移動延遲
- 測試視覺流暢度

## 預期效果

### 1. 性能改善
- 移動響應時間 < 16ms
- FPS 穩定在 60
- 無明顯卡頓

### 2. 用戶體驗
- 移動完全流暢
- 按鍵響應即時
- 視覺效果平滑

### 3. 兼容性
- 支持所有瀏覽器
- 自動回退機制
- 漸進增強

這個解決方案將徹底解決移動卡頓問題，提供流暢的遊戲體驗！
