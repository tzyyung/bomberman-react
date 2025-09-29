# 炸彈超人 React 版 - 技術架構文檔

## 🏗️ 系統架構概覽

### 整體架構圖
```
┌─────────────────────────────────────────────────────────┐
│                    React 應用層                         │
│  ┌─────────────────┐  ┌─────────────────────────────────┐ │
│  │   App.tsx       │  │        GameEngine.ts            │ │
│  │   (主組件)       │  │        (遊戲引擎核心)           │ │
│  └─────────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    遊戲系統層                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ MapSystem   │ │PlayerSystem │ │ BombSystem  │        │
│  │ (地圖系統)   │ │ (玩家系統)  │ │ (炸彈系統)  │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │PowerUpSystem│ │AudioSystem  │ │  UISystem   │        │
│  │ (道具系統)   │ │ (音頻系統)  │ │ (UI系統)    │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    平台抽象層                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │HTML5 Canvas │ │Web Audio API│ │DOM Events   │        │
│  │ (渲染引擎)   │ │ (音頻引擎)  │ │ (事件系統)  │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    瀏覽器環境                           │
└─────────────────────────────────────────────────────────┘
```

## 🔧 核心組件設計

### 1. GameEngine (遊戲引擎)
**職責**: 遊戲核心控制器，協調所有系統

```typescript
class GameEngine {
  // 核心屬性
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private gameState: GameState
  private systems: GameSystems
  
  // 生命週期管理
  public startGame(): void
  public pauseGame(): void
  public resumeGame(): void
  public restartGame(): void
  public destroy(): void
  
  // 遊戲循環
  private gameLoop(): void
  private update(deltaTime: number): void
  private render(): void
  
  // 輸入處理
  private handleKeyDown(event: KeyboardEvent): void
  private parseKeyEvent(event: KeyboardEvent): InputEvent | null
}
```

### 2. 系統架構設計

#### MapSystem (地圖系統)
```typescript
class MapSystem {
  // 地圖生成
  public generateMap(): MapTile[][]
  private createTileImages(): void
  
  // 碰撞檢測
  public isWalkable(x: number, y: number, map: MapTile[][]): boolean
  public canPlaceBomb(x: number, y: number, map: MapTile[][]): boolean
  
  // 地圖修改
  public destroySoftWall(x: number, y: number, map: MapTile[][]): boolean
  
  // 渲染
  public render(ctx: CanvasRenderingContext2D, map: MapTile[][]): void
}
```

#### PlayerSystem (玩家系統)
```typescript
class PlayerSystem {
  // 玩家管理
  public createPlayer(x: number, y: number, id: number, color: string): Player
  public updatePlayers(players: Player[], map: MapTile[][], deltaTime: number): void
  
  // 移動控制
  public movePlayer(player: Player, direction: Direction, map: MapTile[][]): void
  private canMoveTo(x: number, y: number, map: MapTile[][]): boolean
  
  // 道具效果
  public applyPowerUp(player: Player, powerUpType: PowerUpType): void
  
  // 渲染
  public render(ctx: CanvasRenderingContext2D, players: Player[]): void
}
```

#### BombSystem (炸彈系統)
```typescript
class BombSystem {
  // 炸彈管理
  public placeBomb(player: Player, bombs: Bomb[], map: MapTile[][]): void
  public updateBombs(bombs: Bomb[], map: MapTile[][], deltaTime: number): void
  
  // 爆炸邏輯
  private explodeBomb(bomb: Bomb, bombs: Bomb[], map: MapTile[][]): void
  private createExplosion(bomb: Bomb, map: MapTile[][]): void
  private getExplosionPositions(bomb: Bomb, map: MapTile[][]): Position[]
  
  // 特殊功能
  public kickBomb(player: Player, bombs: Bomb[], map: MapTile[][]): void
  public remoteExplode(player: Player, bombs: Bomb[]): void
  
  // 渲染
  public render(ctx: CanvasRenderingContext2D, bombs: Bomb[]): void
}
```

## 📊 數據流設計

### 遊戲狀態流
```
用戶輸入 → 輸入解析 → 遊戲邏輯更新 → 狀態同步 → 渲染輸出
    ↓           ↓            ↓           ↓         ↓
鍵盤事件 → InputEvent → GameEngine → GameState → Canvas
```

### 系統間通信
```
GameEngine (協調者)
    ↓
┌───┬───┬───┬───┬───┬───┐
│Map│Ply│Bmb│Pwr│Aud│UI │
└───┴───┴───┴───┴───┴───┘
    ↑
共享狀態 (GameState)
```

