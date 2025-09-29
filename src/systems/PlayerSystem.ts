/**
 * 玩家系統 (PlayerSystem)
 * 
 * 功能說明：
 * - 管理遊戲中所有玩家的生命週期
 * - 處理玩家的移動、能力更新和狀態管理
 * - 實現玩家與地圖的碰撞檢測
 * - 提供玩家的視覺渲染和動畫效果
 * - 支持多種玩家能力和道具效果
 * 
 * 主要方法：
 * - createPlayer: 創建新玩家
 * - updatePlayers: 更新所有玩家狀態
 * - movePlayer: 處理玩家移動
 * - canMoveTo: 檢查移動可行性
 * - render: 渲染玩家視覺效果
 */

import { Player, MapTile } from '../types'; // 導入類型定義
import { Direction, TILE_SIZE, PLAYER_SPEED } from '../constants'; // 導入常數定義

export class PlayerSystem {
  /**
   * 創建新玩家
   * 
   * 功能說明：
   * - 初始化玩家的所有基本屬性
   * - 設置玩家的初始位置和能力
   * - 配置玩家的外觀和狀態
   * - 為玩家分配唯一ID和顏色
   * 
   * @param x 初始X坐標（網格）
   * @param y 初始Y坐標（網格）
   * @param id 玩家唯一ID
   * @param color 玩家顏色
   * @returns 新創建的玩家對象
   */
  public createPlayer(x: number, y: number, id: number, color: string): Player {
    return {
      id, // 玩家唯一標識符
      alive: true, // 玩家是否存活
      gridX: x, // 網格X坐標
      gridY: y, // 網格Y坐標
      pixelX: x * TILE_SIZE + TILE_SIZE / 2, // 像素X坐標（中心點）
      pixelY: y * TILE_SIZE + TILE_SIZE / 2, // 像素Y坐標（中心點）
      direction: Direction.DOWN, // 初始面向方向（向下）
      speed: PLAYER_SPEED, // 移動速度
      maxBombs: 1, // 最大炸彈數量（初始值）
      bombPower: 1, // 炸彈威力（初始值）
      canKick: false, // 是否可以踢炸彈（初始值）
      kickCount: 0, // 踢炸彈道具數量
      canPierce: false, // 是否具有穿透能力（初始值）
      canRemote: false, // 是否可以遙控引爆（初始值）
      hasShield: false, // 是否有防護罩（初始值）
      shieldEndTime: 0, // 防護罩結束時間
      bombCount: 0, // 當前炸彈數量
      lastBombTime: 0, // 最後放置炸彈時間
      lastKickTime: 0, // 最後踢炸彈時間
      lastRemoteTime: 0, // 最後遙控引爆時間
      color, // 玩家顏色
    };
  }

  /**
   * 更新所有玩家狀態
   * 
   * 功能說明：
   * - 遍歷所有存活的玩家
   * - 更新玩家的能力狀態（如防護罩）
   * - 處理玩家狀態的時效性檢查
   * - 簡化的更新邏輯，專注於能力管理
   * 
   * @param players 玩家數組
   * @param map 地圖數據（未使用，保留用於未來擴展）
   * @param deltaTime 時間增量（未使用，保留用於未來擴展）
   */
  public updatePlayers(players: Player[], map: MapTile[][], deltaTime: number): void {
    // 遍歷所有玩家進行狀態更新
    players.forEach(player => {
      // 跳過已死亡的玩家
      if (!player.alive) return;
      
      // 更新玩家能力狀態（如防護罩時效性）
      this.updatePlayerAbilities(player);
    });
  }

  /**
   * 更新玩家能力狀態
   * 
   * 功能說明：
   * - 檢查防護罩是否過期
   * - 更新玩家的時效性能力
   * - 處理道具效果的持續時間
   * 
   * @param player 要更新的玩家
   */
  private updatePlayerAbilities(player: Player): void {
    // 檢查防護罩是否已過期
    if (player.hasShield && Date.now() > player.shieldEndTime) {
      // 防護罩時間到期，移除防護罩效果
      player.hasShield = false;
    }
  }

