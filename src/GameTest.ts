/**
 * 遊戲功能測試
 * 用於驗證遊戲各個系統是否正常工作
 */

import { GameEngine } from './GameEngine';
import { Direction } from './constants';

export class GameTest {
  private gameEngine: GameEngine;
  private canvas: HTMLCanvasElement;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.gameEngine = new GameEngine(this.canvas);
  }

  public runAllTests(): void {
    console.log('🧪 開始遊戲功能測試...');
    
    this.testGameInitialization();
    this.testGameStart();
    this.testPlayerMovement();
    this.testBombPlacement();
    
    console.log('✅ 所有測試完成！');
  }

  private testGameInitialization(): void {
    console.log('測試遊戲初始化...');
    
    const gameState = this.gameEngine.getGameState();
    
    if (gameState.state === 'menu') {
      console.log('✅ 遊戲初始化成功 - 狀態為菜單');
    } else {
      console.log('❌ 遊戲初始化失敗 - 狀態不正確');
    }
  }

  private testGameStart(): void {
    console.log('測試遊戲開始...');
    
    this.gameEngine.startGame();
    const gameState = this.gameEngine.getGameState();
    
    if (gameState.state === 'playing' && gameState.players.length === 2) {
      console.log('✅ 遊戲開始成功 - 狀態為遊戲中，玩家數量正確');
    } else {
      console.log('❌ 遊戲開始失敗 - 狀態或玩家數量不正確');
    }
  }

  private testPlayerMovement(): void {
    console.log('測試玩家移動...');
    
    const gameState = this.gameEngine.getGameState();
    const player = gameState.players[0];
    const originalX = player.gridX;
    const originalY = player.gridY;
    
    // 模擬移動輸入
    const mockEvent = new KeyboardEvent('keydown', { code: 'KeyW' });
    document.dispatchEvent(mockEvent);
    
    // 等待一幀
    setTimeout(() => {
      const newGameState = this.gameEngine.getGameState();
      const newPlayer = newGameState.players[0];
      
      if (newPlayer.gridX !== originalX || newPlayer.gridY !== originalY) {
        console.log('✅ 玩家移動測試成功');
      } else {
        console.log('❌ 玩家移動測試失敗');
      }
    }, 100);
  }

  private testBombPlacement(): void {
    console.log('測試炸彈放置...');
    
    const gameState = this.gameEngine.getGameState();
    const originalBombCount = gameState.bombs.length;
    
    // 模擬放置炸彈
    const mockEvent = new KeyboardEvent('keydown', { code: 'Space' });
    document.dispatchEvent(mockEvent);
    
    // 等待一幀
    setTimeout(() => {
      const newGameState = this.gameEngine.getGameState();
      
      if (newGameState.bombs.length > originalBombCount) {
        console.log('✅ 炸彈放置測試成功');
      } else {
        console.log('❌ 炸彈放置測試失敗');
      }
    }, 100);
  }


  public destroy(): void {
    this.gameEngine.destroy();
  }
}

// 如果直接運行此文件，執行測試
if (typeof window !== 'undefined') {
  const test = new GameTest();
  test.runAllTests();
}
