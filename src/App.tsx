import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './GameEngine';
import { GameState } from './types';
import './App.css';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);

  useEffect(() => {
    if (canvasRef.current && !gameEngineRef.current) {
      // 初始化遊戲引擎
      gameEngineRef.current = new GameEngine(canvasRef.current);
      
      // 設置遊戲狀態更新回調
      const updateGameState = () => {
        if (gameEngineRef.current) {
          const state = gameEngineRef.current.getGameState();
          setGameState(state);
        }
      };

      // 定期更新遊戲狀態
      const interval = setInterval(updateGameState, 100);
      
      return () => {
        clearInterval(interval);
        if (gameEngineRef.current) {
          gameEngineRef.current.destroy();
        }
      };
    }
  }, []);

  const handleStartGame = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.startGame();
      setIsGameStarted(true);
    }
  };

  const handlePauseGame = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.pauseGame();
    }
  };

  const handleResumeGame = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.resumeGame();
    }
  };

  const handleRestartGame = () => {
    console.log('重新開始按鈕被點擊');
    if (gameEngineRef.current) {
      console.log('調用 restartGame');
      gameEngineRef.current.restartGame();
      setIsGameStarted(true); // 確保遊戲狀態正確
      console.log('重新開始完成');
    } else {
      console.log('gameEngineRef.current 為 null');
    }
  };

  const handleShowMenu = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.showMenu();
      setIsGameStarted(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // 阻止瀏覽器默認行為，防止頁面滾動
    event.preventDefault();
    
    if (event.key === 'Escape') {
      if (gameState?.state === 'playing') {
        handlePauseGame();
      } else if (gameState?.state === 'paused') {
        handleResumeGame();
      }
    }
  };

  return (
    <div className="App" onKeyDown={handleKeyDown} tabIndex={0}>
      <header className="App-header">
        <div className="game-container">
          <canvas
            ref={canvasRef}
            width={832}
            height={704}
            style={{ border: '2px solid #333', backgroundColor: '#000' }}
          />
          
          {!isGameStarted && (
            <div className="menu-overlay">
              <div className="menu-content">
                <h2>炸彈超人</h2>
                <p>使用 WASD 和方向鍵控制玩家</p>
                <p>空白鍵和 Enter 鍵放置炸彈</p>
                <p>B 鍵和右 Shift 鍵踢炸彈</p>
                <p>V 鍵和 / 鍵遙控引爆</p>
                <button onClick={handleStartGame} className="start-button">
                  開始遊戲
                </button>
              </div>
            </div>
          )}
          
          {gameState?.state === 'paused' && (
            <div className="menu-overlay">
              <div className="menu-content">
                <h2>遊戲暫停</h2>
                <button onClick={handleResumeGame} className="menu-button">
                  繼續遊戲
                </button>
                <button onClick={handleRestartGame} className="menu-button">
                  重新開始
                </button>
                <button onClick={handleShowMenu} className="menu-button">
                  主選單
                </button>
              </div>
            </div>
          )}
          
          {gameState?.state === 'over' && (
            <div className="menu-overlay">
              <div className="menu-content">
                <h2>遊戲結束</h2>
                {gameState.winner ? (
                  <p>玩家 {gameState.winner} 獲勝！</p>
                ) : (
                  <p>平局！</p>
                )}
                <button onClick={handleRestartGame} className="menu-button">
                  再玩一次
                </button>
                <button onClick={handleShowMenu} className="menu-button">
                  主選單
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="controls-info">
          <h3>遊戲控制</h3>
          <div className="control-section">
            <h4>玩家 1 (藍色)</h4>
            <p>移動: W A S D</p>
            <p>炸彈: 空白鍵</p>
            <p>踢炸彈: B 鍵</p>
            <p>遙控: V 鍵</p>
          </div>
          <div className="control-section">
            <h4>玩家 2 (紅色)</h4>
            <p>移動: 方向鍵</p>
            <p>炸彈: Enter 鍵</p>
            <p>踢炸彈: 右 Shift 鍵</p>
            <p>遙控: / 鍵</p>
          </div>
          <div className="control-section">
            <h4>通用</h4>
            <p>暫停/繼續: ESC 鍵</p>
          </div>
        </div>
      </header>
    </div>
  );
};

export default App;