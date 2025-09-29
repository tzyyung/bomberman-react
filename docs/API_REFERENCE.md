# 炸彈超人 React 版 - API 參考文檔

## 📚 文檔概述

本文檔提供了炸彈超人 React 版所有公共 API 的詳細參考，包括類、接口、方法和屬性。

## 🎮 核心 API

### GameEngine 類

遊戲引擎核心類，負責管理整個遊戲的生命週期。

```typescript
class GameEngine {
  constructor(canvas: HTMLCanvasElement)
  
  // 生命週期管理
  startGame(): void
  pauseGame(): void
  resumeGame(): void
  restartGame(): void
  showMenu(): void
  destroy(): void
  
  // 狀態查詢
  getGameState(): GameState
}
```

#### 方法詳解

##### `constructor(canvas: HTMLCanvasElement)`
初始化遊戲引擎。

**參數**:
- `canvas`: HTML5 Canvas 元素，用於遊戲渲染

**示例**:
```typescript
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
const gameEngine = new GameEngine(canvas)
```

##### `startGame(): void`
開始新遊戲。

**行為**:
- 初始化遊戲狀態
- 生成新地圖
- 創建玩家
- 開始遊戲循環

**示例**:
```typescript
gameEngine.startGame()
```

##### `pauseGame(): void`
暫停當前遊戲。

**行為**:
- 停止遊戲更新
- 保持當前狀態
- 顯示暫停界面

##### `resumeGame(): void`
恢復暫停的遊戲。

**行為**:
- 恢復遊戲更新
- 繼續遊戲循環

##### `restartGame(): void`
重新開始遊戲。

**行為**:
- 重置遊戲狀態
- 生成新地圖
- 重新創建玩家

##### `getGameState(): GameState`
獲取當前遊戲狀態。

**返回值**: `GameState` 對象

**示例**:
```typescript
const state = gameEngine.getGameState()
console.log('Current state:', state.state)
console.log('Players:', state.players.length)
```

## 🗺️ 地圖系統 API

### MapSystem 類

負責地圖生成、渲染和碰撞檢測。

```typescript
class MapSystem {
  constructor()
  
  // 地圖生成
  generateMap(): MapTile[][]
  
  // 碰撞檢測
  isWalkable(x: number, y: number, map: MapTile[][]): boolean
  canPlaceBomb(x: number, y: number, map: MapTile[][]): boolean
  
  // 地圖修改
  destroySoftWall(x: number, y: number, map: MapTile[][]): boolean
  getTileAt(x: number, y: number, map: MapTile[][]): MapTile | null
  
  // 渲染
  render(ctx: CanvasRenderingContext2D, map: MapTile[][]): void
}
```

#### 方法詳解

##### `generateMap(): MapTile[][]`
生成新的遊戲地圖。

**返回值**: 二維數組，包含地圖瓦片數據

**地圖結構**:
```typescript
interface MapTile {
  type: TileType
  hasPowerUp: boolean
  powerUpType?: PowerUpType
}
```

**示例**:
```typescript
const mapSystem = new MapSystem()
const map = mapSystem.generateMap()
console.log('Map size:', map.length, 'x', map[0].length)
```

##### `isWalkable(x: number, y: number, map: MapTile[][]): boolean`
檢查指定位置是否可通行。

**參數**:
- `x`: 網格 X 座標
- `y`: 網格 Y 座標
- `map`: 地圖數據

**返回值**: 是否可通行

**示例**:
```typescript
const canMove = mapSystem.isWalkable(5, 3, map)
if (canMove) {
  // 玩家可以移動到這個位置
}
```

## 👥 玩家系統 API

### PlayerSystem 類

管理玩家創建、移動和渲染。

```typescript
class PlayerSystem {
  constructor()
  
  // 玩家管理
  createPlayer(x: number, y: number, id: number, color: string): Player
  updatePlayers(players: Player[], map: MapTile[][], deltaTime: number): void
  
  // 移動控制
  movePlayer(player: Player, direction: Direction, map: MapTile[][]): void
  
  // 道具效果
  applyPowerUp(player: Player, powerUpType: PowerUpType): void
  
  // 渲染
  render(ctx: CanvasRenderingContext2D, players: Player[]): void
}
```

