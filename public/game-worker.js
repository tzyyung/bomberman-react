/**
 * 遊戲邏輯 Web Worker
 * 處理遊戲狀態更新，避免 UI 卡頓
 */

// 遊戲狀態
let gameState = null;
let systems = null;
let lastTime = 0;

// 消息處理
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'INIT':
      initGame(data);
      break;
    case 'UPDATE':
      updateGame(data.deltaTime);
      break;
    case 'INPUT':
      handleInput(data);
      break;
    case 'PAUSE':
      pauseGame();
      break;
    case 'RESUME':
      resumeGame();
      break;
  }
};

function initGame(data) {
  gameState = data.gameState;
  systems = data.systems;
  lastTime = performance.now();
  
  // 開始遊戲循環
  gameLoop();
}

function gameLoop() {
  const currentTime = performance.now();
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  
  if (gameState && !gameState.paused) {
    updateGame(deltaTime);
  }
  
  // 發送更新後的遊戲狀態
  self.postMessage({
    type: 'GAME_UPDATE',
    gameState: gameState
  });
  
  // 繼續下一幀
  requestAnimationFrame(gameLoop);
}

function updateGame(deltaTime) {
  if (!gameState || gameState.paused) return;
  
  // 更新玩家
  updatePlayers(deltaTime);
  
  // 更新炸彈
  updateBombs(deltaTime);
  
  // 更新爆炸
  updateExplosions(deltaTime);
  
  // 更新道具
  updatePowerUps(deltaTime);
  
  // 檢查碰撞
  checkCollisions();
  
  // 更新遊戲時間
  gameState.time += deltaTime;
}

function updatePlayers(deltaTime) {
  gameState.players.forEach(player => {
    if (!player.alive) return;
    
    // 平滑移動到目標位置
    const targetX = player.gridX * 32 + 16; // TILE_SIZE = 32
    const targetY = player.gridY * 32 + 16;
    
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
    
    // 更新防護罩狀態
    if (player.hasShield && Date.now() > player.shieldEndTime) {
      player.hasShield = false;
    }
  });
}

function updateBombs(deltaTime) {
  const explosionPositions = [];
  
  gameState.bombs.forEach(bomb => {
    if (bomb.exploded) return;
    
    // 檢查是否應該爆炸
    if (Date.now() - bomb.placeTime >= 3000 || bomb.chainExplode) { // BOMB_TIMER = 3000
      const positions = explodeBomb(bomb);
      explosionPositions.push(positions);
    }
    
    // 更新踢炸彈移動
    if (bomb.kicked) {
      updateKickedBomb(bomb);
    }
  });
  
  // 創建爆炸效果和道具
  explosionPositions.forEach(positions => {
    positions.forEach(pos => {
      // 創建爆炸效果
      const explosion = {
        id: `explosion_${Date.now()}_${Math.random()}`,
        gridX: pos.x,
        gridY: pos.y,
        pixelX: pos.x * 32 + 16,
        pixelY: pos.y * 32 + 16,
        startTime: Date.now(),
        duration: 500, // EXPLOSION_DURATION
        finished: false,
        direction: null,
      };
      gameState.explosions.push(explosion);
      
      // 檢查是否需要生成道具
      if (gameState.map[pos.y][pos.x].hasPowerUp) {
        const powerUp = generatePowerUpAt(pos.x, pos.y);
        if (powerUp) {
          gameState.powerUps.push(powerUp);
        }
        gameState.map[pos.y][pos.x].hasPowerUp = false;
      }
    });
  });
  
  // 清理已爆炸的炸彈
  gameState.bombs = gameState.bombs.filter(bomb => !bomb.exploded);
}

function explodeBomb(bomb) {
  bomb.exploded = true;
  
  // 減少玩家炸彈計數
  const owner = gameState.players.find(p => p.id === bomb.ownerId);
  if (owner) {
    owner.bombCount = Math.max(0, owner.bombCount - 1);
  }
  
  // 創建爆炸效果
  const explosionPositions = getExplosionPositions(bomb);
  
  explosionPositions.forEach(pos => {
    // 摧毀軟牆
    if (gameState.map[pos.y][pos.x].type === 2) { // SOFT_WALL
      gameState.map[pos.y][pos.x].type = 0; // EMPTY
      
      // 30% 機率生成道具
      if (Math.random() < 0.3) {
        gameState.map[pos.y][pos.x].hasPowerUp = true;
      }
    }
  });
  
  // 檢查連鎖爆炸
  checkChainExplosion(bomb, explosionPositions);
  
  return explosionPositions;
}

