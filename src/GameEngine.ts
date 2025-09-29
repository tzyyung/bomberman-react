/**
 * 遊戲引擎核心類 (GameEngine)
 * 
 * 功能說明：
 * - 管理整個遊戲的生命週期和狀態
 * - 協調各個子系統的運行和更新
 * - 處理用戶輸入和遊戲事件
 * - 控制遊戲循環和渲染流程
 * - 管理遊戲配置和初始化
 * - 處理道具生成和定時事件
 * 
 * 主要方法：
 * - constructor: 初始化遊戲引擎
 * - startGame: 開始遊戲
 * - restartGame: 重新開始遊戲
 * - update: 更新遊戲狀態
 * - render: 渲染遊戲畫面
 * - handleInput: 處理用戶輸入
 * - gameLoop: 遊戲主循環
 */

import { GameState, InputEvent, GameConfig, Player } from './types'; // 導入類型定義
import { Direction, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, PLAYER_SPEED, BOMB_TIMER, EXPLOSION_DURATION } from './constants'; // 導入常數定義
import { MapSystem } from './systems/MapSystem'; // 地圖系統
import { PlayerSystem } from './systems/PlayerSystem'; // 玩家系統
import { BombSystem } from './systems/BombSystem'; // 炸彈系統
import { PowerUpSystem } from './systems/PowerUpSystem'; // 道具系統
import { AudioSystem } from './systems/AudioSystem'; // 音頻系統
import { UISystem } from './systems/UISystem'; // UI系統

export class GameEngine {
  private canvas: HTMLCanvasElement; // Canvas 元素
  private ctx: CanvasRenderingContext2D; // Canvas 2D 渲染上下文
  private gameState: GameState; // 遊戲狀態
  private config: GameConfig; // 遊戲配置
  private systems: { // 各個子系統
    map: MapSystem; // 地圖系統
    player: PlayerSystem; // 玩家系統
    bomb: BombSystem; // 炸彈系統
    powerUp: PowerUpSystem; // 道具系統
    audio: AudioSystem; // 音頻系統
    ui: UISystem; // UI系統
  };
  private lastTime: number = 0; // 上一幀的時間戳
  private animationId: number | null = null; // 動畫幀ID
  private inputQueue: InputEvent[] = []; // 輸入事件隊列
  private lastPowerUpSpawnTime: number = 0; // 上次道具生成時間
  private powerUpSpawnInterval: number = 10000; // 道具生成間隔（10秒）