#### 方法詳解

##### `createPlayer(x: number, y: number, id: number, color: string): Player`
創建新玩家。

**參數**:
- `x`: 初始網格 X 座標
- `y`: 初始網格 Y 座標
- `id`: 玩家唯一 ID
- `color`: 玩家顏色 (CSS 顏色字符串)

**返回值**: `Player` 對象

**示例**:
```typescript
const player = playerSystem.createPlayer(1, 1, 1, '#0000FF')
console.log('Player created:', player.id, player.color)
```

##### `movePlayer(player: Player, direction: Direction, map: MapTile[][]): void`
移動玩家到指定方向。

**參數**:
- `player`: 要移動的玩家
- `direction`: 移動方向
- `map`: 地圖數據

**方向枚舉**:
```typescript
enum Direction {
  UP = 0,
  DOWN = 1,
  LEFT = 2,
  RIGHT = 3
}
```

**示例**:
```typescript
playerSystem.movePlayer(player, Direction.UP, map)
```

## 💣 炸彈系統 API

### BombSystem 類

管理炸彈放置、爆炸和特殊功能。

```typescript
class BombSystem {
  constructor()
  
  // 炸彈管理
  placeBomb(player: Player, bombs: Bomb[], map: MapTile[][]): void
  updateBombs(bombs: Bomb[], map: MapTile[][], deltaTime: number): void
  
  // 特殊功能
  kickBomb(player: Player, bombs: Bomb[], map: MapTile[][]): void
  remoteExplode(player: Player, bombs: Bomb[]): void
  
  // 渲染
  render(ctx: CanvasRenderingContext2D, bombs: Bomb[]): void
}
```

#### 方法詳解

##### `placeBomb(player: Player, bombs: Bomb[], map: MapTile[][]): void`
在玩家位置放置炸彈。

**參數**:
- `player`: 放置炸彈的玩家
- `bombs`: 炸彈數組
- `map`: 地圖數據

**限制條件**:
- 玩家必須有可用的炸彈數量
- 位置不能已有炸彈
- 冷卻時間限制

**示例**:
```typescript
bombSystem.placeBomb(player, gameState.bombs, gameState.map)
```

##### `kickBomb(player: Player, bombs: Bomb[], map: MapTile[][]): void`
踢動炸彈。

**參數**:
- `player`: 踢炸彈的玩家
- `bombs`: 炸彈數組
- `map`: 地圖數據

**前提條件**:
- 玩家必須有踢炸彈能力
- 玩家位置必須有炸彈

## 🎁 道具系統 API

### PowerUpSystem 類

管理道具生成、收集和效果。

```typescript
class PowerUpSystem {
  constructor()
  
  // 道具管理
  createPowerUp(x: number, y: number, type: PowerUpType): PowerUp
  updatePowerUps(powerUps: PowerUp[], players: Player[]): void
  collectPowerUp(player: Player, powerUp: PowerUp): void
  
  // 道具生成
  generatePowerUpAt(x: number, y: number, map: MapTile[][]): PowerUp | null
  
  // 工具方法
  getPowerUpName(type: PowerUpType): string
  getPowerUpDescription(type: PowerUpType): string
  
  // 渲染
  render(ctx: CanvasRenderingContext2D, powerUps: PowerUp[]): void
}
```

#### 方法詳解

##### `createPowerUp(x: number, y: number, type: PowerUpType): PowerUp`
創建新道具。

**參數**:
- `x`: 網格 X 座標
- `y`: 網格 Y 座標
- `type`: 道具類型

