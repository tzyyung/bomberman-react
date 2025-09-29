/**
 * 遊戲常數定義
 * 包含遊戲中所有使用的常數值，便於統一管理和修改
 */

// ==================== 螢幕設定 ====================
export const SCREEN_WIDTH = 832;   // 螢幕寬度 (13個瓦片 * 64像素)
export const SCREEN_HEIGHT = 704;  // 螢幕高度 (11個瓦片 * 64像素)
export const FPS = 60;             // 遊戲幀率，控制遊戲運行速度

// ==================== 地圖設定 ====================
export const MAP_WIDTH = 13;   // 地圖網格寬度（列數）
export const MAP_HEIGHT = 11;  // 地圖網格高度（行數）
export const TILE_SIZE = 64;   // 每個瓦片的大小（像素）

// ==================== 顏色定義 (RGB格式) ====================
// 基本顏色
export const BLACK = '#000000';           // 黑色 - 用於文字和邊框
export const WHITE = '#FFFFFF';           // 白色 - 用於文字和背景
export const GRAY = '#808080';            // 灰色 - 用於UI元素
export const DARK_GRAY = '#404040';       // 深灰色 - 用於陰影效果
export const LIGHT_GRAY = '#C0C0C0';      // 淺灰色 - 用於次要文字
export const LIGHT_GREEN = '#90EE90';     // 淺綠色 - 用於成功提示

// 玩家顏色
export const RED = '#FF0000';             // 紅色 - 玩家2的顏色
export const BLUE = '#0000FF';            // 藍色 - 玩家1的顏色

// 道具顏色
export const GREEN = '#00FF00';           // 綠色 - 踢炸彈道具
export const YELLOW = '#FFFF00';          // 黃色 - 速度道具
export const ORANGE = '#FFA500';          // 橙色 - 穿透道具
export const PURPLE = '#800080';          // 紫色 - 防護罩道具

// 地圖顏色
export const BROWN = '#8B4513';           // 棕色 - 硬牆顏色
export const LIGHT_BROWN = '#A0522D';     // 淺棕色 - 軟牆顏色

// ==================== 地圖元素類型 ====================
export enum TileType {
  EMPTY = 0,        // 空地 - 玩家可以自由移動
  HARD_WALL = 1,    // 硬牆 - 不可破壞的固定牆壁
  SOFT_WALL = 2,    // 軟牆 - 可被炸彈摧毀的箱子
  BOMB = 3,         // 炸彈 - 玩家放置的炸彈
  EXPLOSION = 4,    // 爆炸 - 炸彈爆炸效果
  POWERUP = 5,      // 道具 - 可收集的道具
}

// ==================== 玩家設定 ====================
export const PLAYER_SPEED = 3.0;        // 玩家移動速度（像素/幀）
export const PLAYER_SIZE = 32;           // 玩家角色大小（像素）
export const BOMB_TIMER = 3000;         // 炸彈爆炸倒計時（毫秒）
export const EXPLOSION_DURATION = 500;  // 爆炸效果持續時間（毫秒）

// ==================== 道具類型 ====================
export enum PowerUpType {
  FIRE = 0,      // 火焰道具 - 增加炸彈威力
  BOMB = 1,      // 炸彈道具 - 增加可放置炸彈數量
  SPEED = 2,     // 速度道具 - 增加移動速度
  KICK = 3,      // 踢炸彈道具 - 可以踢動炸彈
  PIERCE = 4,    // 穿透道具 - 炸彈可以穿透軟牆
  REMOTE = 5,    // 遙控道具 - 可以遙控引爆炸彈
  SHIELD = 6,    // 防護罩道具 - 10秒內無敵狀態
}

// ==================== 遊戲狀態 ====================
export enum GameState {
  MENU = 0,      // 主選單狀態
  PLAYING = 1,   // 遊戲進行中狀態
  PAUSED = 2,    // 遊戲暫停狀態
  OVER = 3,      // 遊戲結束狀態
}

// ==================== 方向定義 ====================
export enum Direction {
  UP = 0,        // 向上
  DOWN = 1,      // 向下
  LEFT = 2,      // 向左
  RIGHT = 3,     // 向右
}

// ==================== 鍵盤映射 ====================
export const KEY_MAPPING = {
  player1: {  // 玩家1的按鍵配置
    up: 'KeyW',        // W鍵 - 向上移動
    down: 'KeyS',      // S鍵 - 向下移動
    left: 'KeyA',      // A鍵 - 向左移動
    right: 'KeyD',     // D鍵 - 向右移動
    bomb: 'Space',     // 空白鍵 - 放置炸彈
    kick: 'KeyB',      // B鍵 - 踢炸彈
    remote: 'KeyV'     // V鍵 - 遙控引爆炸彈
  },
  player2: {  // 玩家2的按鍵配置
    up: 'ArrowUp',     // 上箭頭鍵 - 向上移動
    down: 'ArrowDown', // 下箭頭鍵 - 向下移動
    left: 'ArrowLeft', // 左箭頭鍵 - 向左移動
    right: 'ArrowRight', // 右箭頭鍵 - 向右移動
    bomb: 'Enter',     // Enter鍵 - 放置炸彈
    kick: 'ShiftRight', // 右Shift鍵 - 踢炸彈
    remote: 'Slash'    // 斜線鍵 - 遙控引爆炸彈
  }
} as const;

// ==================== 道具名稱映射 ====================
export const POWERUP_NAMES = {
  [PowerUpType.FIRE]: '火焰',
  [PowerUpType.BOMB]: '炸彈',
  [PowerUpType.SPEED]: '速度',
  [PowerUpType.KICK]: '踢炸彈',
  [PowerUpType.PIERCE]: '穿透',
  [PowerUpType.REMOTE]: '遙控',
  [PowerUpType.SHIELD]: '防護罩',
} as const;

// ==================== 道具符號映射 ====================
export const POWERUP_SYMBOLS = {
  [PowerUpType.FIRE]: '🔥',
  [PowerUpType.BOMB]: '💣',
  [PowerUpType.SPEED]: '⚡',
  [PowerUpType.KICK]: '👟',
  [PowerUpType.PIERCE]: '💥',
  [PowerUpType.REMOTE]: '📱',
  [PowerUpType.SHIELD]: '🛡️',
} as const;

