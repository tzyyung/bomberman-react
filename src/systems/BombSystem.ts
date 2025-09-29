/**
 * 炸彈系統 (BombSystem)
 * 
 * 功能說明：
 * - 管理遊戲中所有炸彈的生命週期
 * - 處理炸彈的放置、爆炸、連鎖爆炸邏輯
 * - 實現炸彈的踢動功能和碰撞檢測
 * - 支持穿透道具的爆炸穿透效果
 * - 提供炸彈的視覺渲染和動畫效果
 * 
 * 主要方法：
 * - placeBomb: 放置新炸彈
 * - updateBombs: 更新所有炸彈狀態
 * - explodeBomb: 處理炸彈爆炸
 * - kickBomb: 踢動炸彈功能
 * - render: 渲染炸彈視覺效果
 */

import { Bomb, Player, MapTile } from '../types'; // 導入類型定義
import { TILE_SIZE, BOMB_TIMER, Direction } from '../constants'; // 導入常數定義

export class BombSystem {
  private bombIdCounter = 0; // 炸彈ID計數器，確保每個炸彈都有唯一ID

  /**
   * 放置炸彈方法
   * 
   * 功能說明：
   * - 檢查玩家是否可以放置炸彈（數量限制、冷卻時間）
   * - 檢查位置是否已有炸彈（避免重疊）
   * - 創建新炸彈並設置所有屬性
   * - 更新地圖格子類型和玩家狀態
   * 
   * @param player 放置炸彈的玩家
   * @param bombs 炸彈數組
   * @param map 地圖數據
   */
  public placeBomb(player: Player, bombs: Bomb[], map: MapTile[][]): void {
    // 檢查玩家炸彈數量是否達到上限
    if (player.bombCount >= player.maxBombs) return;
    
    // 檢查放置冷卻時間，防止快速連續放置（500ms冷卻）
    if (Date.now() - player.lastBombTime < 500) return;
    
    // 檢查玩家當前位置是否已有炸彈，避免重疊放置
    const existingBomb = bombs.find(b => b.gridX === player.gridX && b.gridY === player.gridY);
    if (existingBomb) return;
    
    // 創建新炸彈對象，設置所有必要屬性
    const bomb: Bomb = {
      id: `bomb_${this.bombIdCounter++}`, // 生成唯一ID
      gridX: player.gridX, // 網格X坐標
      gridY: player.gridY, // 網格Y坐標
      pixelX: player.gridX * TILE_SIZE + TILE_SIZE / 2, // 像素X坐標（中心點）
      pixelY: player.gridY * TILE_SIZE + TILE_SIZE / 2, // 像素Y坐標（中心點）
      power: player.bombPower, // 爆炸威力（影響爆炸範圍）
      ownerId: player.id, // 炸彈擁有者ID
      placeTime: Date.now(), // 放置時間戳
      exploded: false, // 是否已爆炸
      chainExplode: false, // 是否連鎖爆炸
      canKick: player.canKick, // 是否可以被踢動
      kicked: false, // 是否正在被踢動
      kickDirection: null, // 踢動方向
      kickSpeed: 2, // 踢動速度
      kickDistance: 0, // 已踢動距離
      maxKickDistance: player.kickCount || 1, // 最大踢動距離（根據踢炸彈道具數量）
      canPierce: player.canPierce, // 是否具有穿透能力
      remote: player.canRemote, // 是否可以被遙控引爆
    };
    
    // 輸出調試信息，記錄炸彈放置
    console.log(`玩家 ${player.id} 放置炸彈，威力: ${bomb.power}`);
    
    // 更新地圖格子類型為炸彈類型（3 = BOMB）
    map[player.gridY][player.gridX].type = 3;
    
    // 將新炸彈添加到炸彈數組
    bombs.push(bomb);
    
    // 增加玩家炸彈計數
    player.bombCount++;
    
    // 更新玩家最後放置炸彈時間
    player.lastBombTime = Date.now();
  }