function getExplosionPositions(bomb) {
  const positions = [{ x: bomb.gridX, y: bomb.gridY }];
  
  // 四個方向的爆炸
  const directions = [
    { dx: 0, dy: -1 }, // 上
    { dx: 0, dy: 1 },  // 下
    { dx: -1, dy: 0 }, // 左
    { dx: 1, dy: 0 }   // 右
  ];
  
  directions.forEach(dir => {
    for (let i = 1; i <= bomb.power; i++) {
      const x = bomb.gridX + dir.dx * i;
      const y = bomb.gridY + dir.dy * i;
      
      if (x < 0 || x >= gameState.map[0].length || y < 0 || y >= gameState.map.length) {
        break;
      }
      
      const tile = gameState.map[y][x];
      if (tile.type === 1) { // HARD_WALL
        break;
      }
      
      positions.push({ x, y });
      
      if (tile.type === 2) { // SOFT_WALL
        break;
      }
    }
  });
  
  return positions;
}

function checkChainExplosion(bomb, explosionPositions) {
  gameState.bombs.forEach(otherBomb => {
    if (otherBomb.id === bomb.id || otherBomb.exploded) return;
    
    const isInExplosion = explosionPositions.some(pos => 
      pos.x === otherBomb.gridX && pos.y === otherBomb.gridY
    );
    
    if (isInExplosion) {
      otherBomb.chainExplode = true;
    }
  });
}

function updateKickedBomb(bomb) {
  if (!bomb.kicked || !bomb.kickDirection) return;
  
  const speed = bomb.kickSpeed || 2;
  const dx = bomb.kickDirection === 2 ? -speed : bomb.kickDirection === 3 ? speed : 0; // LEFT/RIGHT
  const dy = bomb.kickDirection === 0 ? -speed : bomb.kickDirection === 1 ? speed : 0; // UP/DOWN
  
  bomb.pixelX += dx;
  bomb.pixelY += dy;
  
  // 更新網格位置
  const newGridX = Math.floor(bomb.pixelX / 32);
  const newGridY = Math.floor(bomb.pixelY / 32);
  
  if (newGridX !== bomb.gridX || newGridY !== bomb.gridY) {
    bomb.gridX = newGridX;
    bomb.gridY = newGridY;
    
    // 檢查碰撞
    if (newGridX < 0 || newGridX >= gameState.map[0].length || 
        newGridY < 0 || newGridY >= gameState.map.length ||
        gameState.map[newGridY][newGridX].type !== 0) {
      bomb.kicked = false;
      bomb.kickDirection = null;
    }
  }
}

function updateExplosions(deltaTime) {
  gameState.explosions = gameState.explosions.filter(explosion => {
    explosion.duration -= deltaTime;
    return explosion.duration > 0;
  });
}

function updatePowerUps(deltaTime) {
  // 移除已收集的道具
  for (let i = gameState.powerUps.length - 1; i >= 0; i--) {
    if (gameState.powerUps[i].collected) {
      gameState.powerUps.splice(i, 1);
    }
  }
}

function generatePowerUpAt(x, y) {
  if (x < 0 || x >= gameState.map[0].length || y < 0 || y >= gameState.map.length) return null;
  
  const tile = gameState.map[y][x];
  if (tile.type !== 0 || tile.hasPowerUp) return null;
  
  // 隨機選擇道具類型
  const powerUpTypes = [0, 1, 2, 3, 4, 5, 6];
  const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
  
  const powerUp = {
    id: `powerup_${Date.now()}_${Math.random()}`,
    gridX: x,
    gridY: y,
    pixelX: x * 32 + 16,
    pixelY: y * 32 + 16,
    type,
    collected: false,
  };
  
  tile.hasPowerUp = true;
  tile.powerUpType = type;
  
  return powerUp;
}

function checkCollisions() {
  // 檢查玩家與爆炸的碰撞
  gameState.players.forEach(player => {
    if (!player.alive) return;
    
    gameState.explosions.forEach(explosion => {
      if (isColliding(player, explosion)) {
        if (!player.hasShield) {
          player.alive = false;
        }
      }
    });
  });
  
  // 檢查玩家與道具的碰撞
  gameState.players.forEach(player => {
    if (!player.alive) return;
    
    gameState.powerUps.forEach(powerUp => {
      if (!powerUp.collected && isColliding(player, powerUp)) {
        collectPowerUp(player, powerUp);
      }
    });
  });
}

