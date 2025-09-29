/**
 * 軟牆爆炸道具生成調試腳本
 * 用於驗證軟牆爆炸時的道具生成邏輯
 */

// 模擬地圖格子類型
const TileType = {
  EMPTY: 0,
  HARD_WALL: 1,
  SOFT_WALL: 2,
  BOMB: 3,
  EXPLOSION: 4,
  POWERUP: 5
};

// 模擬地圖格子
class MapTile {
  constructor(type = TileType.EMPTY) {
    this.type = type;
    this.hasPowerUp = false;
    this.powerUpType = null;
  }
}

// 模擬炸彈
class Bomb {
  constructor(x, y, power = 1) {
    this.gridX = x;
    this.gridY = y;
    this.power = power;
    this.exploded = false;
  }
}

// 模擬道具
class PowerUp {
  constructor(x, y, type = 0) {
    this.id = `powerup_${Date.now()}_${Math.random()}`;
    this.gridX = x;
    this.gridY = y;
    this.pixelX = x * 32 + 16;
    this.pixelY = y * 32 + 16;
    this.type = type;
    this.collected = false;
  }
}

// 創建測試地圖
function createTestMap() {
  const map = [];
  for (let y = 0; y < 10; y++) {
    map[y] = [];
    for (let x = 0; x < 10; x++) {
      if (x === 0 || x === 9 || y === 0 || y === 9) {
        // 邊界硬牆
        map[y][x] = new MapTile(TileType.HARD_WALL);
      } else if (x % 2 === 0 && y % 2 === 0) {
        // 硬牆
        map[y][x] = new MapTile(TileType.HARD_WALL);
      } else if (Math.random() < 0.3) {
        // 30% 機率生成軟牆
        map[y][x] = new MapTile(TileType.SOFT_WALL);
      } else {
        // 空地
        map[y][x] = new MapTile(TileType.EMPTY);
      }
    }
  }
  return map;
}

// 模擬炸彈爆炸位置計算
function getExplosionPositions(bomb, map) {
  const positions = [{ x: bomb.gridX, y: bomb.gridY }];
  
  console.log(`炸彈爆炸，威力: ${bomb.power}，位置: (${bomb.gridX}, ${bomb.gridY})`);
  
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
      
      if (x < 0 || x >= map[0].length || y < 0 || y >= map.length) break;
      
      const tile = map[y][x];
      if (tile.type === TileType.HARD_WALL) break; // 硬牆阻擋
      
      positions.push({ x, y });
      console.log(`爆炸位置: (${x}, ${y})`);
      
      if (tile.type === TileType.SOFT_WALL) break; // 軟牆阻擋
    }
  });
  
  console.log(`總共 ${positions.length} 個爆炸位置`);
  return positions;
}

// 模擬軟牆爆炸道具生成
function createExplosion(bomb, map) {
  const explosionPositions = getExplosionPositions(bomb, map);
  const powerUps = [];
  
  explosionPositions.forEach(pos => {
    // 摧毀軟牆
    if (map[pos.y][pos.x].type === TileType.SOFT_WALL) {
      console.log(`軟牆被摧毀，位置: (${pos.x}, ${pos.y})`);
      map[pos.y][pos.x].type = TileType.EMPTY;
      
      // 50% 機率生成道具
      if (Math.random() < 0.5) {
        console.log(`軟牆爆炸生成道具，位置: (${pos.x}, ${pos.y})`);
        map[pos.y][pos.x].hasPowerUp = true;
        
        // 生成道具
        const powerUp = new PowerUp(pos.x, pos.y, Math.floor(Math.random() * 7));
        powerUps.push(powerUp);
        console.log(`道具生成成功，類型: ${powerUp.type}，ID: ${powerUp.id}`);
      } else {
        console.log(`軟牆爆炸沒有生成道具，位置: (${pos.x}, ${pos.y})`);
      }
    }
  });
  
  return { explosionPositions, powerUps };
}

// 運行測試
function runTest() {
  console.log('🧪 開始軟牆爆炸道具生成測試...\n');
  
  // 創建測試地圖
  const map = createTestMap();
  console.log('📋 測試地圖創建完成');
  
  // 顯示地圖
  console.log('\n🗺️ 測試地圖：');
  for (let y = 0; y < map.length; y++) {
    let row = '';
    for (let x = 0; x < map[y].length; x++) {
      const tile = map[y][x];
      if (tile.type === TileType.HARD_WALL) {
        row += '█';
      } else if (tile.type === TileType.SOFT_WALL) {
        row += '▓';
      } else {
        row += '·';
      }
    }
    console.log(row);
  }
  
  // 統計軟牆數量
  let softWallCount = 0;
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x].type === TileType.SOFT_WALL) {
        softWallCount++;
      }
    }
  }
  console.log(`\n📊 地圖中有 ${softWallCount} 個軟牆`);
  
  // 測試多次爆炸
  const testCount = 5;
  let totalPowerUps = 0;
  let totalSoftWallsDestroyed = 0;
  
  console.log(`\n💥 進行 ${testCount} 次爆炸測試：`);
  
  for (let i = 0; i < testCount; i++) {
    console.log(`\n--- 測試 ${i + 1} ---`);
    
    // 隨機選擇一個空地放置炸彈
    const emptyPositions = [];
    for (let y = 1; y < map.length - 1; y++) {
      for (let x = 1; x < map[y].length - 1; x++) {
        if (map[y][x].type === TileType.EMPTY) {
          emptyPositions.push({ x, y });
        }
      }
    }
    
    if (emptyPositions.length === 0) {
      console.log('❌ 沒有空地放置炸彈');
      continue;
    }
    
    const randomPos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    const bomb = new Bomb(randomPos.x, randomPos.y, 2); // 威力2的炸彈
    
    console.log(`炸彈放置在位置: (${bomb.gridX}, ${bomb.gridY})`);
    
    // 執行爆炸
    const result = createExplosion(bomb, map);
    const powerUps = result.powerUps;
    
    // 統計結果
    const softWallsDestroyed = result.explosionPositions.filter(pos => 
      map[pos.y][pos.x].type === TileType.EMPTY && 
      map[pos.y][pos.x].hasPowerUp
    ).length;
    
    totalSoftWallsDestroyed += softWallsDestroyed;
    totalPowerUps += powerUps.length;
    
    console.log(`摧毀軟牆: ${softWallsDestroyed} 個`);
    console.log(`生成道具: ${powerUps.length} 個`);
    
    if (powerUps.length > 0) {
      powerUps.forEach(powerUp => {
        console.log(`  - 道具類型: ${powerUp.type}，位置: (${powerUp.gridX}, ${powerUp.gridY})`);
      });
    }
  }
  
  // 統計結果
  console.log('\n📈 測試結果統計：');
  console.log(`總共摧毀軟牆: ${totalSoftWallsDestroyed} 個`);
  console.log(`總共生成道具: ${totalPowerUps} 個`);
  
  if (totalSoftWallsDestroyed > 0) {
    const powerUpRate = (totalPowerUps / totalSoftWallsDestroyed * 100).toFixed(1);
    console.log(`道具生成率: ${powerUpRate}%`);
    
    if (powerUpRate >= 30 && powerUpRate <= 70) {
      console.log('✅ 道具生成率在合理範圍內 (30%-70%)');
    } else {
      console.log('❌ 道具生成率不在合理範圍內');
    }
  } else {
    console.log('❌ 沒有摧毀任何軟牆');
  }
  
  console.log('\n🎯 測試完成！');
}

// 運行測試
runTest();
