/**
 * GameEngine 單元測試
 */

import { GameEngine } from './GameEngine';

// Mock Canvas for testing
const mockCanvas = {
  getContext: jest.fn(() => ({
    fillRect: jest.fn(),
    fillStyle: '',
    strokeRect: jest.fn(),
    lineWidth: 0,
    strokeStyle: '',
    drawImage: jest.fn(),
    fillText: jest.fn(),
    textAlign: '',
    textBaseline: '',
    font: '',
    beginPath: jest.fn(),
    arc: jest.fn(),
    stroke: jest.fn(),
  })),
  width: 832,
  height: 704,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockCanvas.getContext,
});

// Mock document and window
Object.defineProperty(document, 'addEventListener', {
  value: jest.fn(),
});

Object.defineProperty(window, 'addEventListener', {
  value: jest.fn(),
});

Object.defineProperty(window, 'requestAnimationFrame', {
  value: jest.fn((callback) => setTimeout(callback, 16)),
});

describe('GameEngine', () => {
  let gameEngine: GameEngine;
  let mockCanvasElement: HTMLCanvasElement;

  beforeEach(() => {
    mockCanvasElement = mockCanvas as any;
    gameEngine = new GameEngine(mockCanvasElement);
  });

  afterEach(() => {
    gameEngine.destroy();
  });

  test('should initialize with menu state', () => {
    const gameState = gameEngine.getGameState();
    expect(gameState.state).toBe('menu');
    expect(gameState.players).toHaveLength(0);
    expect(gameState.bombs).toHaveLength(0);
  });

  test('should start game successfully', () => {
    gameEngine.startGame();
    const gameState = gameEngine.getGameState();
    
    expect(gameState.state).toBe('playing');
    expect(gameState.players).toHaveLength(2);
    expect(gameState.map).toBeDefined();
  });


  test('should restart game', () => {
    gameEngine.startGame();
    const initialState = gameEngine.getGameState();
    
    gameEngine.restartGame();
    const restartedState = gameEngine.getGameState();
    
    expect(restartedState.state).toBe('playing');
    expect(restartedState.players).toHaveLength(2);
    expect(restartedState.bombs).toHaveLength(0);
  });

  test('should show menu', () => {
    gameEngine.startGame();
    gameEngine.showMenu();
    
    const gameState = gameEngine.getGameState();
    expect(gameState.state).toBe('menu');
  });
});