  /**
   * 遊戲引擎構造函數
   * 
   * 功能說明：
   * - 初始化 Canvas 和渲染上下文
   * - 設置遊戲配置參數
   * - 初始化遊戲狀態
   * - 創建各個子系統實例
   * - 設置事件監聽器
   * 
   * @param canvas HTML Canvas 元素
   */
  constructor(canvas: HTMLCanvasElement) {
    // 保存 Canvas 元素和獲取 2D 渲染上下文
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    // 設置畫布大小（832x704 像素）
    this.canvas.width = 832;
    this.canvas.height = 704;
    
    // 初始化遊戲配置參數
    this.config = {
      mapWidth: MAP_WIDTH,        // 地圖寬度（網格）
      mapHeight: MAP_HEIGHT,      // 地圖高度（網格）
      tileSize: TILE_SIZE,        // 格子大小（像素）
      playerSpeed: PLAYER_SPEED,  // 玩家移動速度
      bombTimer: BOMB_TIMER,      // 炸彈計時器（毫秒）
      explosionDuration: EXPLOSION_DURATION, // 爆炸持續時間
      maxBombs: 1,                // 最大炸彈數量（初始值）
      bombPower: 1,               // 炸彈威力（初始值）
      powerUpChance: 0.3,         // 道具生成機率（30%）
      gameTime: 300000,           // 遊戲時間（5分鐘）
    };

    // 初始化遊戲狀態
    this.gameState = {
      state: 'menu',              // 遊戲狀態（菜單）
      winner: null,               // 獲勝者（初始為空）
      players: [],                // 玩家數組
      bombs: [],                  // 炸彈數組
      powerUps: [],               // 道具數組
      explosions: [],             // 爆炸數組
      map: [],                    // 地圖數據
      score: { player1: 0, player2: 0 }, // 分數統計
      time: 0,                    // 遊戲時間
      paused: false,              // 暫停狀態
    };

    // 初始化各個子系統
    this.systems = {
      map: new MapSystem(),       // 地圖系統
      player: new PlayerSystem(), // 玩家系統
      bomb: new BombSystem(),     // 炸彈系統
      powerUp: new PowerUpSystem(), // 道具系統
      audio: new AudioSystem(),   // 音頻系統
      ui: new UISystem(),         // UI系統
    };

    // 設置事件監聽器（鍵盤輸入等）
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // 鍵盤事件監聽
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // 阻止瀏覽器默認行為
    event.preventDefault();
    
    // 處理重新開始按鍵
    if (event.key === 'r' || event.key === 'R') {
      if (this.gameState.state === 'over') {
        console.log('鍵盤重新開始被觸發');
        this.restartGame();
        return;
      }
    }
    
    
    if (this.gameState.state !== 'playing') return;

    const inputEvent = this.parseKeyEvent(event);
    if (inputEvent) {
      this.inputQueue.push(inputEvent);
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    // 阻止瀏覽器默認行為
    event.preventDefault();
    
    // 處理按鍵釋放事件
  }

  private parseKeyEvent(event: KeyboardEvent): InputEvent | null {
    const key = event.code;
    
    // 玩家1按鍵
    if (key === 'KeyW' || key === 'KeyS' || key === 'KeyA' || key === 'KeyD') {
      let direction: Direction;
      switch (key) {
        case 'KeyW': direction = Direction.UP; break;
        case 'KeyS': direction = Direction.DOWN; break;
        case 'KeyA': direction = Direction.LEFT; break;
        case 'KeyD': direction = Direction.RIGHT; break;
        default: return null;
      }
      return {
        playerId: 1,
        action: 'move',
        direction: direction,
        timestamp: Date.now()
      };
    }
    
    // 玩家2按鍵
    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
      let direction: Direction;
      switch (key) {
        case 'ArrowUp': direction = Direction.UP; break;
        case 'ArrowDown': direction = Direction.DOWN; break;
        case 'ArrowLeft': direction = Direction.LEFT; break;
        case 'ArrowRight': direction = Direction.RIGHT; break;
        default: return null;
      }
      return {
        playerId: 2,
        action: 'move',
        direction: direction,
        timestamp: Date.now()
      };
    }
    
    // 炸彈按鍵
    if (key === 'Space') {
      return {
        playerId: 1,
        action: 'bomb',
        timestamp: Date.now()
      };
    }
    
    if (key === 'Enter') {
      return {
        playerId: 2,
        action: 'bomb',
        timestamp: Date.now()
      };
    }
    
    // 踢炸彈按鍵
    if (key === 'KeyB') {
      return {
        playerId: 1,
        action: 'kick',
        timestamp: Date.now()
      };
    }
    
    if (key === 'ShiftRight') {
      return {
        playerId: 2,
        action: 'kick',
        timestamp: Date.now()
      };
    }
    
    // 遙控爆炸按鍵
    if (key === 'KeyV') {
      return {
        playerId: 1,
        action: 'remote',
        timestamp: Date.now()
      };
    }
    
    if (key === 'Slash') {
      return {
        playerId: 2,
        action: 'remote',
        timestamp: Date.now()
      };
    }
    
    return null;
  }

  private initializeGame(): void {
    // 生成地圖
    this.gameState.map = this.systems.map.generateMap();
    
    // 創建玩家
    this.gameState.players = [
      this.systems.player.createPlayer(1, 1, 1, '#0000FF'), // 玩家1 - 藍色
      this.systems.player.createPlayer(11, 9, 2, '#FF0000'), // 玩家2 - 紅色
    ];
  }

  public startGame(): void {
    this.initializeGame();
    this.gameState.state = 'playing';
    this.lastPowerUpSpawnTime = Date.now(); // 初始化道具生成時間
    this.gameLoop();
  }


  public restartGame(): void {
    console.log('GameEngine: restartGame 被調用');
    
    // 停止當前的遊戲循環
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // 重置遊戲狀態
    this.gameState = {
      state: 'menu',
      winner: null,
      players: [],
      bombs: [],
      powerUps: [],
      explosions: [],
      map: [],
      score: { player1: 0, player2: 0 },
      time: 0,
      paused: false,
    };
    
    console.log('GameEngine: 遊戲狀態已重置');
    
    // 重新初始化遊戲
    this.initializeGame();
    this.gameState.state = 'playing';
    this.lastTime = performance.now();
    this.lastPowerUpSpawnTime = Date.now(); // 重置道具生成時間
    this.gameLoop();
    
    console.log('GameEngine: 遊戲重新開始完成，狀態:', this.gameState.state);
  }