## 🎮 遊戲循環設計

### 主循環流程
```typescript
function gameLoop() {
  // 1. 計算時間差
  const currentTime = performance.now()
  const deltaTime = currentTime - lastTime
  lastTime = currentTime
  
  // 2. 處理輸入
  processInput()
  
  // 3. 更新遊戲邏輯
  if (!paused) {
    update(deltaTime)
  }
  
  // 4. 渲染畫面
  render()
  
  // 5. 請求下一幀
  requestAnimationFrame(gameLoop)
}
```

### 更新順序
1. **輸入處理** - 處理用戶輸入
2. **玩家更新** - 更新玩家位置和狀態
3. **炸彈更新** - 更新炸彈計時和爆炸
4. **爆炸更新** - 更新爆炸效果
5. **道具更新** - 更新道具狀態
6. **碰撞檢測** - 檢查各種碰撞
7. **遊戲狀態** - 更新遊戲狀態

## 🔄 狀態管理設計

### 遊戲狀態結構
```typescript
interface GameState {
  // 基本狀態
  state: 'menu' | 'playing' | 'paused' | 'over'
  winner: number | null
  paused: boolean
  time: number
  
  // 遊戲對象
  players: Player[]
  bombs: Bomb[]
  powerUps: PowerUp[]
  explosions: Explosion[]
  map: MapTile[][]
  
  // 分數和統計
  score: { player1: number, player2: number }
}
```

### 狀態轉換圖
```
    ┌─────────┐
    │  MENU   │
    └────┬────┘
         │ startGame()
         ▼
    ┌─────────┐
    │ PLAYING │◄──┐
    └────┬────┘   │
         │        │
    pauseGame()   │ resumeGame()
         ▼        │
    ┌─────────┐   │
    │ PAUSED  │───┘
    └────┬────┘
         │ gameOver()
         ▼
    ┌─────────┐
    │  OVER   │
    └─────────┘
```

## 🎨 渲染架構設計

### 渲染層次
```
┌─────────────────────────────────┐
│            UI 層                │ (菜單、HUD、對話框)
├─────────────────────────────────┤
│          遊戲對象層              │ (玩家、炸彈、道具、爆炸)
├─────────────────────────────────┤
│           地圖層                │ (瓦片、背景)
├─────────────────────────────────┤
│           背景層                │ (純色背景)
└─────────────────────────────────┘
```

### 渲染順序
1. **清空畫布** - 清除上一幀內容
2. **渲染地圖** - 繪製地圖瓦片
3. **渲染道具** - 繪製道具
4. **渲染炸彈** - 繪製炸彈
5. **渲染爆炸** - 繪製爆炸效果
6. **渲染玩家** - 繪製玩家
7. **渲染UI** - 繪製用戶界面

## 🔊 音頻架構設計

### 音頻系統結構
```typescript
class AudioSystem {
  private audioContext: AudioContext
  private sounds: Map<string, AudioBuffer>
  private music: HTMLAudioElement | null
  private volume: number
  
  // 音效管理
  public playSound(soundName: string): void
  public playMusic(musicName: string): void
  public stopMusic(): void
  
  // 音量控制
  public setVolume(volume: number): void
  public getVolume(): number
}
```

### 音效分類
- **遊戲音效**: 炸彈放置、爆炸、玩家死亡
- **道具音效**: 道具收集、能力激活
- **UI音效**: 按鈕點擊、菜單切換
- **背景音樂**: 主選單音樂、遊戲音樂

## 🚀 性能優化策略

### 渲染優化
```typescript
// 1. 髒矩形更新
const dirtyRects: Rectangle[] = []

// 2. 對象池模式
class ObjectPool<T> {
  private pool: T[] = []
  public get(): T
  public release(obj: T): void
}

// 3. 視錐剔除
function isInViewport(obj: GameObject): boolean {
  return obj.x >= viewportLeft && obj.x <= viewportRight
}
```

### 內存管理
```typescript
// 1. 及時清理
function cleanup() {
  // 清理已爆炸的炸彈
  bombs = bombs.filter(bomb => !bomb.exploded)
  
  // 清理已收集的道具
  powerUps = powerUps.filter(powerUp => !powerUp.collected)
  
  // 清理已結束的爆炸
  explosions = explosions.filter(explosion => explosion.duration > 0)
}

// 2. 對象重用
const bombPool = new ObjectPool<Bomb>()
const explosionPool = new ObjectPool<Explosion>()
```

