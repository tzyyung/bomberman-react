/**
 * 炸彈系統
 * 負責炸彈管理、爆炸邏輯和渲染
 */

import { Bomb, Player, MapTile } from '../types';
import { TILE_SIZE, BOMB_TIMER, Direction } from '../constants';

export class BombSystem {
  private bombIdCounter = 0;

  public placeBomb(player: Player, bombs: Bomb[], map: MapTile[][]): void {
    // 檢查是否可以放置炸彈
    if (player.bombCount >= player.maxBombs) return;
    if (Date.now() - player.lastBombTime < 500) return; // 防止快速連續放置
    
    // 檢查位置是否已有炸彈
    const existingBomb = bombs.find(b => b.gridX === player.gridX && b.gridY === player.gridY);
    if (existingBomb) return;
    
    // 創建新炸彈
    const bomb: Bomb = {
      id: `bomb_${this.bombIdCounter++}`,
      gridX: player.gridX,
      gridY: player.gridY,
      pixelX: player.gridX * TILE_SIZE + TILE_SIZE / 2,
      pixelY: player.gridY * TILE_SIZE + TILE_SIZE / 2,
      power: player.bombPower,
      ownerId: player.id,
      placeTime: Date.now(),
      exploded: false,
      chainExplode: false,
      canKick: player.canKick,
      kicked: false,
      kickDirection: null,
      kickSpeed: 2,
      kickDistance: 0,
      remote: player.canRemote,
    };
    
    bombs.push(bomb);
    player.bombCount++;
    player.lastBombTime = Date.now();
  }

  public updateBombs(bombs: Bomb[], map: MapTile[][], deltaTime: number): void {
    bombs.forEach(bomb => {
      if (bomb.exploded) return;
      
      // 檢查是否應該爆炸
      if (Date.now() - bomb.placeTime >= BOMB_TIMER || bomb.chainExplode) {
        this.explodeBomb(bomb, bombs, map);
      }
      
      // 更新踢炸彈移動
      if (bomb.kicked) {
        this.updateKickedBomb(bomb, map);
      }
    });
  }

  private explodeBomb(bomb: Bomb, bombs: Bomb[], map: MapTile[][]): void {
    bomb.exploded = true;
    
    // 減少玩家炸彈計數
    // 這裡需要從外部傳入玩家數組，暫時跳過
    
    // 創建爆炸效果
    this.createExplosion(bomb, map);
    
    // 檢查連鎖爆炸
    this.checkChainExplosion(bomb, bombs, map);
  }

  private createExplosion(bomb: Bomb, map: MapTile[][]): void {
    const explosionPositions = this.getExplosionPositions(bomb, map);
    
    explosionPositions.forEach(pos => {
      // 摧毀軟牆
      if (map[pos.y][pos.x].type === 2) { // SOFT_WALL
        map[pos.y][pos.x].type = 0; // EMPTY
        
        // 30% 機率生成道具
        if (Math.random() < 0.3) {
          map[pos.y][pos.x].hasPowerUp = true;
          // 隨機選擇道具類型
          const powerUpTypes = [0, 1, 2, 3, 4, 5, 6]; // 所有道具類型
          map[pos.y][pos.x].powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        }
      }
    });
  }

  private getExplosionPositions(bomb: Bomb, map: MapTile[][]): Array<{x: number, y: number}> {
    const positions = [{ x: bomb.gridX, y: bomb.gridY }];
    
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
        
        if (tile.type === 2) break; // 軟牆停止爆炸
      }
    });
    
    return positions;
  }

  private checkChainExplosion(bomb: Bomb, bombs: Bomb[], map: MapTile[][]): void {
    const explosionPositions = this.getExplosionPositions(bomb, map);
    
    bombs.forEach(otherBomb => {
      if (otherBomb.id === bomb.id || otherBomb.exploded) return;
      
      const isInExplosion = explosionPositions.some(pos => 
        pos.x === otherBomb.gridX && pos.y === otherBomb.gridY
      );
      
      if (isInExplosion) {
        otherBomb.chainExplode = true;
      }
    });
  }

  private updateKickedBomb(bomb: Bomb, map: MapTile[][]): void {
    if (bomb.kickDirection === null) return;
    
    let newX = bomb.gridX;
    let newY = bomb.gridY;
    
    switch (bomb.kickDirection) {
      case Direction.UP:
        newY -= 1;
        break;
      case Direction.DOWN:
        newY += 1;
        break;
      case Direction.LEFT:
        newX -= 1;
        break;
      case Direction.RIGHT:
        newX += 1;
        break;
    }
    
    // 檢查是否可以移動
    if (this.canMoveBombTo(newX, newY, map)) {
      bomb.gridX = newX;
      bomb.gridY = newY;
      bomb.pixelX = newX * TILE_SIZE + TILE_SIZE / 2;
      bomb.pixelY = newY * TILE_SIZE + TILE_SIZE / 2;
      bomb.kickDistance++;
    } else {
      bomb.kicked = false;
      bomb.kickDirection = null;
    }
  }

  private canMoveBombTo(x: number, y: number, map: MapTile[][]): boolean {
    if (x < 0 || x >= map[0].length || y < 0 || y >= map.length) return false;
    
    const tile = map[y][x];
    return tile.type === 0; // EMPTY
  }

  public kickBomb(player: Player, bombs: Bomb[], map: MapTile[][]): void {
    if (!player.canKick) return;
    if (Date.now() - player.lastKickTime < 300) return;
    
    const bomb = bombs.find(b => 
      b.gridX === player.gridX && b.gridY === player.gridY && !b.exploded
    );
    
    if (bomb && bomb.canKick) {
      bomb.kicked = true;
      bomb.kickDirection = player.direction;
      bomb.kickDistance = 0;
      player.lastKickTime = Date.now();
    }
  }

  public remoteExplode(player: Player, bombs: Bomb[]): void {
    if (!player.canRemote) return;
    if (Date.now() - player.lastRemoteTime < 1000) return;
    
    const bomb = bombs.find(b => 
      b.ownerId === player.id && !b.exploded && b.remote
    );
    
    if (bomb) {
      bomb.chainExplode = true;
      player.lastRemoteTime = Date.now();
    }
  }

  public render(ctx: CanvasRenderingContext2D, bombs: Bomb[]): void {
    bombs.forEach(bomb => {
      if (bomb.exploded) return;
      
      this.renderBomb(ctx, bomb);
    });
  }

  private renderBomb(ctx: CanvasRenderingContext2D, bomb: Bomb): void {
    const size = TILE_SIZE * 0.5;
    const x = bomb.pixelX - size / 2;
    const y = bomb.pixelY - size / 2;
    
    // 繪製炸彈
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, size, size);
    
    // 繪製引線動畫
    const time = Date.now() - bomb.placeTime;
    const flashRate = 200;
    if (Math.floor(time / flashRate) % 2 === 0) {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(x + size/4, y + size/4, size/2, size/2);
    }
    
    // 繪製邊框
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
  }
}