  /**
   * 移動玩家
   * 
   * 功能說明：
   * - 處理玩家的移動邏輯
   * - 首先更新玩家面向方向
   * - 檢查移動目標位置是否可行
   * - 實現簡單直接的網格移動
   * - 支持方向更新但不移動的情況
   * 
   * @param player 要移動的玩家
   * @param direction 移動方向
   * @param map 地圖數據（用於碰撞檢測）
   */
  public movePlayer(player: Player, direction: Direction, map: MapTile[][]): void {
    // 檢查玩家是否存活
    if (!player.alive) return;
    
    // 首先更新玩家面向方向，無論是否能移動
    // 這樣玩家可以改變方向但被障礙物阻擋
    player.direction = direction;
    
    // 計算移動目標位置
    let newX = player.gridX; // 目標X坐標
    let newY = player.gridY; // 目標Y坐標
    
    // 根據移動方向計算新位置
    switch (direction) {
      case Direction.UP:    // 向上移動
        newY = player.gridY - 1;
        break;
      case Direction.DOWN:  // 向下移動
        newY = player.gridY + 1;
        break;
      case Direction.LEFT:  // 向左移動
        newX = player.gridX - 1;
        break;
      case Direction.RIGHT: // 向右移動
        newX = player.gridX + 1;
        break;
    }
    
    // 檢查是否可以移動到新位置
    if (this.canMoveTo(newX, newY, map)) {
      // 更新玩家的網格位置
      player.gridX = newX;
      player.gridY = newY;
      
      // 立即更新像素位置，實現簡單直接的移動
      player.pixelX = player.gridX * TILE_SIZE + TILE_SIZE / 2;
      player.pixelY = player.gridY * TILE_SIZE + TILE_SIZE / 2;
      
      // 輸出調試信息，記錄移動成功
      console.log(`玩家 ${player.id} 移動到 (${newX}, ${newY})`);
    } else {
      console.log(`玩家 ${player.id} 無法移動到 (${newX}, ${newY})，但方向已更新為 ${direction}`);
    }
  }

  /**
   * 檢查玩家是否可以移動到指定位置
   * 
   * 功能說明：
   * - 檢查目標位置是否在地圖範圍內
   * - 檢查目標位置是否為可移動的格子類型
   * - 支持空地（EMPTY）和道具（POWERUP）格子
   * - 阻擋硬牆、軟牆、炸彈等障礙物
   * 
   * @param x 目標X坐標
   * @param y 目標Y坐標
   * @param map 地圖數據
   * @returns 是否可以移動到該位置
   */
  private canMoveTo(x: number, y: number, map: MapTile[][]): boolean {
    // 檢查目標位置是否超出地圖邊界
    if (x < 0 || x >= map[0].length || y < 0 || y >= map.length) {
      return false;
    }
    
    // 獲取目標位置的地圖格子信息
    const tile = map[y][x];
    
    // 只有空地（類型0 = EMPTY）和道具（類型5 = POWERUP）可以移動
    return tile.type === 0 || tile.type === 5;
  }

  /**
   * 渲染所有玩家
   * 
   * 功能說明：
   * - 遍歷所有存活的玩家
   * - 調用單個玩家的渲染方法
   * - 處理玩家的視覺效果和動畫
   * 
   * @param ctx Canvas 2D 渲染上下文
   * @param players 玩家數組
   */
  public render(ctx: CanvasRenderingContext2D, players: Player[]): void {
    // 遍歷所有玩家進行渲染
    players.forEach(player => {
      // 跳過已死亡的玩家
      if (!player.alive) return;
      
      // 渲染單個玩家
      this.renderPlayer(ctx, player);
    });
  }

  /**
   * 渲染單個玩家
   * 
   * 功能說明：
   * - 繪製玩家的基本外觀（身體和邊框）
   * - 顯示玩家的面向方向指示器
   * - 渲染特殊效果（如防護罩）
   * - 使用玩家的專屬顏色
   * 
   * @param ctx Canvas 2D 渲染上下文
   * @param player 要渲染的玩家
   */
  private renderPlayer(ctx: CanvasRenderingContext2D, player: Player): void {
    // 計算玩家渲染尺寸（格子大小的60%）
    const size = TILE_SIZE * 0.6;
    
    // 計算玩家渲染位置（居中對齊）
    const x = player.pixelX - size / 2;
    const y = player.pixelY - size / 2;
    
    // 繪製玩家身體（使用玩家專屬顏色）
    ctx.fillStyle = player.color;
    ctx.fillRect(x, y, size, size);
    
    // 繪製玩家邊框（白色邊框）
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
    
    // 繪製方向指示器（顯示玩家面向方向）
    this.renderDirectionIndicator(ctx, player);
    
    // 如果玩家有防護罩，繪製防護罩效果
    if (player.hasShield) {
      this.renderShield(ctx, player);
    }
  }

