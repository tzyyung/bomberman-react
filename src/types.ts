/**
 * 遊戲類型定義 (Types)
 * 
 * 功能說明：
 * - 定義遊戲中使用的所有數據結構和接口
 * - 提供 TypeScript 類型安全支持
 * - 統一管理遊戲實體的屬性定義
 * - 確保代碼的一致性和可維護性
 * - 為遊戲引擎和各個系統提供類型約束
 * 
 * 主要類型：
 * - 基本類型：位置、網格位置等基礎數據結構
 * - 遊戲實體：玩家、炸彈、道具、地圖格子等
 * - 遊戲狀態：遊戲狀態、配置、輸入事件等
 * - 枚舉類型：方向、道具類型、瓦片類型等
 */

import { Direction, PowerUpType, TileType } from './constants'; // 導入常數定義

// ==================== 基本位置類型 ====================
/**
 * 像素位置接口
 * 用於表示屏幕上的像素坐標
 */
export interface Position {
  x: number; // X 坐標（像素）
  y: number; // Y 坐標（像素）
}

/**
 * 網格位置接口
 * 用於表示地圖網格中的坐標
 */
export interface GridPosition {
  gridX: number; // 網格 X 坐標
  gridY: number; // 網格 Y 坐標
}

// ==================== 玩家類型 ====================
/**
 * 玩家接口
 * 定義玩家的所有屬性和狀態
 */
export interface Player {
  id: number;                    // 玩家唯一標識符
  alive: boolean;                // 玩家是否存活
  gridX: number;                 // 網格 X 坐標
  gridY: number;                 // 網格 Y 坐標
  pixelX: number;                // 像素 X 坐標
  pixelY: number;                // 像素 Y 坐標
  direction: Direction;          // 玩家面向方向
  speed: number;                 // 移動速度
  maxBombs: number;              // 最大炸彈數量
  bombPower: number;             // 炸彈威力（爆炸範圍）
  canKick: boolean;              // 是否可以踢炸彈
  kickCount: number;             // 踢炸彈道具數量（影響踢動距離）
  canPierce: boolean;            // 是否具有穿透能力
  canRemote: boolean;            // 是否可以遙控引爆
  hasShield: boolean;            // 是否有防護罩
  shieldEndTime: number;         // 防護罩結束時間
  bombCount: number;             // 當前炸彈數量
  lastBombTime: number;          // 最後放置炸彈時間
  lastKickTime: number;          // 最後踢炸彈時間
  lastRemoteTime: number;        // 最後遙控引爆時間
  color: string;                 // 玩家顏色
}

// ==================== 炸彈類型 ====================
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
  maxKickDistance?: number; // 最大踢動距離
  canPierce: boolean; // 穿透能力
  remote: boolean;
}

// ==================== 道具類型 ====================
export interface PowerUp {
  id: string;
  gridX: number;
  gridY: number;
  pixelX: number;
  pixelY: number;
  type: PowerUpType;
  collected: boolean;
}

// ==================== 爆炸類型 ====================
export interface Explosion {
  id: string;
  gridX: number;
  gridY: number;
  pixelX: number;
  pixelY: number;
  startTime: number;
  duration: number;
  finished: boolean;
  direction: Direction | null;
}

// ==================== 地圖類型 ====================
export interface MapTile {
  type: TileType;
  hasPowerUp: boolean;
  powerUpType?: PowerUpType;
}

// ==================== 遊戲狀態類型 ====================
export interface GameState {
  state: 'menu' | 'playing' | 'over';
  winner: number | null;
  players: Player[];
  bombs: Bomb[];
  powerUps: PowerUp[];
  explosions: Explosion[];
  map: MapTile[][];
  score: {
    player1: number;
    player2: number;
  };
  time: number;
  paused: boolean;
}

// ==================== 輸入事件類型 ====================
export interface InputEvent {
  playerId: number;
  action: 'move' | 'bomb' | 'kick' | 'remote';
  direction?: Direction;
  timestamp: number;
}

// ==================== 音效類型 ====================
export interface AudioSystem {
  playSound: (soundName: string) => void;
  playMusic: (musicName: string) => void;
  stopMusic: () => void;
  setVolume: (volume: number) => void;
}

// ==================== 渲染類型 ====================
export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

// ==================== 遊戲配置類型 ====================
export interface GameConfig {
  mapWidth: number;
  mapHeight: number;
  tileSize: number;
  playerSpeed: number;
  bombTimer: number;
  explosionDuration: number;
  maxBombs: number;
  bombPower: number;
  powerUpChance: number;
  gameTime: number;
}

// ==================== 動畫類型 ====================
export interface Animation {
  id: string;
  type: 'explosion' | 'powerup' | 'player' | 'bomb';
  startTime: number;
  duration: number;
  position: Position;
  frame: number;
  maxFrames: number;
  finished: boolean;
}

// ==================== UI 狀態類型 ====================
export interface UIState {
  showMenu: boolean;
  showPause: boolean;
  showGameOver: boolean;
  showSettings: boolean;
  selectedMenuItem: number;
  volume: number;
  fullscreen: boolean;
}

// ==================== 事件類型 ====================
export interface GameEvent {
  type: 'bomb_placed' | 'bomb_exploded' | 'player_died' | 'powerup_collected' | 'game_over';
  data: any;
  timestamp: number;
}

// ==================== 統計類型 ====================
export interface GameStats {
  bombsPlaced: number;
  bombsExploded: number;
  powerUpsCollected: number;
  playersKilled: number;
  gameTime: number;
  winner: number | null;
}