function isColliding(obj1, obj2) {
  const distance = Math.sqrt(
    Math.pow(obj1.pixelX - obj2.pixelX, 2) + 
    Math.pow(obj1.pixelY - obj2.pixelY, 2)
  );
  return distance < 20; // 碰撞距離
}

function collectPowerUp(player, powerUp) {
  if (powerUp.collected) return;
  
  powerUp.collected = true;
  applyPowerUpEffect(player, powerUp.type);
}

function applyPowerUpEffect(player, type) {
  switch (type) {
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
      player.shieldEndTime = Date.now() + 10000;
      break;
  }
}

function handleInput(input) {
  const player = gameState.players.find(p => p.id === input.playerId);
  if (!player || !player.alive) return;

  switch (input.action) {
    case 'move':
      if (input.direction !== undefined) {
        movePlayer(player, input.direction);
      }
      break;
    case 'bomb':
      placeBomb(player);
      break;
    case 'kick':
      kickBomb(player);
      break;
    case 'remote':
      remoteExplode(player);
      break;
  }
}

function movePlayer(player, direction) {
  // 檢查玩家是否已經在移動中
  const targetX = player.gridX * 32 + 16;
  const targetY = player.gridY * 32 + 16;
  const dx = targetX - player.pixelX;
  const dy = targetY - player.pixelY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // 如果玩家還在移動中，不允許新的移動
  if (distance > 2) return;
  
  let newX = player.gridX;
  let newY = player.gridY;
  
  switch (direction) {
    case 0: // UP
      newY = player.gridY - 1;
      break;
    case 1: // DOWN
      newY = player.gridY + 1;
      break;
    case 2: // LEFT
      newX = player.gridX - 1;
      break;
    case 3: // RIGHT
      newX = player.gridX + 1;
      break;
  }
  
  // 檢查是否可以移動到新位置
  if (canMoveTo(newX, newY)) {
    player.gridX = newX;
    player.gridY = newY;
    player.direction = direction;
  }
}

function canMoveTo(x, y) {
  if (x < 0 || x >= gameState.map[0].length || y < 0 || y >= gameState.map.length) {
    return false;
  }
  
  const tile = gameState.map[y][x];
  return tile.type === 0 || tile.type === 5; // EMPTY or POWERUP
}

function placeBomb(player) {
  if (player.bombCount >= player.maxBombs) return;
  
  // 檢查位置是否已有炸彈
  const existingBomb = gameState.bombs.find(bomb => 
    bomb.gridX === player.gridX && bomb.gridY === player.gridY && !bomb.exploded
  );
  
  if (existingBomb) return;
  
  const bomb = {
    id: `bomb_${Date.now()}_${Math.random()}`,
    gridX: player.gridX,
    gridY: player.gridY,
    pixelX: player.pixelX,
    pixelY: player.pixelY,
    power: player.bombPower,
    ownerId: player.id,
    placeTime: Date.now(),
    exploded: false,
    chainExplode: false,
    canKick: player.canKick,
    kicked: false,
    kickDirection: null,
    kickSpeed: 0,
    kickDistance: 0,
    playerLeft: false,
  };
  
  gameState.bombs.push(bomb);
  player.bombCount++;
  player.lastBombTime = Date.now();
}

function kickBomb(player) {
  if (!player.canKick) return;
  
  const bomb = gameState.bombs.find(bomb => 
    bomb.gridX === player.gridX && bomb.gridY === player.gridY && 
    !bomb.exploded && !bomb.kicked
  );
  
  if (!bomb) return;
  
  bomb.kicked = true;
  bomb.kickDirection = player.direction;
  bomb.kickSpeed = 2;
  bomb.playerLeft = true;
}

function remoteExplode(player) {
  if (!player.canRemote) return;
  
  const bomb = gameState.bombs.find(bomb => 
    bomb.ownerId === player.id && !bomb.exploded
  );
  
  if (bomb) {
    bomb.chainExplode = true;
  }
}

function pauseGame() {
  if (gameState) {
    gameState.paused = true;
  }
}

function resumeGame() {
  if (gameState) {
    gameState.paused = false;
    lastTime = performance.now();
  }
}