  /**
   * 更新所有炸彈狀態
   * 
   * 功能說明：
   * - 遍歷所有未爆炸的炸彈
   * - 檢查炸彈是否應該爆炸（時間到或連鎖爆炸）
   * - 處理被踢動炸彈的移動邏輯
   * - 收集所有爆炸位置用於後續處理
   * 
   * @param bombs 炸彈數組
   * @param map 地圖數據
   * @param players 玩家數組
   * @param deltaTime 時間增量（未使用，保留用於未來優化）
   * @returns 所有爆炸位置的數組
   */
  public updateBombs(bombs: Bomb[], map: MapTile[][], players: Player[], deltaTime: number): Array<{x: number, y: number}>[] {
    // 初始化爆炸位置收集數組
    const explosionPositions: Array<{x: number, y: number}>[] = [];
    
    // 遍歷所有炸彈進行狀態更新
    bombs.forEach(bomb => {
      // 跳過已爆炸的炸彈
      if (bomb.exploded) return;
      
      // 檢查炸彈是否應該爆炸
      // 條件1：放置時間超過炸彈計時器（BOMB_TIMER毫秒）
      // 條件2：被標記為連鎖爆炸
      if (Date.now() - bomb.placeTime >= BOMB_TIMER || bomb.chainExplode) {
        // 執行炸彈爆炸邏輯並收集爆炸位置
        const positions = this.explodeBomb(bomb, bombs, map, players);
        explosionPositions.push(positions);
      }
      
      // 如果炸彈正在被踢動，更新其移動狀態
      if (bomb.kicked) {
        this.updateKickedBomb(bomb, map, players);
      }
    });
    
    // 返回所有爆炸位置供其他系統使用
    return explosionPositions;
  }

  /**
   * 處理炸彈爆炸
   * 
   * 功能說明：
   * - 標記炸彈為已爆炸狀態
   * - 恢復地圖格子為空地
   * - 減少玩家炸彈計數
   * - 創建爆炸效果並摧毀軟牆
   * - 檢查並觸發連鎖爆炸
   * 
   * @param bomb 要爆炸的炸彈
   * @param bombs 所有炸彈數組（用於連鎖爆炸檢測）
   * @param map 地圖數據
   * @param players 玩家數組（用於更新炸彈計數）
   * @returns 爆炸位置數組
   */
  private explodeBomb(bomb: Bomb, bombs: Bomb[], map: MapTile[][], players: Player[]): Array<{x: number, y: number}> {
    // 標記炸彈為已爆炸狀態
    bomb.exploded = true;
    
    // 恢復炸彈位置的地圖格子類型為空地（0 = EMPTY）
    map[bomb.gridY][bomb.gridX].type = 0;
    
    // 找到炸彈擁有者並減少其炸彈計數
    const owner = players.find(p => p.id === bomb.ownerId);
    if (owner) {
      // 確保炸彈計數不會小於0
      owner.bombCount = Math.max(0, owner.bombCount - 1);
    }
    
    // 創建爆炸效果，摧毀軟牆並生成道具
    const explosionPositions = this.createExplosion(bomb, map);
    
    // 檢查是否會引發其他炸彈的連鎖爆炸
    this.checkChainExplosion(bomb, bombs, map);
    
    // 返回爆炸位置供其他系統使用
    return explosionPositions;
  }

  /**
   * 創建爆炸效果
   * 
   * 功能說明：
   * - 獲取爆炸範圍內的所有位置
   * - 摧毀爆炸範圍內的軟牆
   * - 在軟牆位置有機率生成道具
   * - 標記道具生成位置供後續處理
   * 
   * @param bomb 爆炸的炸彈
   * @param map 地圖數據
   * @returns 爆炸位置數組
   */
  private createExplosion(bomb: Bomb, map: MapTile[][]): Array<{x: number, y: number}> {
    // 獲取炸彈爆炸範圍內的所有位置（考慮穿透能力）
    const explosionPositions = this.getExplosionPositions(bomb, map);
    
    // 遍歷所有爆炸位置，處理軟牆摧毀和道具生成
    explosionPositions.forEach(pos => {
      // 檢查該位置是否為軟牆（類型2 = SOFT_WALL）
      if (map[pos.y][pos.x].type === 2) {
        // 輸出調試信息，記錄軟牆摧毀
        console.log(`軟牆被摧毀，位置: (${pos.x}, ${pos.y})`);
        
        // 將軟牆位置改為空地（類型0 = EMPTY）
        map[pos.y][pos.x].type = 0;
        
        // 50% 機率在軟牆位置生成道具
        if (Math.random() < 0.5) {
          // 輸出調試信息，記錄道具生成
          console.log(`軟牆爆炸生成道具，位置: (${pos.x}, ${pos.y})`);
          
          // 標記該位置有道具，實際道具生成將在 GameEngine 中處理
          map[pos.y][pos.x].hasPowerUp = true;
        } else {
          // 輸出調試信息，記錄沒有生成道具
          console.log(`軟牆爆炸沒有生成道具，位置: (${pos.x}, ${pos.y})`);
        }
      }
    });
    
    // 返回所有爆炸位置
    return explosionPositions;
  }

