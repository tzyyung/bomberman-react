/**
 * 遊戲引擎核心類
 * 負責管理遊戲狀態、更新和渲染
 */

import { GameState, InputEvent, GameConfig } from './types';
import { Direction, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, PLAYER_SPEED, BOMB_TIMER, EXPLOSION_DURATION } from './constants';
import { MapSystem } from './systems/MapSystem';
import { PlayerSystem } from './systems/PlayerSystem';
import { BombSystem } from './systems/BombSystem';
import { PowerUpSystem } from './systems/PowerUpSystem';
import { AudioSystem } from './systems/AudioSystem';
import { UISystem } from './systems/UISystem';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  private config: GameConfig;
  private systems: {
    map: MapSystem;
    player: PlayerSystem;
    bomb: BombSystem;
    powerUp: PowerUpSystem;
    audio: AudioSystem;
    ui: UISystem;
  };
  private lastTime: number = 0;
  private animationId: number | null = null;
  private inputQueue: InputEvent[] = [];
  private worker: Worker | null = null;
  private useWorker: boolean = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    // 設置畫布大小
    this.canvas.width = 832;
    this.canvas.height = 704;
    
    // 初始化配置
    this.config = {
      mapWidth: MAP_WIDTH,
      mapHeight: MAP_HEIGHT,
      tileSize: TILE_SIZE,
      playerSpeed: PLAYER_SPEED,
      bombTimer: BOMB_TIMER,
      explosionDuration: EXPLOSION_DURATION,
      maxBombs: 1,
      bombPower: 1,
      powerUpChance: 0.3,
      gameTime: 300000, // 5分鐘
    };

    // 初始化遊戲狀態
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

    // 初始化系統
    this.systems = {
      map: new MapSystem(),
      player: new PlayerSystem(),
      bomb: new BombSystem(),
      powerUp: new PowerUpSystem(),
      audio: new AudioSystem(),
      ui: new UISystem(),
    };

    // 初始化 Web Worker
    this.initWorker();

    this.setupEventListeners();
  }

  private initWorker(): void {
    if (typeof Worker !== 'undefined' && this.useWorker) {
      try {
        this.worker = new Worker('/game-worker.js');
        
        this.worker.onmessage = (e) => {
          const { type, gameState } = e.data;
          
          if (type === 'GAME_UPDATE' && gameState) {
            this.gameState = gameState;
          }
        };
        
        this.worker.onerror = (error) => {
          console.warn('Web Worker 初始化失敗，回退到主線程模式:', error);
          this.useWorker = false;
          this.worker = null;
        };
      } catch (error) {
        console.warn('Web Worker 不支持，回退到主線程模式:', error);
        this.useWorker = false;
        this.worker = null;
      }
    } else {
      this.useWorker = false;
    }
  }

  private setupEventListeners(): void {
    // 鍵盤事件監聽
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // 窗口失焦時暫停遊戲
    window.addEventListener('blur', () => {
      if (this.gameState.state === 'playing') {
        this.pauseGame();
      }
    });
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // 阻止瀏覽器默認行為
    event.preventDefault();
    
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
        direction,
        timestamp: Date.now(),
      };
    }
    
    if (key === 'Space') {
      return {
        playerId: 1,
        action: 'bomb',
        timestamp: Date.now(),
      };
    }
    
    if (key === 'KeyB') {
      return {
        playerId: 1,
        action: 'kick',
        timestamp: Date.now(),
      };
    }
    
    if (key === 'KeyV') {
      return {
        playerId: 1,
        action: 'remote',
        timestamp: Date.now(),
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
        direction,
        timestamp: Date.now(),
      };
    }
    
    if (key === 'Enter') {
      return {
        playerId: 2,
        action: 'bomb',
        timestamp: Date.now(),
      };
    }
    
    if (key === 'ShiftRight') {
      return {
        playerId: 2,
        action: 'kick',
        timestamp: Date.now(),
      };
    }
    
    if (key === 'Slash') {
      return {
        playerId: 2,
        action: 'remote',
        timestamp: Date.now(),
      };
    }
    
    return null;
  }

  public startGame(): void {
    this.initializeGame();
    this.gameState.state = 'playing';
    
    if (this.worker && this.useWorker) {
      // 使用 Web Worker
      this.worker.postMessage({
        type: 'INIT',
        data: {
          gameState: this.gameState,
          systems: this.systems
        }
      });
    } else {
      // 回退到主線程
      this.gameLoop();
    }
  }

  public pauseGame(): void {
    this.gameState.paused = true;
    this.gameState.state = 'paused';
    
    if (this.worker && this.useWorker) {
      this.worker.postMessage({ type: 'PAUSE' });
    }
  }

  public resumeGame(): void {
    this.gameState.paused = false;
    this.gameState.state = 'playing';
    
    if (this.worker && this.useWorker) {
      this.worker.postMessage({ type: 'RESUME' });
    } else {
      this.gameLoop();
    }
  }

  public restartGame(): void {
    this.initializeGame();
    this.gameState.state = 'playing';
    
    if (this.worker && this.useWorker) {
      this.worker.postMessage({
        type: 'INIT',
        data: {
          gameState: this.gameState,
          systems: this.systems
        }
      });
    } else {
      this.gameLoop();
    }
  }

  public showMenu(): void {
    this.gameState.state = 'menu';
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private initializeGame(): void {
    // 重置遊戲狀態
    this.gameState.winner = null;
    this.gameState.bombs = [];
    this.gameState.powerUps = [];
    this.gameState.explosions = [];
    this.gameState.score = { player1: 0, player2: 0 };
    this.gameState.time = 0;
    this.gameState.paused = false;

    // 生成地圖
    this.gameState.map = this.systems.map.generateMap();
    
    // 創建玩家
    this.gameState.players = [
      this.systems.player.createPlayer(1, 1, 1, '#0000FF'), // 玩家1 - 藍色
      this.systems.player.createPlayer(11, 9, 2, '#FF0000'), // 玩家2 - 紅色
    ];
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
          const powerUp = this.systems.powerUp.generatePowerUpAt(pos.x, pos.y, this.gameState.map);
          if (powerUp) {
            this.gameState.powerUps.push(powerUp);
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
    
    // 檢查碰撞
    this.checkCollisions();
    
    // 更新遊戲時間
    this.gameState.time += deltaTime;
    
    // 檢查遊戲結束條件
    this.checkGameEnd();
  }

  private processInput(): void {
    while (this.inputQueue.length > 0) {
      const input = this.inputQueue.shift()!;
      
      if (this.worker && this.useWorker) {
        // 發送到 Web Worker
        this.worker.postMessage({
          type: 'INPUT',
          data: input
        });
      } else {
        // 主線程處理
        this.handleInput(input);
      }
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
    // 清空畫布
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
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
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }
}

