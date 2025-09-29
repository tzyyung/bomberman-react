/**
 * 炸彈人遊戲主應用組件 (App)
 * 
 * 功能說明：
 * - 管理整個 React 應用程序的生命週期
 * - 協調遊戲引擎和 UI 組件的交互
 * - 處理用戶輸入和遊戲狀態更新
 * - 提供遊戲控制界面和菜單系統
 * - 管理 Canvas 元素和遊戲渲染
 * 
 * 主要功能：
 * - 遊戲引擎初始化和銷毀
 * - 遊戲狀態管理和更新
 * - 用戶輸入處理（鍵盤、滑鼠）
 * - 遊戲控制（開始、暫停、重新開始）
 * - UI 狀態切換和渲染
 */

import React, { useEffect, useRef, useState } from 'react'; // React 核心 hooks
import { GameEngine } from './GameEngine'; // 遊戲引擎
import { GameState } from './types'; // 遊戲狀態類型
import './App.css'; // 應用樣式

const App: React.FC = () => {
  // Canvas 元素的引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 遊戲引擎實例的引用
  const gameEngineRef = useRef<GameEngine | null>(null);
  // 當前遊戲狀態
  const [gameState, setGameState] = useState<GameState | null>(null);
  // 遊戲是否已開始的狀態
  const [isGameStarted, setIsGameStarted] = useState(false);

  /**
   * 組件掛載時初始化遊戲引擎
   * 
   * 功能說明：
   * - 創建遊戲引擎實例
   * - 設置遊戲狀態更新回調
   * - 定期更新 UI 狀態
   * - 組件卸載時清理資源
   */
  useEffect(() => {
    // 檢查 Canvas 元素是否存在且遊戲引擎未初始化
    if (canvasRef.current && !gameEngineRef.current) {
      // 初始化遊戲引擎，傳入 Canvas 元素
      gameEngineRef.current = new GameEngine(canvasRef.current);
      
      // 設置遊戲狀態更新回調函數
      const updateGameState = () => {
        if (gameEngineRef.current) {
          // 獲取當前遊戲狀態
          const state = gameEngineRef.current.getGameState();
          // 更新 React 狀態，觸發重新渲染
          setGameState(state);
        }
      };

      // 設置定期更新遊戲狀態（每100毫秒）
      const interval = setInterval(updateGameState, 100);
      
      // 組件卸載時的清理函數
      return () => {
        clearInterval(interval); // 清除定時器
        if (gameEngineRef.current) {
          gameEngineRef.current.destroy(); // 銷毀遊戲引擎
        }
      };
    }
  }, []); // 空依賴數組，只在組件掛載時執行一次

  /**
   * 開始遊戲處理函數
   * 
   * 功能說明：
   * - 調用遊戲引擎的開始遊戲方法
   * - 更新 UI 狀態為遊戲已開始
   * - 確保遊戲引擎存在才執行
   */
  const handleStartGame = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.startGame(); // 開始遊戲
      setIsGameStarted(true); // 更新 UI 狀態
    }
  };

  /**
   * 暫停遊戲處理函數
   * 
   * 功能說明：
   * - 調用遊戲引擎的暫停遊戲方法
   * - 暫停遊戲循環和更新
   * - 確保遊戲引擎存在才執行
   */
  const handlePauseGame = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.pauseGame(); // 暫停遊戲
    }
  };

  /**
   * 繼續遊戲處理函數
   * 
   * 功能說明：
   * - 調用遊戲引擎的繼續遊戲方法
   * - 恢復遊戲循環和更新
   * - 確保遊戲引擎存在才執行
   */
  const handleResumeGame = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.resumeGame(); // 繼續遊戲
    }
  };

  /**
   * 重新開始遊戲處理函數
   * 
   * 功能說明：
   * - 調用遊戲引擎的重新開始方法
   * - 重置遊戲狀態和 UI
   * - 提供調試信息
   * - 確保遊戲狀態正確更新
   */
  const handleRestartGame = () => {
    console.log('重新開始按鈕被點擊');
    if (gameEngineRef.current) {
      console.log('調用 restartGame');
      gameEngineRef.current.restartGame(); // 重新開始遊戲
      setIsGameStarted(true); // 確保遊戲狀態正確
      console.log('重新開始完成');
    } else {
      console.log('gameEngineRef.current 為 null');
    }
  };

  /**
   * 顯示主菜單處理函數
   * 
   * 功能說明：
   * - 調用遊戲引擎的顯示菜單方法
   * - 更新 UI 狀態為未開始
   * - 返回主菜單界面
   */
  const handleShowMenu = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.showMenu(); // 顯示主菜單
      setIsGameStarted(false); // 更新 UI 狀態
    }
  };

  /**
   * 鍵盤按下事件處理函數
   * 
   * 功能說明：
   * - 處理全局鍵盤輸入
   * - 支持 ESC 鍵暫停/繼續遊戲
   * - 支持 R 鍵重新開始遊戲
   * - 阻止瀏覽器默認行為
   * 
   * @param event 鍵盤事件對象
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // 阻止瀏覽器默認行為，防止頁面滾動
    event.preventDefault();
    
    // 處理 ESC 鍵：暫停/繼續遊戲
    if (event.key === 'Escape') {
      if (gameState?.state === 'playing') {
        handlePauseGame(); // 暫停遊戲
      } else if (gameState?.state === 'paused') {
        handleResumeGame(); // 繼續遊戲
      }
    }
    
    // 添加 R 鍵重新開始功能
    if (event.key === 'r' || event.key === 'R') {
      if (gameState?.state === 'over' || gameState?.state === 'paused') {
        console.log('R 鍵重新開始被觸發');
        handleRestartGame();
      }
    }
  };

  return (
    <div className="App" onKeyDown={handleKeyDown} tabIndex={0}>
      <header className="App-header">
        <div className="game-container">
          {/* 左側玩家1按鍵提示 */}
          <div className="player-controls-left">
            <div className="control-panel player1-panel">
              <h3>玩家 1 (藍色)</h3>
              <div className="control-grid">
                <div className="control-item">
                  <span className="key">W</span>
                  <span className="action">向上</span>
                </div>
                <div className="control-item">
                  <span className="key">A</span>
                  <span className="action">向左</span>
                </div>
                <div className="control-item">
                  <span className="key">S</span>
                  <span className="action">向下</span>
                </div>
                <div className="control-item">
                  <span className="key">D</span>
                  <span className="action">向右</span>
                </div>
                <div className="control-item">
                  <span className="key">空白鍵</span>
                  <span className="action">放置炸彈</span>
                </div>
                <div className="control-item">
                  <span className="key">B</span>
                  <span className="action">踢炸彈</span>
                </div>
                <div className="control-item">
                  <span className="key">V</span>
                  <span className="action">遙控引爆</span>
                </div>
              </div>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={832}
            height={704}
            style={{ border: '2px solid #333', backgroundColor: '#000' }}
          />

          {/* 右側玩家2按鍵提示 */}
          <div className="player-controls-right">
            <div className="control-panel player2-panel">
              <h3>玩家 2 (紅色)</h3>
              <div className="control-grid">
                <div className="control-item">
                  <span className="key">↑</span>
                  <span className="action">向上</span>
                </div>
                <div className="control-item">
                  <span className="key">←</span>
                  <span className="action">向左</span>
                </div>
                <div className="control-item">
                  <span className="key">↓</span>
                  <span className="action">向下</span>
                </div>
                <div className="control-item">
                  <span className="key">→</span>
                  <span className="action">向右</span>
                </div>
                <div className="control-item">
                  <span className="key">Enter</span>
                  <span className="action">放置炸彈</span>
                </div>
                <div className="control-item">
                  <span className="key">右 Shift</span>
                  <span className="action">踢炸彈</span>
                </div>
                <div className="control-item">
                  <span className="key">/</span>
                  <span className="action">遙控引爆</span>
                </div>
              </div>
            </div>
          </div>
          
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
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('重新開始按鈕被點擊 (暫停菜單)');
                    handleRestartGame();
                  }} 
                  className="menu-button"
                >
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
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('再玩一次按鈕被點擊 (遊戲結束菜單)');
                    handleRestartGame();
                  }} 
                  className="menu-button"
                >
                  再玩一次
                </button>
                <button onClick={handleShowMenu} className="menu-button">
                  主選單
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* 通用控制說明 */}
        <div className="controls-info">
          <h3>通用控制</h3>
          <div className="control-section">
            <p>暫停/繼續: ESC 鍵</p>
            <p>重新開始: R 鍵</p>
          </div>
        </div>
      </header>
    </div>
  );
};

export default App;