**道具類型**:
```typescript
enum PowerUpType {
  FIRE = 0,      // 火焰 - 增加炸彈威力
  BOMB = 1,      // 炸彈 - 增加炸彈數量
  SPEED = 2,     // 速度 - 增加移動速度
  KICK = 3,      // 踢炸彈 - 可以踢動炸彈
  PIERCE = 4,    // 穿透 - 炸彈穿透軟牆
  REMOTE = 5,    // 遙控 - 遙控引爆炸彈
  SHIELD = 6     // 防護罩 - 無敵狀態
}
```

##### `collectPowerUp(player: Player, powerUp: PowerUp): void`
收集道具並應用效果。

**參數**:
- `player`: 收集道具的玩家
- `powerUp`: 要收集的道具

**效果**:
- 根據道具類型修改玩家屬性
- 標記道具為已收集

## 🔊 音頻系統 API

### AudioSystem 類

管理遊戲音效和背景音樂。

```typescript
class AudioSystem {
  constructor()
  
  // 音效播放
  playSound(soundName: string): void
  playMusic(musicName: string): void
  stopMusic(): void
  
  // 音量控制
  setVolume(volume: number): void
  getVolume(): number
  
  // 音頻上下文
  resumeAudioContext(): void
}
```

#### 方法詳解

##### `playSound(soundName: string): void`
播放指定音效。

**參數**:
- `soundName`: 音效名稱

**可用音效**:
- `bomb_place`: 炸彈放置音效
- `bomb_explode`: 炸彈爆炸音效
- `player_death`: 玩家死亡音效
- `powerup_collect`: 道具收集音效
- `game_over`: 遊戲結束音效
- `menu_select`: 菜單選擇音效
- `menu_confirm`: 菜單確認音效

**示例**:
```typescript
audioSystem.playSound('bomb_explode')
```

##### `setVolume(volume: number): void`
設置音量。

**參數**:
- `volume`: 音量值 (0.0 - 1.0)

**示例**:
```typescript
audioSystem.setVolume(0.7) // 70% 音量
```

## 🎨 UI 系統 API

### UISystem 類

負責用戶界面渲染。

```typescript
class UISystem {
  constructor()
  
  // 主要渲染方法
  render(ctx: CanvasRenderingContext2D, gameState: GameState): void
  
  // 私有渲染方法
  private renderHUD(ctx: CanvasRenderingContext2D, gameState: GameState): void
  private renderMenu(ctx: CanvasRenderingContext2D): void
  private renderPauseMenu(ctx: CanvasRenderingContext2D): void
  private renderGameOver(ctx: CanvasRenderingContext2D, gameState: GameState): void
  private renderButton(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, height: number): void
}
```

#### 方法詳解

##### `render(ctx: CanvasRenderingContext2D, gameState: GameState): void`
渲染完整的用戶界面。

**參數**:
- `ctx`: Canvas 2D 渲染上下文
- `gameState`: 當前遊戲狀態

**渲染內容**:
- 遊戲 HUD (玩家信息、分數、時間)
- 菜單界面 (主選單、暫停選單、遊戲結束)
- 按鈕和交互元素

## 📊 數據類型 API

### 核心接口

#### GameState
遊戲狀態接口。

```typescript
interface GameState {
  state: 'menu' | 'playing' | 'paused' | 'over'
  winner: number | null
  players: Player[]
  bombs: Bomb[]
  powerUps: PowerUp[]
  explosions: Explosion[]
  map: MapTile[][]
  score: { player1: number, player2: number }
  time: number
  paused: boolean
}
```

#### Player
玩家接口。

```typescript
interface Player {
  id: number
  alive: boolean
  gridX: number
  gridY: number
  pixelX: number
  pixelY: number
  direction: Direction
  speed: number
  maxBombs: number
  bombPower: number
  canKick: boolean
  canPierce: boolean
  canRemote: boolean
  hasShield: boolean
  shieldEndTime: number
  bombCount: number
  lastBombTime: number
  lastKickTime: number
  lastRemoteTime: number
  color: string
}
```

#### Bomb
炸彈接口。

