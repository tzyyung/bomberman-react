/**
 * 道具系統
 * 負責道具管理、生成和渲染
 */

import { PowerUp, Player, MapTile } from '../types';
import { PowerUpType, TILE_SIZE, POWERUP_SYMBOLS } from '../constants';

export class PowerUpSystem {
  private powerUpIdCounter = 0;

  public createPowerUp(x: number, y: number, type: PowerUpType): PowerUp {
    return {
      id: `powerup_${this.powerUpIdCounter++}`,
      gridX: x,
      gridY: y,
      pixelX: x * TILE_SIZE + TILE_SIZE / 2,
      pixelY: y * TILE_SIZE + TILE_SIZE / 2,
      type,
      collected: false,
    };
  }

  public updatePowerUps(powerUps: PowerUp[], players: Player[]): void {
    // 移除已收集的道具
    for (let i = powerUps.length - 1; i >= 0; i--) {
      if (powerUps[i].collected) {
        powerUps.splice(i, 1);
      }
    }
  }

  public collectPowerUp(player: Player, powerUp: PowerUp): void {
    if (powerUp.collected) return;
    
    powerUp.collected = true;
    this.applyPowerUpEffect(player, powerUp.type);
  }

  private applyPowerUpEffect(player: Player, type: PowerUpType): void {
    switch (type) {
      case PowerUpType.FIRE:
        player.bombPower++;
        break;
      case PowerUpType.BOMB:
        player.maxBombs++;
        break;
      case PowerUpType.SPEED:
        player.speed += 0.5;
        break;
      case PowerUpType.KICK:
        player.canKick = true;
        break;
      case PowerUpType.PIERCE:
        player.canPierce = true;
        break;
      case PowerUpType.REMOTE:
        player.canRemote = true;
        break;
      case PowerUpType.SHIELD:
        player.hasShield = true;
        player.shieldEndTime = Date.now() + 10000; // 10秒
        break;
    }
  }

  public generatePowerUpAt(x: number, y: number, map: MapTile[][]): PowerUp | null {
    if (x < 0 || x >= map[0].length || y < 0 || y >= map.length) return null;
    
    const tile = map[y][x];
    if (tile.type !== 0 || tile.hasPowerUp) return null; // 不是空地或已有道具
    
    // 隨機選擇道具類型
    const powerUpTypes = Object.values(PowerUpType).filter(v => typeof v === 'number') as PowerUpType[];
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    const powerUp = this.createPowerUp(x, y, randomType);
    tile.hasPowerUp = true;
    tile.powerUpType = randomType;
    
    return powerUp;
  }

  public render(ctx: CanvasRenderingContext2D, powerUps: PowerUp[]): void {
    powerUps.forEach(powerUp => {
      if (powerUp.collected) return;
      
      this.renderPowerUp(ctx, powerUp);
    });
  }

  private renderPowerUp(ctx: CanvasRenderingContext2D, powerUp: PowerUp): void {
    const size = TILE_SIZE * 0.6;
    const x = powerUp.pixelX - size / 2;
    const y = powerUp.pixelY - size / 2;
    
    // 繪製道具背景
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, size, size);
    
    // 繪製道具邊框
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
    
    // 繪製道具符號
    const symbol = POWERUP_SYMBOLS[powerUp.type];
    ctx.fillStyle = '#000000';
    ctx.font = `${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, powerUp.pixelX, powerUp.pixelY);
    
    // 繪製閃爍效果
    const time = Date.now();
    const flashRate = 1000;
    if (Math.floor(time / flashRate) % 2 === 0) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 2, y - 2, size + 4, size + 4);
    }
  }

  public getPowerUpName(type: PowerUpType): string {
    const names = {
      [PowerUpType.FIRE]: '火焰',
      [PowerUpType.BOMB]: '炸彈',
      [PowerUpType.SPEED]: '速度',
      [PowerUpType.KICK]: '踢炸彈',
      [PowerUpType.PIERCE]: '穿透',
      [PowerUpType.REMOTE]: '遙控',
      [PowerUpType.SHIELD]: '防護罩',
    };
    
    return names[type] || '未知';
  }

  public getPowerUpDescription(type: PowerUpType): string {
    const descriptions = {
      [PowerUpType.FIRE]: '增加炸彈威力',
      [PowerUpType.BOMB]: '增加可放置炸彈數量',
      [PowerUpType.SPEED]: '增加移動速度',
      [PowerUpType.KICK]: '可以踢動炸彈',
      [PowerUpType.PIERCE]: '炸彈可以穿透軟牆',
      [PowerUpType.REMOTE]: '可以遙控引爆炸彈',
      [PowerUpType.SHIELD]: '10秒內無敵狀態',
    };
    
    return descriptions[type] || '未知效果';
  }
}