### 事件優化
```typescript
// 1. 防抖處理
const debouncedInput = debounce(handleInput, 16) // 60fps

// 2. 事件節流
let lastInputTime = 0
function handleInput(event: InputEvent) {
  const now = Date.now()
  if (now - lastInputTime < 16) return // 限制60fps
  lastInputTime = now
  // 處理輸入
}
```

## 🧪 測試架構設計

### 測試層次
```
┌─────────────────────────────────┐
│         E2E 測試                │ (完整遊戲流程)
├─────────────────────────────────┤
│         集成測試                │ (系統間交互)
├─────────────────────────────────┤
│         單元測試                │ (個別系統測試)
└─────────────────────────────────┘
```

### 測試策略
```typescript
// 單元測試示例
describe('BombSystem', () => {
  test('should place bomb when player has capacity', () => {
    const player = createTestPlayer()
    const bombs: Bomb[] = []
    const map = createTestMap()
    
    bombSystem.placeBomb(player, bombs, map)
    
    expect(bombs).toHaveLength(1)
    expect(player.bombCount).toBe(1)
  })
})

// 集成測試示例
describe('GameEngine Integration', () => {
  test('should handle complete game flow', () => {
    const engine = new GameEngine(canvas)
    engine.startGame()
    
    // 模擬遊戲進行
    simulateGameplay()
    
    expect(engine.getGameState().state).toBe('over')
  })
})
```

## 📱 響應式設計

### 屏幕適配策略
```typescript
// 1. 動態縮放
function calculateScale(): number {
  const canvasAspect = SCREEN_WIDTH / SCREEN_HEIGHT
  const windowAspect = window.innerWidth / window.innerHeight
  
  if (windowAspect > canvasAspect) {
    return window.innerHeight / SCREEN_HEIGHT
  } else {
    return window.innerWidth / SCREEN_WIDTH
  }
}

// 2. 居中顯示
function centerCanvas() {
  const scale = calculateScale()
  const scaledWidth = SCREEN_WIDTH * scale
  const scaledHeight = SCREEN_HEIGHT * scale
  
  canvas.style.width = `${scaledWidth}px`
  canvas.style.height = `${scaledHeight}px`
  canvas.style.margin = 'auto'
}
```

### 控制適配
```typescript
// 觸控支持
interface TouchControls {
  virtualButtons: VirtualButton[]
  handleTouchStart(event: TouchEvent): void
  handleTouchEnd(event: TouchEvent): void
}

// 遊戲手柄支持
interface GamepadSupport {
  handleGamepadInput(gamepad: Gamepad): void
  mapGamepadToKeyboard(gamepad: Gamepad): InputEvent[]
}
```

## 🔧 開發工具和流程

### 開發環境
```json
{
  "scripts": {
    "dev": "npm start",
    "build": "npm run build",
    "test": "npm test",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit"
  }
}
```

### 代碼質量
- **ESLint**: 代碼風格檢查
- **Prettier**: 代碼格式化
- **TypeScript**: 類型檢查
- **Husky**: Git hooks
- **Jest**: 單元測試

### 部署流程
```bash
# 1. 開發
npm run dev

# 2. 測試
npm run test
npm run lint
npm run type-check

# 3. 構建
npm run build

# 4. 部署
npm run deploy
```

## 📈 監控和分析

### 性能監控
```typescript
class PerformanceMonitor {
  private fps: number = 0
  private frameCount: number = 0
  private lastTime: number = 0
  
  public update(): void {
    this.frameCount++
    const now = performance.now()
    
    if (now - this.lastTime >= 1000) {
      this.fps = this.frameCount
      this.frameCount = 0
      this.lastTime = now
    }
  }
  
  public getFPS(): number {
    return this.fps
  }
}
```

### 錯誤追蹤
```typescript
class ErrorTracker {
  public static logError(error: Error, context: string): void {
    console.error(`[${context}] ${error.message}`, error.stack)
    
    // 發送到錯誤追蹤服務
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(error, context)
    }
  }
}
```

## 🎯 總結

本技術架構文檔詳細描述了炸彈超人 React 版的完整技術設計，包括：

1. **模組化架構** - 清晰的系統分離和職責劃分
2. **數據流設計** - 高效的狀態管理和系統通信
3. **性能優化** - 多層次的性能優化策略
4. **測試策略** - 完整的測試覆蓋方案
5. **響應式設計** - 跨平台適配方案
6. **開發流程** - 標準化的開發和部署流程

這個架構為遊戲的開發、維護和擴展提供了堅實的技術基礎，確保了代碼的可維護性和項目的可持續發展。