  /**
   * 渲染玩家方向指示器
   * 
   * 功能說明：
   * - 在玩家身上繪製一個小方塊
   * - 方塊位置表示玩家的面向方向
   * - 幫助玩家和觀察者了解角色朝向
   * - 使用白色方塊作為指示器
   * 
   * @param ctx Canvas 2D 渲染上下文
   * @param player 要渲染方向指示器的玩家
   */
  private renderDirectionIndicator(ctx: CanvasRenderingContext2D, player: Player): void {
    // 獲取玩家中心位置
    const centerX = player.pixelX;
    const centerY = player.pixelY;
    
    // 計算指示器尺寸（格子大小的20%）
    const size = TILE_SIZE * 0.2;
    
    // 設置指示器顏色為白色
    ctx.fillStyle = '#FFFFFF';
    
    // 根據玩家面向方向繪製指示器
    switch (player.direction) {
      case Direction.UP:    // 向上：在玩家上方繪製方塊
        ctx.fillRect(centerX - size/2, centerY - size, size, size);
        break;
      case Direction.DOWN:  // 向下：在玩家下方繪製方塊
        ctx.fillRect(centerX - size/2, centerY, size, size);
        break;
      case Direction.LEFT:  // 向左：在玩家左方繪製方塊
        ctx.fillRect(centerX - size, centerY - size/2, size, size);
        break;
      case Direction.RIGHT: // 向右：在玩家右方繪製方塊
        ctx.fillRect(centerX, centerY - size/2, size, size);
        break;
    }
  }

  /**
   * 渲染玩家防護罩效果
   * 
   * 功能說明：
   * - 在玩家周圍繪製一個圓形邊框
   * - 表示玩家處於無敵狀態
   * - 使用青色圓圈作為防護罩視覺效果
   * - 提供清晰的視覺反饋
   * 
   * @param ctx Canvas 2D 渲染上下文
   * @param player 要渲染防護罩的玩家
   */
  private renderShield(ctx: CanvasRenderingContext2D, player: Player): void {
    // 獲取玩家中心位置
    const centerX = player.pixelX;
    const centerY = player.pixelY;
    
    // 計算防護罩半徑（格子大小的40%）
    const radius = TILE_SIZE * 0.4;
    
    // 設置防護罩樣式
    ctx.strokeStyle = '#00FFFF'; // 青色邊框
    ctx.lineWidth = 3;           // 3像素線寬
    
    // 繪製圓形防護罩
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * 應用道具效果到玩家
   * 
   * 功能說明：
   * - 根據道具類型增強玩家能力
   * - 支持多種道具效果（火力、炸彈、速度等）
   * - 處理時效性道具（如防護罩）
   * - 永久性道具會持續到遊戲結束
   * 
   * @param player 要應用道具效果的玩家
   * @param powerUpType 道具類型（0-6）
   */
  public applyPowerUp(player: Player, powerUpType: number): void {
    // 根據道具類型應用不同的效果
    switch (powerUpType) {
      case 0: // FIRE - 火力道具
        player.bombPower++; // 增加炸彈威力（爆炸範圍）
        break;
      case 1: // BOMB - 炸彈道具
        player.maxBombs++; // 增加最大炸彈數量
        break;
      case 2: // SPEED - 速度道具
        player.speed += 0.5; // 增加移動速度
        break;
      case 3: // KICK - 踢炸彈道具
        player.canKick = true; // 啟用踢炸彈能力
        break;
      case 4: // PIERCE - 穿透道具
        player.canPierce = true; // 啟用穿透能力
        break;
      case 5: // REMOTE - 遙控道具
        player.canRemote = true; // 啟用遙控引爆能力
        break;
      case 6: // SHIELD - 防護罩道具
        player.hasShield = true; // 啟用防護罩
        player.shieldEndTime = Date.now() + 10000; // 設置10秒後過期
        break;
    }
  }
}

