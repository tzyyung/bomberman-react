/**
 * UI系統
 * 負責用戶界面渲染
 */

import { GameState, Player, PowerUp } from '../types';
import { WHITE, GRAY, LIGHT_GREEN, BLUE, RED, TILE_SIZE } from '../constants';

export class UISystem {
  public render(ctx: CanvasRenderingContext2D, gameState: GameState): void {
    this.renderHUD(ctx, gameState);
    
    // 渲染道具
    if (gameState.state === 'playing') {
      this.renderPowerUps(ctx, gameState.powerUps);
    }
    
    if (gameState.state === 'menu') {
      this.renderMenu(ctx);
    } else if (gameState.state === 'paused') {
      this.renderPauseMenu(ctx);
    } else if (gameState.state === 'over') {
      this.renderGameOver(ctx, gameState);
    }
  }

  private renderHUD(ctx: CanvasRenderingContext2D, gameState: GameState): void {
    if (gameState.state !== 'playing') return;

    // 渲染玩家信息
    gameState.players.forEach((player, index) => {
      this.renderPlayerInfo(ctx, player, index);
    });

    // 渲染遊戲時間
    this.renderGameTime(ctx, gameState.time);

    // 渲染分數
    this.renderScore(ctx, gameState.score);
  }

  private renderPlayerInfo(ctx: CanvasRenderingContext2D, player: Player, index: number): void {
    const x = 20 + index * 200;
    const y = 20;
    
    // 玩家名稱
    ctx.fillStyle = player.color;
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`玩家 ${player.id}`, x, y);
    
    // 生命狀態
    ctx.fillStyle = player.alive ? LIGHT_GREEN : '#FF0000';
    ctx.font = '14px Arial';
    ctx.fillText(player.alive ? '存活' : '死亡', x, y + 20);
    
    // 炸彈數量
    ctx.fillStyle = WHITE;
    ctx.fillText(`炸彈: ${player.maxBombs - player.bombCount}/${player.maxBombs}`, x, y + 40);
    
    // 炸彈威力
    ctx.fillText(`威力: ${player.bombPower}`, x, y + 60);
    
    // 特殊能力
    const abilities = [];
    if (player.canKick) abilities.push('踢');
    if (player.canPierce) abilities.push('穿透');
    if (player.canRemote) abilities.push('遙控');
    if (player.hasShield) abilities.push('防護罩');
    
    if (abilities.length > 0) {
      ctx.fillText(`能力: ${abilities.join(', ')}`, x, y + 80);
    }
  }

  private renderGameTime(ctx: CanvasRenderingContext2D, time: number): void {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    ctx.fillStyle = WHITE;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(timeString, ctx.canvas.width / 2, 30);
    ctx.textAlign = 'left';
  }

  private renderScore(ctx: CanvasRenderingContext2D, score: { player1: number; player2: number }): void {
    const x = ctx.canvas.width - 150;
    const y = 20;
    
    ctx.fillStyle = WHITE;
    ctx.font = 'bold 16px Arial';
    ctx.fillText('分數', x, y);
    
    ctx.fillStyle = BLUE;
    ctx.font = '14px Arial';
    ctx.fillText(`玩家1: ${score.player1}`, x, y + 25);
    
    ctx.fillStyle = RED;
    ctx.fillText(`玩家2: ${score.player2}`, x, y + 45);
  }

  private renderMenu(ctx: CanvasRenderingContext2D): void {
    // 半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // 標題
    ctx.fillStyle = WHITE;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('炸彈超人', ctx.canvas.width / 2, ctx.canvas.height / 2 - 100);
    
    // 按鈕
    const buttons = [
      { text: '開始遊戲', action: 'start' },
      { text: '設置', action: 'settings' },
      { text: '退出', action: 'exit' },
    ];
    
    buttons.forEach((button, index) => {
      const y = ctx.canvas.height / 2 - 20 + index * 60;
      this.renderButton(ctx, button.text, ctx.canvas.width / 2, y, 200, 40);
    });
    
    ctx.textAlign = 'left';
  }

  private renderPauseMenu(ctx: CanvasRenderingContext2D): void {
    // 半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // 暫停標題
    ctx.fillStyle = WHITE;
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('遊戲暫停', ctx.canvas.width / 2, ctx.canvas.height / 2 - 60);
    
    // 按鈕
    const buttons = [
      { text: '繼續遊戲', action: 'resume' },
      { text: '重新開始', action: 'restart' },
      { text: '主選單', action: 'menu' },
    ];
    
    buttons.forEach((button, index) => {
      const y = ctx.canvas.height / 2 - 20 + index * 60;
      this.renderButton(ctx, button.text, ctx.canvas.width / 2, y, 200, 40);
    });
    
    ctx.textAlign = 'left';
  }

  private renderGameOver(ctx: CanvasRenderingContext2D, gameState: GameState): void {
    // 半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // 遊戲結束標題
    ctx.fillStyle = WHITE;
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('遊戲結束', ctx.canvas.width / 2, ctx.canvas.height / 2 - 100);
    
    // 獲勝者
    if (gameState.winner) {
      ctx.fillStyle = gameState.winner === 1 ? BLUE : RED;
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`玩家 ${gameState.winner} 獲勝！`, ctx.canvas.width / 2, ctx.canvas.height / 2 - 50);
    } else {
      ctx.fillStyle = GRAY;
      ctx.font = 'bold 24px Arial';
      ctx.fillText('平局！', ctx.canvas.width / 2, ctx.canvas.height / 2 - 50);
    }
    
    // 按鈕
    const buttons = [
      { text: '再玩一次', action: 'restart' },
      { text: '主選單', action: 'menu' },
    ];
    
    buttons.forEach((button, index) => {
      const y = ctx.canvas.height / 2 + 20 + index * 60;
      this.renderButton(ctx, button.text, ctx.canvas.width / 2, y, 200, 40);
    });
    
    ctx.textAlign = 'left';
  }

  private renderButton(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, height: number): void {
    // 按鈕背景
    ctx.fillStyle = GRAY;
    ctx.fillRect(x - width / 2, y - height / 2, width, height);
    
    // 按鈕邊框
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - width / 2, y - height / 2, width, height);
    
    // 按鈕文字
    ctx.fillStyle = WHITE;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  private renderPowerUps(ctx: CanvasRenderingContext2D, powerUps: PowerUp[]): void {
    powerUps.forEach(powerUp => {
      if (powerUp.collected) return;
      
      this.renderPowerUp(ctx, powerUp);
    });
  }

  private renderPowerUp(ctx: CanvasRenderingContext2D, powerUp: PowerUp): void {
    const size = TILE_SIZE * 0.6;
    const x = powerUp.pixelX - size / 2;
    const y = powerUp.pixelY - size / 2;
    
    // 道具背景
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x, y, size, size);
    
    // 道具邊框
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
    
    // 道具圖標（簡單的符號）
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let symbol = '?';
    switch (powerUp.type) {
      case 0: symbol = '🔥'; break; // 火焰
      case 1: symbol = '💣'; break; // 炸彈
      case 2: symbol = '⚡'; break; // 速度
      case 3: symbol = '👟'; break; // 踢炸彈
      case 4: symbol = '💥'; break; // 穿透
      case 5: symbol = '📱'; break; // 遙控
      case 6: symbol = '🛡️'; break; // 防護罩
    }
    
    ctx.fillText(symbol, powerUp.pixelX, powerUp.pixelY);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}
