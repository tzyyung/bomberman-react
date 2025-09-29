/**
 * 地圖系統
 * 負責地圖生成、渲染和碰撞檢測
 */

import { MapTile } from '../types';
import { TileType, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, BROWN, LIGHT_BROWN, BLACK } from '../constants';

export class MapSystem {
  private tileImages: Map<TileType, HTMLCanvasElement> = new Map();

  constructor() {
    this.createTileImages();
  }

  private createTileImages(): void {
    // 創建不同類型的瓦片圖片
    const tileTypes = [
      { type: TileType.EMPTY, color: BLACK },
      { type: TileType.HARD_WALL, color: BROWN },
      { type: TileType.SOFT_WALL, color: LIGHT_BROWN },
    ];

    tileTypes.forEach(({ type, color }) => {
      const canvas = document.createElement('canvas');
      canvas.width = TILE_SIZE;
      canvas.height = TILE_SIZE;
      const ctx = canvas.getContext('2d')!;
      
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      
      // 添加邊框
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
      
      this.tileImages.set(type, canvas);
    });
  }

  public generateMap(): MapTile[][] {
    const map: MapTile[][] = [];
    
    // 初始化地圖
    for (let y = 0; y < MAP_HEIGHT; y++) {
      map[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        map[y][x] = {
          type: TileType.EMPTY,
          hasPowerUp: false,
        };
      }
    }
    
    // 設置邊界硬牆
    for (let x = 0; x < MAP_WIDTH; x++) {
      map[0][x].type = TileType.HARD_WALL;
      map[MAP_HEIGHT - 1][x].type = TileType.HARD_WALL;
    }
    for (let y = 0; y < MAP_HEIGHT; y++) {
      map[y][0].type = TileType.HARD_WALL;
      map[y][MAP_WIDTH - 1].type = TileType.HARD_WALL;
    }
    
    // 設置內部硬牆（每隔一個位置）
    for (let y = 2; y < MAP_HEIGHT - 2; y += 2) {
      for (let x = 2; x < MAP_WIDTH - 2; x += 2) {
        map[y][x].type = TileType.HARD_WALL;
      }
    }
    
    // 隨機放置軟牆
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
      for (let x = 1; x < MAP_WIDTH - 1; x++) {
        if (map[y][x].type === TileType.EMPTY && Math.random() < 0.3) {
          map[y][x].type = TileType.SOFT_WALL;
        }
      }
    }
    
    // 確保玩家起始位置安全
    const safePositions = [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: MAP_WIDTH - 2, y: MAP_HEIGHT - 2 },
      { x: MAP_WIDTH - 3, y: MAP_HEIGHT - 2 },
      { x: MAP_WIDTH - 2, y: MAP_HEIGHT - 3 },
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

