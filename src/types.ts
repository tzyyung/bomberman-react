/**
 * 遊戲類型定義
 * 定義遊戲中使用的所有數據結構和接口
 */

import { Direction, PowerUpType, TileType } from './constants';

// ==================== 基本位置類型 ====================
export interface Position {
  x: number;
  y: number;
}

export interface GridPosition {
  gridX: number;
  gridY: number;
}

// ==================== 玩家類型 ====================
export interface Player {
  id: number;
  alive: boolean;
  gridX: number;
  gridY: number;
  pixelX: number;
  pixelY: number;
  direction: Direction;
  speed: number;
  maxBombs: number;
  bombPower: number;
  canKick: boolean;
  canPierce: boolean;
  canRemote: boolean;
  hasShield: boolean;
  shieldEndTime: number;
  bombCount: number;
  lastBombTime: number;
  lastKickTime: number;
  lastRemoteTime: number;
  color: string;
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
  state: 'menu' | 'playing' | 'paused' | 'over';
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