  public showMenu(): void {
    this.gameState.state = 'menu';
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private gameLoop(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (!this.gameState.paused) {
      this.update(deltaTime);
    }
    
    this.render();
    
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  private update(deltaTime: number): void {
    // 處理輸入
    this.processInput();
    
    // 更新玩家
    this.systems.player.updatePlayers(this.gameState.players, this.gameState.map, deltaTime);
    
    // 更新炸彈
    const explosionPositions = this.systems.bomb.updateBombs(this.gameState.bombs, this.gameState.map, this.gameState.players, deltaTime);
    
    // 創建爆炸效果和道具
    explosionPositions.forEach(positions => {
      positions.forEach(pos => {
        // 創建爆炸效果
        const explosion = {
          id: `explosion_${Date.now()}_${Math.random()}`,
          gridX: pos.x,
          gridY: pos.y,
          pixelX: pos.x * TILE_SIZE + TILE_SIZE / 2,
          pixelY: pos.y * TILE_SIZE + TILE_SIZE / 2,
          startTime: Date.now(),
          duration: EXPLOSION_DURATION,
          finished: false,
          direction: null as any,
        };
        this.gameState.explosions.push(explosion);
        
        // 檢查是否需要生成道具
        if (this.gameState.map[pos.y][pos.x].hasPowerUp) {
          console.log(`GameEngine: 在位置 (${pos.x}, ${pos.y}) 生成道具`);
          const powerUp = this.systems.powerUp.generatePowerUpAt(pos.x, pos.y, this.gameState.map);
          if (powerUp) {
            this.gameState.powerUps.push(powerUp);
            console.log(`GameEngine: 道具生成成功，類型: ${powerUp.type}`);
          } else {
            console.log(`GameEngine: 道具生成失敗`);
          }
          // 清除地圖上的道具標記
          this.gameState.map[pos.y][pos.x].hasPowerUp = false;
        }
      });
    });
    
    // 清理已爆炸的炸彈
    this.gameState.bombs = this.gameState.bombs.filter(bomb => !bomb.exploded);
    
    // 更新爆炸
    this.updateExplosions(deltaTime);
    
    // 更新道具
    this.systems.powerUp.updatePowerUps(this.gameState.powerUps, this.gameState.players);
    
    // 定時生成道具
    this.spawnRandomPowerUps();
    
    // 檢查碰撞
    this.checkCollisions();
    
    // 更新遊戲時間
    this.gameState.time += deltaTime;
    
    // 檢查遊戲結束條件
    this.checkGameEnd();
  }

  private processInput(): void {
    // 簡單直接：逐個處理輸入
    while (this.inputQueue.length > 0) {
      const input = this.inputQueue.shift()!;
      this.handleInput(input);
    }
  }

  private handleInput(input: InputEvent): void {
    const player = this.gameState.players.find(p => p.id === input.playerId);
    if (!player || !player.alive) return;

    switch (input.action) {
      case 'move':
        if (input.direction !== undefined) {
          this.systems.player.movePlayer(player, input.direction, this.gameState.map);
        }
        break;
      case 'bomb':
        this.systems.bomb.placeBomb(player, this.gameState.bombs, this.gameState.map);
        break;
      case 'kick':
        this.systems.bomb.kickBomb(player, this.gameState.bombs, this.gameState.map);
        break;
      case 'remote':
        this.systems.bomb.remoteExplode(player, this.gameState.bombs);
        break;
    }
  }

  private updateExplosions(deltaTime: number): void {
    this.gameState.explosions = this.gameState.explosions.filter(explosion => {
      explosion.duration -= deltaTime;
      return explosion.duration > 0;
    });
  }

  private checkCollisions(): void {
    // 檢查玩家與爆炸的碰撞
    this.gameState.players.forEach(player => {
      if (!player.alive) return;
      
      this.gameState.explosions.forEach(explosion => {
        if (this.isColliding(player, explosion)) {
          if (!player.hasShield) {
            player.alive = false;
            this.systems.audio.playSound('player_death');
          }
        }
      });
    });
    
    // 檢查玩家與道具的碰撞
    this.gameState.players.forEach(player => {
      if (!player.alive) return;
      
      this.gameState.powerUps.forEach(powerUp => {
        if (!powerUp.collected && this.isColliding(player, powerUp)) {
          this.systems.powerUp.collectPowerUp(player, powerUp);
          this.systems.audio.playSound('powerup_collect');
          
          // 如果獲得踢炸彈道具，更新玩家已放置的炸彈
          if (powerUp.type === 3) { // PowerUpType.KICK
            this.updatePlayerBombsKickAbility(player);
          }
        }
      });
    });
  }

  private isColliding(obj1: { pixelX: number; pixelY: number }, obj2: { pixelX: number; pixelY: number }): boolean {
    const distance = Math.sqrt(
      Math.pow(obj1.pixelX - obj2.pixelX, 2) + 
      Math.pow(obj1.pixelY - obj2.pixelY, 2)
    );
    return distance < TILE_SIZE / 2;
  }

  private updatePlayerBombsKickAbility(player: Player): void {
    console.log(`更新玩家 ${player.id} 的炸彈踢動能力，踢動距離: ${player.kickCount}`);
    
    // 更新玩家已放置的炸彈的 canKick 屬性和踢動距離
    this.gameState.bombs.forEach(bomb => {
      if (bomb.ownerId === player.id && !bomb.exploded) {
        bomb.canKick = player.canKick;
        bomb.maxKickDistance = player.kickCount || 1;
        console.log(`更新炸彈 ${bomb.id} 的踢動能力: ${bomb.canKick}，最大距離: ${bomb.maxKickDistance}`);
      }
    });
  }

  private spawnRandomPowerUps(): void {
    const currentTime = Date.now();
    
    // 檢查是否到了生成道具的時間
    if (currentTime - this.lastPowerUpSpawnTime >= this.powerUpSpawnInterval) {
      this.lastPowerUpSpawnTime = currentTime;
      
      // 生成1-3個道具
      const powerUpCount = Math.floor(Math.random() * 3) + 1; // 1-3個
      console.log(`定時生成 ${powerUpCount} 個道具`);
      
      for (let i = 0; i < powerUpCount; i++) {
        this.spawnRandomPowerUp();
      }
    }
  }

  private spawnRandomPowerUp(): void {
    // 尋找空閒的位置
    const emptyPositions: {x: number, y: number}[] = [];
    
    for (let y = 0; y < this.gameState.map.length; y++) {
      for (let x = 0; x < this.gameState.map[y].length; x++) {
        const tile = this.gameState.map[y][x];
        // 檢查是否為空地且沒有道具
        if (tile.type === 0 && !tile.hasPowerUp) {
          // 檢查是否已經有道具在這個位置
          const existingPowerUp = this.gameState.powerUps.find(p => p.gridX === x && p.gridY === y);
          if (!existingPowerUp) {
            emptyPositions.push({x, y});
          }
        }
      }
    }
    
    // 如果有空閒位置，隨機選擇一個生成道具
    if (emptyPositions.length > 0) {
      const randomPos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
      const powerUp = this.systems.powerUp.generatePowerUpAt(randomPos.x, randomPos.y, this.gameState.map);
      if (powerUp) {
        this.gameState.powerUps.push(powerUp);
        console.log(`道具生成在位置 (${randomPos.x}, ${randomPos.y})`);
      }
    } else {
      console.log('沒有空閒位置生成道具');
    }
  }

  private checkGameEnd(): void {
    const alivePlayers = this.gameState.players.filter(p => p.alive);
    
    if (alivePlayers.length <= 1) {
      this.gameState.state = 'over';
      this.gameState.winner = alivePlayers.length === 1 ? alivePlayers[0].id : null;
      this.systems.audio.playSound('game_over');
      
      // 更新分數
      if (this.gameState.winner) {
        if (this.gameState.winner === 1) {
          this.gameState.score.player1++;
        } else {
          this.gameState.score.player2++;
        }
      }
    }
  }

  private render(): void {
    // 優化渲染：使用 clearRect 而不是 fillRect
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 渲染地圖
    this.systems.map.render(this.ctx, this.gameState.map);
    
    // 渲染道具
    this.systems.powerUp.render(this.ctx, this.gameState.powerUps);
    
    // 渲染炸彈
    this.systems.bomb.render(this.ctx, this.gameState.bombs);
    
    // 渲染爆炸
    this.renderExplosions();
    
    // 渲染玩家
    this.systems.player.render(this.ctx, this.gameState.players);
    
    // 渲染UI
    this.systems.ui.render(this.ctx, this.gameState);
  }

  private renderExplosions(): void {
    this.gameState.explosions.forEach(explosion => {
      this.ctx.fillStyle = '#FF0000';
      this.ctx.fillRect(
        explosion.pixelX - TILE_SIZE / 2,
        explosion.pixelY - TILE_SIZE / 2,
        TILE_SIZE,
        TILE_SIZE
      );
    });
  }

  public getGameState(): GameState {
    return { ...this.gameState };
  }

  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }
}