```typescript
interface Bomb {
  id: string
  gridX: number
  gridY: number
  pixelX: number
  pixelY: number
  power: number
  ownerId: number
  placeTime: number
  exploded: boolean
  chainExplode: boolean
  canKick: boolean
  kicked: boolean
  kickDirection: Direction | null
  kickSpeed: number
  kickDistance: number
  remote: boolean
}
```

#### PowerUp
道具接口。

```typescript
interface PowerUp {
  id: string
  gridX: number
  gridY: number
  pixelX: number
  pixelY: number
  type: PowerUpType
  collected: boolean
}
```

## 🎯 常數 API

### 遊戲常數

#### 屏幕設定
```typescript
const SCREEN_WIDTH = 832   // 螢幕寬度
const SCREEN_HEIGHT = 704  // 螢幕高度
const FPS = 60             // 遊戲幀率
```

#### 地圖設定
```typescript
const MAP_WIDTH = 13   // 地圖網格寬度
const MAP_HEIGHT = 11  // 地圖網格高度
const TILE_SIZE = 64   // 瓦片大小
```

#### 玩家設定
```typescript
const PLAYER_SPEED = 3.0        // 玩家移動速度
const PLAYER_SIZE = 32          // 玩家角色大小
const BOMB_TIMER = 3000         // 炸彈爆炸倒計時
const EXPLOSION_DURATION = 500  // 爆炸效果持續時間
```

#### 顏色定義
```typescript
const BLACK = '#000000'           // 黑色
const WHITE = '#FFFFFF'           // 白色
const BLUE = '#0000FF'            // 藍色 (玩家1)
const RED = '#FF0000'             // 紅色 (玩家2)
const GREEN = '#00FF00'           // 綠色 (踢炸彈道具)
const YELLOW = '#FFFF00'          // 黃色 (速度道具)
const ORANGE = '#FFA500'          // 橙色 (穿透道具)
const PURPLE = '#800080'          // 紫色 (防護罩道具)
const BROWN = '#8B4513'           // 棕色 (硬牆)
const LIGHT_BROWN = '#A0522D'     // 淺棕色 (軟牆)
```

## 🔧 工具函數 API

### 碰撞檢測
```typescript
function isColliding(obj1: any, obj2: any): boolean
```

### 位置轉換
```typescript
function gridToPixel(gridX: number, gridY: number): { x: number, y: number }
function pixelToGrid(pixelX: number, pixelY: number): { x: number, y: number }
```

### 距離計算
```typescript
function getDistance(pos1: Position, pos2: Position): number
```

## 📝 使用示例

### 基本遊戲初始化
```typescript
// 1. 創建 Canvas 元素
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement

// 2. 初始化遊戲引擎
const gameEngine = new GameEngine(canvas)

// 3. 開始遊戲
gameEngine.startGame()

// 4. 獲取遊戲狀態
const gameState = gameEngine.getGameState()
console.log('Game state:', gameState.state)
```

### 自定義遊戲邏輯
```typescript
// 創建自定義系統
const customSystem = new CustomSystem()

// 在遊戲循環中更新
function customUpdate(deltaTime: number) {
  customSystem.update(deltaTime)
}

// 渲染自定義內容
function customRender(ctx: CanvasRenderingContext2D) {
  customSystem.render(ctx)
}
```

### 事件處理
```typescript
// 鍵盤事件處理
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    // 處理空白鍵
  }
})

// 觸控事件處理
canvas.addEventListener('touchstart', (event) => {
  // 處理觸控開始
})
```

## 🎉 總結

本 API 參考文檔提供了炸彈超人 React 版所有公共 API 的詳細說明，包括：

1. **核心類別** - GameEngine、MapSystem、PlayerSystem 等
2. **數據類型** - 完整的接口和枚舉定義
3. **常數定義** - 遊戲中使用的所有常數
4. **使用示例** - 實際的代碼使用案例

這個 API 文檔將幫助開發者快速理解和使用遊戲的各個組件，為後續的開發和擴展提供重要參考。
