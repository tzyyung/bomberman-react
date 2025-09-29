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
      maxKickDistance: player.kickCount || 1,
      canPierce: player.canPierce,
      remote: player.canRemote,
    };
    
    console.log(`玩家 ${player.id} 放置炸彈，威力: ${bomb.power}`);
    
    // 更新地圖格子類型為炸彈
    map[player.gridY][player.gridX].type = 3; // BOMB
    
    bombs.push(bomb);
    player.bombCount++;
    player.lastBombTime = Date.now();
  }

  public updateBombs(bombs: Bomb[], map: MapTile[][], players: Player[], deltaTime: number): Array<{x: number, y: number}>[] {
    const explosionPositions: Array<{x: number, y: number}>[] = [];
    
    bombs.forEach(bomb => {
      if (bomb.exploded) return;
      
      // 檢查是否應該爆炸
      if (Date.now() - bomb.placeTime >= BOMB_TIMER || bomb.chainExplode) {
        const positions = this.explodeBomb(bomb, bombs, map, players);
        explosionPositions.push(positions);
      }
      
      // 更新踢炸彈移動
      if (bomb.kicked) {
        this.updateKickedBomb(bomb, map, players);
      }
    });
    
    return explosionPositions;
  }

  private explodeBomb(bomb: Bomb, bombs: Bomb[], map: MapTile[][], players: Player[]): Array<{x: number, y: number}> {
    bomb.exploded = true;
    
    // 恢復地圖格子類型為空地
    map[bomb.gridY][bomb.gridX].type = 0; // EMPTY
    
    // 減少玩家炸彈計數
    const owner = players.find(p => p.id === bomb.ownerId);
    if (owner) {
      owner.bombCount = Math.max(0, owner.bombCount - 1);
    }
    
    // 創建爆炸效果
    const explosionPositions = this.createExplosion(bomb, map);
    
    // 檢查連鎖爆炸
    this.checkChainExplosion(bomb, bombs, map);
    
    return explosionPositions;
  }

  private createExplosion(bomb: Bomb, map: MapTile[][]): Array<{x: number, y: number}> {
    const explosionPositions = this.getExplosionPositions(bomb, map);
    
    explosionPositions.forEach(pos => {
      // 摧毀軟牆
      if (map[pos.y][pos.x].type === 2) { // SOFT_WALL
        console.log(`軟牆被摧毀，位置: (${pos.x}, ${pos.y})`);
        map[pos.y][pos.x].type = 0; // EMPTY
        
        // 50% 機率生成道具
        if (Math.random() < 0.5) {
          console.log(`軟牆爆炸生成道具，位置: (${pos.x}, ${pos.y})`);
          // 道具生成將在 GameEngine 中處理
          map[pos.y][pos.x].hasPowerUp = true;
        } else {
          console.log(`軟牆爆炸沒有生成道具，位置: (${pos.x}, ${pos.y})`);
        }
      }
    });
    
    return explosionPositions;
  }

  private getExplosionPositions(bomb: Bomb, map: MapTile[][]): Array<{x: number, y: number}> {
    const positions = [{ x: bomb.gridX, y: bomb.gridY }];
    
    console.log(`炸彈爆炸，威力: ${bomb.power}，穿透能力: ${bomb.canPierce}，位置: (${bomb.gridX}, ${bomb.gridY})`);
    
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
        console.log(`爆炸位置: (${x}, ${y})`);
        
        // 如果沒有穿透能力，軟牆停止爆炸
        if (tile.type === 2 && !bomb.canPierce) {
          console.log(`軟牆停止爆炸，位置: (${x}, ${y})`);
          break;
        }
        
        // 如果有穿透能力，軟牆不會停止爆炸
        if (tile.type === 2 && bomb.canPierce) {
          console.log(`穿透軟牆，繼續爆炸，位置: (${x}, ${y})`);
        }
      }
    });
    
    console.log(`總共 ${positions.length} 個爆炸位置`);
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

  private updateKickedBomb(bomb: Bomb, map: MapTile[][], players: Player[]): void {
    if (bomb.kickDirection === null) return;
    
    // 檢查是否達到最大踢動距離
    const maxDistance = bomb.maxKickDistance || 1;
    if (bomb.kickDistance >= maxDistance) {
      console.log(`炸彈踢動達到最大距離 ${maxDistance}，停止踢動`);
      bomb.kicked = false;
      bomb.kickDirection = null;
      return;
    }
    
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
    
    console.log(`炸彈踢動：從 (${bomb.gridX}, ${bomb.gridY}) 到 (${newX}, ${newY})，距離: ${bomb.kickDistance + 1}/${maxDistance}`);
    
    // 檢查是否遇到玩家
    const playerAtTarget = players.find(p => p.alive && p.gridX === newX && p.gridY === newY);
    if (playerAtTarget) {
      console.log(`炸彈踢動遇到玩家 ${playerAtTarget.id}，立即引爆`);
      bomb.chainExplode = true;
      bomb.kicked = false;
      bomb.kickDirection = null;
      return;
    }
    
    // 檢查是否可以移動
    if (this.canMoveBombTo(newX, newY, map)) {
      // 恢復原位置的地圖格子類型
      map[bomb.gridY][bomb.gridX].type = 0; // EMPTY
      
      // 更新炸彈位置
      bomb.gridX = newX;
      bomb.gridY = newY;
      bomb.pixelX = newX * TILE_SIZE + TILE_SIZE / 2;
      bomb.pixelY = newY * TILE_SIZE + TILE_SIZE / 2;
      bomb.kickDistance++;
      
      // 更新新位置的地圖格子類型
      map[newY][newX].type = 3; // BOMB
      
      console.log(`炸彈踢動成功，距離: ${bomb.kickDistance}/${maxDistance}`);
    } else {
      console.log(`炸彈踢動被阻擋，停止踢動`);
      bomb.kicked = false;
      bomb.kickDirection = null;
    }
  }

  private canMoveBombTo(x: number, y: number, map: MapTile[][]): boolean {
    if (x < 0 || x >= map[0].length || y < 0 || y >= map.length) return false;
    
    const tile = map[y][x];
    return tile.type === 0; // EMPTY
  }

  private findBombNearPlayer(player: Player, bombs: Bomb[]): Bomb | null {
    // 檢查玩家當前位置是否有炸彈
    let bomb = bombs.find(b => 
      b.gridX === player.gridX && b.gridY === player.gridY && !b.exploded
    );
    
    if (bomb) {
      console.log(`玩家 ${player.id} 在炸彈位置 (${bomb.gridX}, ${bomb.gridY})`);
      return bomb;
    }
    
    // 只檢查玩家面對方向的炸彈
    let targetX = player.gridX;
    let targetY = player.gridY;
    
    switch (player.direction) {
      case Direction.UP:
        targetY = player.gridY - 1;
        break;
      case Direction.DOWN:
        targetY = player.gridY + 1;
        break;
      case Direction.LEFT:
        targetX = player.gridX - 1;
        break;
      case Direction.RIGHT:
        targetX = player.gridX + 1;
        break;
    }
    
    bomb = bombs.find(b => 
      b.gridX === targetX && b.gridY === targetY && !b.exploded
    );
    
    if (bomb) {
      console.log(`玩家 ${player.id} 面前有炸彈，位置: (${bomb.gridX}, ${bomb.gridY})，方向: ${player.direction}`);
      return bomb;
    }
    
    console.log(`玩家 ${player.id} 面前沒有炸彈，方向: ${player.direction}`);
    return null;
  }

  public kickBomb(player: Player, bombs: Bomb[], map: MapTile[][]): void {
    if (!player.canKick) {
      console.log(`玩家 ${player.id} 沒有踢炸彈能力`);
      return;
    }
    if (Date.now() - player.lastKickTime < 300) {
      console.log(`玩家 ${player.id} 踢炸彈冷卻中`);
      return;
    }
    
    // 尋找玩家旁邊的炸彈（相鄰格子）
    const bomb = this.findBombNearPlayer(player, bombs);
    
    if (bomb) {
      console.log(`玩家 ${player.id} 踢動炸彈，方向: ${player.direction}，炸彈位置: (${bomb.gridX}, ${bomb.gridY})`);
      bomb.kicked = true;
      bomb.kickDirection = player.direction;
      bomb.kickDistance = 0;
      bomb.maxKickDistance = player.kickCount || 1; // 根據踢炸彈道具數量設置最大踢動距離
      player.lastKickTime = Date.now();
      
      // 立即移動炸彈到玩家面前的位置
      this.moveBombToPlayerFront(bomb, player, map);
    } else {
      console.log(`玩家 ${player.id} 面前沒有炸彈可踢`);
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

  private moveBombToPlayerFront(bomb: Bomb, player: Player, map: MapTile[][]): void {
    // 計算玩家面前前進1格的位置
    let targetX = player.gridX;
    let targetY = player.gridY;
    
    switch (player.direction) {
      case Direction.UP:
        targetY = player.gridY - 1;
        break;
      case Direction.DOWN:
        targetY = player.gridY + 1;
        break;
      case Direction.LEFT:
        targetX = player.gridX - 1;
        break;
      case Direction.RIGHT:
        targetX = player.gridX + 1;
        break;
    }
    
    // 檢查目標位置是否可以放置炸彈
    if (this.canMoveBombTo(targetX, targetY, map)) {
      // 恢復原位置的地圖格子類型
      map[bomb.gridY][bomb.gridX].type = 0; // EMPTY
      
      // 移動炸彈到目標位置
      bomb.gridX = targetX;
      bomb.gridY = targetY;
      bomb.pixelX = targetX * TILE_SIZE + TILE_SIZE / 2;
      bomb.pixelY = targetY * TILE_SIZE + TILE_SIZE / 2;
      
      // 更新新位置的地圖格子類型
      map[targetY][targetX].type = 3; // BOMB
      
      console.log(`炸彈移動到玩家面前前進1格位置: (${targetX}, ${targetY})`);
    } else {
      console.log(`玩家面前前進1格位置 (${targetX}, ${targetY}) 無法放置炸彈`);
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
    
    // 如果炸彈有穿透能力，添加特殊效果
    if (bomb.canPierce) {
      // 穿透效果：紫色邊框
      ctx.strokeStyle = '#8A2BE2';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 1, y - 1, size + 2, size + 2);
      
      // 穿透標記
      ctx.fillStyle = '#8A2BE2';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💥', bomb.pixelX, bomb.pixelY + size/2 + 8);
    }
    
    // 如果炸彈被踢動，添加特殊效果
    if (bomb.kicked) {
      // 踢動效果：閃爍的黃色邊框
      const kickTime = Date.now() - bomb.placeTime;
      const kickFlashRate = 100;
      if (Math.floor(kickTime / kickFlashRate) % 2 === 0) {
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 2, y - 2, size + 4, size + 4);
      }
      
      // 踢動方向箭頭
      ctx.fillStyle = '#FFFF00';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      let arrow = '';
      switch (bomb.kickDirection) {
        case Direction.UP: arrow = '↑'; break;
        case Direction.DOWN: arrow = '↓'; break;
        case Direction.LEFT: arrow = '←'; break;
        case Direction.RIGHT: arrow = '→'; break;
      }
      
      if (arrow) {
        ctx.fillText(arrow, bomb.pixelX, bomb.pixelY - size/2 - 10);
      }
    }
  }
}
