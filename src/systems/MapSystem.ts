/**
 * 地圖系統 (MapSystem)
 * 
 * 功能說明：
 * - 管理遊戲地圖的生成和渲染
 * - 處理不同類型的地圖格子
 * - 提供碰撞檢測和地形查詢
 * - 優化地圖渲染性能
 * - 支持動態地圖更新
 * 
 * 主要方法：
 * - generateMap: 生成隨機地圖
 * - render: 渲染地圖
 * - isWall: 檢查是否為牆壁
 * - isPassable: 檢查是否可通行
 * - getTile: 獲取指定位置的格子
 * - setTile: 設置指定位置的格子
 */

import { MapTile } from '../types'; // 導入類型定義
import { TileType, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, BROWN, LIGHT_BROWN, BLACK } from '../constants'; // 導入常數定義

export class MapSystem {
  private tileImages: Map<TileType, HTMLCanvasElement> = new Map(); // 瓦片圖片緩存

  /**
   * 地圖系統構造函數
   * 
   * 功能說明：
   * - 初始化瓦片圖片緩存
   * - 預渲染不同類型的瓦片
   * - 提高地圖渲染性能
   */
  constructor() {
    this.createTileImages();
  }

  /**
   * 創建瓦片圖片
   * 
   * 功能說明：
   * - 為每種瓦片類型創建預渲染的圖片
   * - 使用 Canvas 離屏渲染技術
   * - 提高地圖渲染性能
   * - 統一瓦片的外觀樣式
   */
  private createTileImages(): void {
    // 定義不同類型的瓦片及其顏色
    const tileTypes = [
      { type: TileType.EMPTY, color: BLACK },        // 空地 - 黑色
      { type: TileType.HARD_WALL, color: BROWN },    // 硬牆 - 棕色
      { type: TileType.SOFT_WALL, color: LIGHT_BROWN }, // 軟牆 - 淺棕色
    ];

    // 為每種瓦片類型創建圖片
    tileTypes.forEach(({ type, color }) => {
      // 創建離屏 Canvas 用於預渲染
      const canvas = document.createElement('canvas');
      canvas.width = TILE_SIZE;  // 設置瓦片寬度
      canvas.height = TILE_SIZE; // 設置瓦片高度
      const ctx = canvas.getContext('2d')!;
      
      // 填充瓦片背景顏色
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      
      // 添加邊框以區分不同瓦片
      ctx.strokeStyle = '#333333'; // 深灰色邊框
      ctx.lineWidth = 1;           // 1像素線寬
      ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
      
      // 將預渲染的瓦片圖片保存到緩存中
      this.tileImages.set(type, canvas);
    });
  }

  /**
   * 生成隨機地圖
   * 
   * 功能說明：
   * - 創建一個隨機生成的遊戲地圖
   * - 設置邊界硬牆和內部硬牆
   * - 隨機放置軟牆（可破壞的箱子）
   * - 確保玩家起始位置安全
   * - 提供多樣化的遊戲體驗
   * 
   * @returns 生成的地圖數據（二維數組）
   */
  public generateMap(): MapTile[][] {
    const map: MapTile[][] = []; // 初始化地圖數組
    
    // 初始化地圖為空地
    for (let y = 0; y < MAP_HEIGHT; y++) {
      map[y] = []; // 創建每一行
      for (let x = 0; x < MAP_WIDTH; x++) {
        map[y][x] = {
          type: TileType.EMPTY,    // 設置為空地
          hasPowerUp: false,       // 初始沒有道具
        };
      }
    }
    
    // 設置邊界硬牆（地圖四周）
    for (let x = 0; x < MAP_WIDTH; x++) {
      map[0][x].type = TileType.HARD_WALL;           // 上邊界
      map[MAP_HEIGHT - 1][x].type = TileType.HARD_WALL; // 下邊界
    }
    for (let y = 0; y < MAP_HEIGHT; y++) {
      map[y][0].type = TileType.HARD_WALL;           // 左邊界
      map[y][MAP_WIDTH - 1].type = TileType.HARD_WALL; // 右邊界
    }
    
    // 設置內部硬牆（每隔一個位置，形成網格狀）
    for (let y = 2; y < MAP_HEIGHT - 2; y += 2) {
      for (let x = 2; x < MAP_WIDTH - 2; x += 2) {
        map[y][x].type = TileType.HARD_WALL; // 設置為硬牆
      }
    }
    
    // 隨機放置軟牆（30% 機率）
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
      for (let x = 1; x < MAP_WIDTH - 1; x++) {
        // 只在空地位置隨機放置軟牆
        if (map[y][x].type === TileType.EMPTY && Math.random() < 0.3) {
          map[y][x].type = TileType.SOFT_WALL;
        }
      }
    }
    
    // 確保玩家起始位置安全（清除起始位置周圍的障礙物）
    const safePositions = [
      { x: 1, y: 1 },                    // 玩家1起始位置
      { x: 2, y: 1 },                    // 玩家1起始位置周圍
      { x: 1, y: 2 },                    // 玩家1起始位置周圍
      { x: MAP_WIDTH - 2, y: MAP_HEIGHT - 2 }, // 玩家2起始位置
      { x: MAP_WIDTH - 3, y: MAP_HEIGHT - 2 }, // 玩家2起始位置周圍
      { x: MAP_WIDTH - 2, y: MAP_HEIGHT - 3 }, // 玩家2起始位置周圍
    ];
    
    safePositions.forEach(pos => {
      map[pos.y][pos.x].type = TileType.EMPTY;
    });
    
    return map;
  }

  public render(ctx: CanvasRenderingContext2D, map: MapTile[][]): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map[y][x];
        const image = this.tileImages.get(tile.type);
        
        if (image) {
          ctx.drawImage(image, x * TILE_SIZE, y * TILE_SIZE);
        }
      }
    }
  }

  public isWalkable(x: number, y: number, map: MapTile[][]): boolean {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
      return false;
    }
    
    const tile = map[y][x];
    return tile.type === TileType.EMPTY || tile.type === TileType.POWERUP;
  }

  public canPlaceBomb(x: number, y: number, map: MapTile[][]): boolean {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
      return false;
    }
    
    const tile = map[y][x];
    return tile.type === TileType.EMPTY;
  }

  public destroySoftWall(x: number, y: number, map: MapTile[][]): boolean {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
      return false;
    }
    
    const tile = map[y][x];
    if (tile.type === TileType.SOFT_WALL) {
      tile.type = TileType.EMPTY;
      return true;
    }
    
    return false;
  }

  public getTileAt(x: number, y: number, map: MapTile[][]): MapTile | null {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
      return null;
    }
    
    return map[y][x];
  }
}