  /**
   * 獲取炸彈爆炸範圍內的所有位置
   * 
   * 功能說明：
   * - 計算炸彈爆炸的四個方向範圍
   * - 考慮炸彈的威力和穿透能力
   * - 硬牆始終停止爆炸
   * - 軟牆根據穿透能力決定是否停止爆炸
   * - 返回所有有效的爆炸位置
   * 
   * @param bomb 要計算爆炸範圍的炸彈
   * @param map 地圖數據
   * @returns 爆炸位置數組
   */
  private getExplosionPositions(bomb: Bomb, map: MapTile[][]): Array<{x: number, y: number}> {
    // 初始化爆炸位置數組，包含炸彈本身的位置
    const positions = [{ x: bomb.gridX, y: bomb.gridY }];
    
    // 輸出調試信息，記錄炸彈爆炸的詳細信息
    console.log(`炸彈爆炸，威力: ${bomb.power}，穿透能力: ${bomb.canPierce}，位置: (${bomb.gridX}, ${bomb.gridY})`);
    
    // 定義四個方向的爆炸向量（上、下、左、右）
    const directions = [
      { dx: 0, dy: -1 }, // 向上（Y坐標減少）
      { dx: 0, dy: 1 },  // 向下（Y坐標增加）
      { dx: -1, dy: 0 }, // 向左（X坐標減少）
      { dx: 1, dy: 0 },  // 向右（X坐標增加）
    ];
    
    // 遍歷每個方向，計算爆炸範圍
    directions.forEach(dir => {
      // 從炸彈位置開始，向該方向擴散，距離等於炸彈威力
      for (let i = 1; i <= bomb.power; i++) {
        // 計算當前爆炸位置的坐標
        const x = bomb.gridX + dir.dx * i;
        const y = bomb.gridY + dir.dy * i;
        
        // 檢查是否超出地圖邊界，如果超出則停止該方向的爆炸
        if (x < 0 || x >= map[0].length || y < 0 || y >= map.length) break;
        
        // 獲取該位置的地圖格子信息
        const tile = map[y][x];
        
        // 硬牆（類型1）始終停止爆炸，無論是否有穿透能力
        if (tile.type === 1) break;
        
        // 將該位置添加到爆炸位置數組
        positions.push({ x, y });
        
        // 輸出調試信息，記錄爆炸位置
        console.log(`爆炸位置: (${x}, ${y})`);
        
        // 如果沒有穿透能力，軟牆（類型2）會停止爆炸
        if (tile.type === 2 && !bomb.canPierce) {
          console.log(`軟牆停止爆炸，位置: (${x}, ${y})`);
          break; // 停止該方向的爆炸擴散
        }
        
        // 如果有穿透能力，軟牆不會停止爆炸，繼續擴散
        if (tile.type === 2 && bomb.canPierce) {
          console.log(`穿透軟牆，繼續爆炸，位置: (${x}, ${y})`);
        }
      }
    });
    
    // 輸出調試信息，記錄總爆炸位置數量
    console.log(`總共 ${positions.length} 個爆炸位置`);
    
    // 返回所有爆炸位置
    return positions;
  }

  /**
   * 檢查連鎖爆炸
   * 
   * 功能說明：
   * - 檢查當前爆炸是否會影響其他炸彈
   * - 如果其他炸彈在爆炸範圍內，標記為連鎖爆炸
   * - 連鎖爆炸的炸彈會在下一幀自動爆炸
   * - 實現炸彈的連鎖反應效果
   * 
   * @param bomb 當前爆炸的炸彈
   * @param bombs 所有炸彈數組
   * @param map 地圖數據
   */
  private checkChainExplosion(bomb: Bomb, bombs: Bomb[], map: MapTile[][]): void {
    // 獲取當前炸彈的爆炸範圍
    const explosionPositions = this.getExplosionPositions(bomb, map);
    
    // 遍歷所有其他炸彈，檢查是否在爆炸範圍內
    bombs.forEach(otherBomb => {
      // 跳過自己或已爆炸的炸彈
      if (otherBomb.id === bomb.id || otherBomb.exploded) return;
      
      // 檢查其他炸彈是否在當前爆炸的範圍內
      const isInExplosion = explosionPositions.some(pos => 
        pos.x === otherBomb.gridX && pos.y === otherBomb.gridY
      );
      
      // 如果在爆炸範圍內，標記為連鎖爆炸
      if (isInExplosion) {
        otherBomb.chainExplode = true;
      }
    });
  }

