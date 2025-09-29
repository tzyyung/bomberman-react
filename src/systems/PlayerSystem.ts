/**
 * 玩家系統
 * 負責玩家管理、移動和渲染
 */

import { Player, MapTile } from '../types';
import { Direction, TILE_SIZE, PLAYER_SPEED, BLUE, RED } from '../constants';

export class PlayerSystem {
  public createPlayer(x: number, y: number, id: number, color: string): Player {
    return {
      id,
      alive: true,
      gridX: x,
      gridY: y,
      pixelX: x * TILE_SIZE + TILE_SIZE / 2,
      pixelY: y * TILE_SIZE + TILE_SIZE / 2,
      direction: Direction.DOWN,
      speed: PLAYER_SPEED,
      maxBombs: 1,
      bombPower: 1,
      canKick: false,
      canPierce: false,
      canRemote: false,
      hasShield: false,
      shieldEndTime: 0,
      bombCount: 0,
      lastBombTime: 0,
      lastKickTime: 0,
      lastRemoteTime: 0,
      color,
    };
  }

  public updatePlayers(players: Player[], map: MapTile[][], deltaTime: number): void {
    players.forEach(player => {
      if (!player.alive) return;
      
      this.updatePlayerPosition(player, map, deltaTime);
      this.updatePlayerAbilities(player);
    });
  }

  private updatePlayerPosition(player: Player, map: MapTile[][], deltaTime: number): void {
    // 平滑移動到目標位置
    const targetX = player.gridX * TILE_SIZE + TILE_SIZE / 2;
    const targetY = player.gridY * TILE_SIZE + TILE_SIZE / 2;
    
    const dx = targetX - player.pixelX;
    const dy = targetY - player.pixelY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 1) {
      const moveX = (dx / distance) * player.speed * deltaTime * 0.1;
      const moveY = (dy / distance) * player.speed * deltaTime * 0.1;
      
      player.pixelX += moveX;
      player.pixelY += moveY;
    } else {
      player.pixelX = targetX;
      player.pixelY = targetY;
    }
  }

  private updatePlayerAbilities(player: Player): void {
    // 更新防護罩狀態
    if (player.hasShield && Date.now() > player.shieldEndTime) {
      player.hasShield = false;
    }
  }

  public movePlayer(player: Player, direction: Direction, map: MapTile[][]): void {
    if (!player.alive) return;
    
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
    if (this.canMoveTo(newX, newY, map)) {
      player.gridX = newX;
      player.gridY = newY;
      player.direction = direction;
    }
  }

  private canMoveTo(x: number, y: number, map: MapTile[][]): boolean {
    if (x < 0 || x >= map[0].length || y < 0 || y >= map.length) {
      return false;
    }
    
    const tile = map[y][x];
    return tile.type === 0 || tile.type === 5; // EMPTY or POWERUP
  }

  public render(ctx: CanvasRenderingContext2D, players: Player[]): void {
    players.forEach(player => {
      if (!player.alive) return;
      
      this.renderPlayer(ctx, player);
    });
  }

  private renderPlayer(ctx: CanvasRenderingContext2D, player: Player): void {
    const size = TILE_SIZE * 0.6;
    const x = player.pixelX - size / 2;
    const y = player.pixelY - size / 2;
    
    // 繪製玩家身體
    ctx.fillStyle = player.color;
    ctx.fillRect(x, y, size, size);
    
    // 繪製玩家邊框
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
    
    // 繪製方向指示器
    this.renderDirectionIndicator(ctx, player);
    
    // 繪製防護罩效果
    if (player.hasShield) {
      this.renderShield(ctx, player);
    }
  }

  private renderDirectionIndicator(ctx: CanvasRenderingContext2D, player: Player): void {
    const centerX = player.pixelX;
    const centerY = player.pixelY;
    const size = TILE_SIZE * 0.2;
    
    ctx.fillStyle = '#FFFFFF';
    
    switch (player.direction) {
      case Direction.UP:
        ctx.fillRect(centerX - size/2, centerY - size, size, size);
        break;
      case Direction.DOWN:
        ctx.fillRect(centerX - size/2, centerY, size, size);
        break;
      case Direction.LEFT:
        ctx.fillRect(centerX - size, centerY - size/2, size, size);
        break;
      case Direction.RIGHT:
        ctx.fillRect(centerX, centerY - size/2, size, size);
        break;
    }
  }

  private renderShield(ctx: CanvasRenderingContext2D, player: Player): void {
    const centerX = player.pixelX;
    const centerY = player.pixelY;
    const radius = TILE_SIZE * 0.4;
    
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  public applyPowerUp(player: Player, powerUpType: number): void {
    switch (powerUpType) {
      case 0: // FIRE
        player.bombPower++;
        break;
      case 1: // BOMB
        player.maxBombs++;
        break;
      case 2: // SPEED
        player.speed += 0.5;
        break;
      case 3: // KICK
        player.canKick = true;
        break;
      case 4: // PIERCE
        player.canPierce = true;
        break;
      case 5: // REMOTE
        player.canRemote = true;
        break;
      case 6: // SHIELD
        player.hasShield = true;
        player.shieldEndTime = Date.now() + 10000; // 10秒
        break;
    }
  }
}

