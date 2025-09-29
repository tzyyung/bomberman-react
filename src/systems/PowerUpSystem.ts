/**
 * 道具系統 (PowerUpSystem)
 * 
 * 功能說明：
 * - 管理遊戲中所有道具的生命週期
 * - 處理道具的生成、收集和效果應用
 * - 實現道具的視覺渲染和動畫效果
 * - 支持多種道具類型和效果
 * - 處理道具的時效性和永久性效果
 * 
 * 主要方法：
 * - createPowerUp: 創建新道具
 * - updatePowerUps: 更新所有道具狀態
 * - collectPowerUp: 收集道具
 * - applyPowerUpEffect: 應用道具效果
 * - generatePowerUpAt: 在指定位置生成道具
 * - render: 渲染道具視覺效果
 */

import { PowerUp, Player, MapTile } from '../types'; // 導入類型定義
import { PowerUpType, TILE_SIZE, POWERUP_SYMBOLS } from '../constants'; // 導入常數定義

export class PowerUpSystem {
  private powerUpIdCounter = 0; // 道具ID計數器，確保每個道具都有唯一ID

  /**
   * 創建新道具
   * 
   * 功能說明：
   * - 初始化道具的所有基本屬性
   * - 設置道具的位置和類型
   * - 配置道具的收集狀態
   * - 為道具分配唯一ID
   * 
   * @param x 道具X坐標（網格）
   * @param y 道具Y坐標（網格）
   * @param type 道具類型
   * @returns 新創建的道具對象
   */
  public createPowerUp(x: number, y: number, type: PowerUpType): PowerUp {
    return {
      id: `powerup_${this.powerUpIdCounter++}`, // 生成唯一ID
      gridX: x, // 網格X坐標
      gridY: y, // 網格Y坐標
      pixelX: x * TILE_SIZE + TILE_SIZE / 2, // 像素X坐標（中心點）
      pixelY: y * TILE_SIZE + TILE_SIZE / 2, // 像素Y坐標（中心點）
      type, // 道具類型
      collected: false, // 是否已被收集
    };
  }

  /**
   * 更新所有道具狀態
   * 
   * 功能說明：
   * - 清理已收集的道具
   * - 維護道具數組的整潔性
   * - 為新道具騰出空間
   * - 簡化的更新邏輯，專注於清理
   * 
   * @param powerUps 道具數組
   * @param players 玩家數組（未使用，保留用於未來擴展）
   */
  public updatePowerUps(powerUps: PowerUp[], players: Player[]): void {
    // 從後往前遍歷，安全地移除已收集的道具
    for (let i = powerUps.length - 1; i >= 0; i--) {
      if (powerUps[i].collected) {
        // 移除已收集的道具
        powerUps.splice(i, 1);
      }
    }
  }

  /**
   * 收集道具
   * 
   * 功能說明：
   * - 處理玩家與道具的碰撞
   * - 標記道具為已收集狀態
   * - 立即應用道具效果到玩家
   * - 防止重複收集同一個道具
   * 
   * @param player 收集道具的玩家
   * @param powerUp 被收集的道具
   */
  public collectPowerUp(player: Player, powerUp: PowerUp): void {
    // 如果道具已被收集，直接返回
    if (powerUp.collected) return;
    
    // 輸出調試信息，記錄道具收集
    console.log(`玩家 ${player.id} 收集到道具，類型: ${powerUp.type}`);
    
    // 標記道具為已收集
    powerUp.collected = true;
    
    // 立即應用道具效果到玩家
    this.applyPowerUpEffect(player, powerUp.type);
  }

  /**
   * 應用道具效果到玩家
   * 
   * 功能說明：
   * - 根據道具類型增強玩家能力
   * - 支持多種道具效果（火力、炸彈、速度等）
   * - 處理時效性道具（如防護罩）
   * - 永久性道具會持續到遊戲結束
   * - 提供詳細的調試信息
   * 
   * @param player 要應用效果的玩家
   * @param type 道具類型
   */
  private applyPowerUpEffect(player: Player, type: PowerUpType): void {
    // 根據道具類型應用不同的效果
    switch (type) {
      case PowerUpType.FIRE: // 火力道具
        player.bombPower++; // 增加炸彈威力（爆炸範圍）
        console.log(`玩家 ${player.id} 獲得火力道具，炸彈威力增加到: ${player.bombPower}`);
        break;
      case PowerUpType.BOMB: // 炸彈道具
        player.maxBombs++; // 增加最大炸彈數量
        console.log(`玩家 ${player.id} 獲得炸彈道具，最大炸彈數增加到: ${player.maxBombs}`);
        break;
      case PowerUpType.SPEED: // 速度道具
        player.speed += 0.5; // 增加移動速度
        console.log(`玩家 ${player.id} 獲得速度道具，移動速度增加到: ${player.speed}`);
        break;
      case PowerUpType.KICK: // 踢炸彈道具
        player.canKick = true; // 啟用踢炸彈能力
        player.kickCount = (player.kickCount || 0) + 1; // 增加踢動距離
        console.log(`玩家 ${player.id} 獲得踢炸彈道具，可以踢炸彈，踢動距離: ${player.kickCount}`);
        break;
      case PowerUpType.PIERCE: // 穿透道具
        player.canPierce = true; // 啟用穿透能力
        console.log(`玩家 ${player.id} 獲得穿透道具，炸彈可以穿透軟牆`);
        break;
      case PowerUpType.REMOTE: // 遙控道具
        player.canRemote = true; // 啟用遙控引爆能力
        console.log(`玩家 ${player.id} 獲得遙控道具，可以遙控引爆炸彈`);
        break;
      case PowerUpType.SHIELD: // 防護罩道具
        player.hasShield = true; // 啟用防護罩
        player.shieldEndTime = Date.now() + 10000; // 設置10秒後過期
        console.log(`玩家 ${player.id} 獲得防護罩道具，10秒內無敵`);
        break;
    }
  }

  public generatePowerUpAt(x: number, y: number, map: MapTile[][]): PowerUp | null {
    console.log(`PowerUpSystem: 嘗試在位置 (${x}, ${y}) 生成道具`);
    
    if (x < 0 || x >= map[0].length || y < 0 || y >= map.length) {
      console.log(`PowerUpSystem: 位置超出地圖範圍`);
      return null;
    }
    
    const tile = map[y][x];
    console.log(`PowerUpSystem: 地圖格子類型: ${tile.type}, 已有道具: ${tile.hasPowerUp}`);
    
    // 檢查是否為空地
    if (tile.type !== 0) {
      console.log(`PowerUpSystem: 格子不是空地，無法生成`);
      return null;
    }
    
    // 隨機選擇道具類型
    const powerUpTypes = Object.values(PowerUpType).filter(v => typeof v === 'number') as PowerUpType[];
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    console.log(`PowerUpSystem: 選擇道具類型: ${randomType}`);
    
    const powerUp = this.createPowerUp(x, y, randomType);
    tile.hasPowerUp = true;
    tile.powerUpType = randomType;
    
    console.log(`PowerUpSystem: 道具生成成功，ID: ${powerUp.id}`);
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