  /**
   * 更新被踢動炸彈的移動狀態
   * 
   * 功能說明：
   * - 處理被踢動炸彈的移動邏輯
   * - 檢查是否達到最大踢動距離
   * - 檢測是否遇到玩家（立即引爆）
   * - 處理炸彈移動的地圖更新
   * - 實現踢動距離限制和碰撞檢測
   * 
   * @param bomb 被踢動的炸彈
   * @param map 地圖數據
   * @param players 玩家數組（用於碰撞檢測）
   */
  private updateKickedBomb(bomb: Bomb, map: MapTile[][], players: Player[]): void {
    // 如果炸彈沒有踢動方向，直接返回
    if (bomb.kickDirection === null) return;
    
    // 獲取炸彈的最大踢動距離（根據踢炸彈道具數量）
    const maxDistance = bomb.maxKickDistance || 1;
    
    // 檢查是否已達到最大踢動距離
    if (bomb.kickDistance >= maxDistance) {
      console.log(`炸彈踢動達到最大距離 ${maxDistance}，停止踢動`);
      // 停止踢動，重置相關狀態
      bomb.kicked = false;
      bomb.kickDirection = null;
      return;
    }
    
    // 計算炸彈的下一個位置（基於踢動方向）
    let newX = bomb.gridX; // 新的X坐標
    let newY = bomb.gridY; // 新的Y坐標
    
    // 根據踢動方向計算新位置
    switch (bomb.kickDirection) {
      case Direction.UP:    // 向上踢動
        newY -= 1;
        break;
      case Direction.DOWN:  // 向下踢動
        newY += 1;
        break;
      case Direction.LEFT:  // 向左踢動
        newX -= 1;
        break;
      case Direction.RIGHT: // 向右踢動
        newX += 1;
        break;
    }
    
    // 輸出調試信息，記錄炸彈移動
    console.log(`炸彈踢動：從 (${bomb.gridX}, ${bomb.gridY}) 到 (${newX}, ${newY})，距離: ${bomb.kickDistance + 1}/${maxDistance}`);
    
    // 檢查目標位置是否有玩家（碰撞檢測）
    const playerAtTarget = players.find(p => p.alive && p.gridX === newX && p.gridY === newY);
    if (playerAtTarget) {
      // 如果遇到玩家，立即引爆炸彈
      console.log(`炸彈踢動遇到玩家 ${playerAtTarget.id}，立即引爆`);
      bomb.chainExplode = true; // 標記為連鎖爆炸
      bomb.kicked = false;      // 停止踢動
      bomb.kickDirection = null; // 清除踢動方向
      return;
    }
    
    // 檢查炸彈是否可以移動到新位置
    if (this.canMoveBombTo(newX, newY, map)) {
      // 恢復原位置的地圖格子類型為空地
      map[bomb.gridY][bomb.gridX].type = 0; // EMPTY
      
      // 更新炸彈的網格位置
      bomb.gridX = newX;
      bomb.gridY = newY;
      
      // 更新炸彈的像素位置（用於渲染）
      bomb.pixelX = newX * TILE_SIZE + TILE_SIZE / 2;
      bomb.pixelY = newY * TILE_SIZE + TILE_SIZE / 2;
      
      // 增加已踢動距離計數
      bomb.kickDistance++;
      
      // 更新新位置的地圖格子類型為炸彈
      map[newY][newX].type = 3; // BOMB
      
      // 輸出調試信息，記錄踢動成功
      console.log(`炸彈踢動成功，距離: ${bomb.kickDistance}/${maxDistance}`);
    } else {
      // 如果無法移動到新位置，停止踢動
      console.log(`炸彈踢動被阻擋，停止踢動`);
      bomb.kicked = false;      // 停止踢動狀態
      bomb.kickDirection = null; // 清除踢動方向
    }
  }

  /**
   * 檢查炸彈是否可以移動到指定位置
   * 
   * 功能說明：
   * - 檢查目標位置是否在地圖範圍內
   * - 檢查目標位置是否為空地
   * - 用於踢動炸彈時的移動驗證
   * 
   * @param x 目標X坐標
   * @param y 目標Y坐標
   * @param map 地圖數據
   * @returns 是否可以移動到該位置
   */
  private canMoveBombTo(x: number, y: number, map: MapTile[][]): boolean {
    // 檢查目標位置是否超出地圖邊界
    if (x < 0 || x >= map[0].length || y < 0 || y >= map.length) return false;
    
    // 獲取目標位置的地圖格子信息
    const tile = map[y][x];
    
    // 只有空地（類型0 = EMPTY）才能放置炸彈
    return tile.type === 0;
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
