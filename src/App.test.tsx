import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

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
};

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockCanvas.getContext,
});

test('renders bomberman game', () => {
  render(<App />);
  const gameTitle = screen.getByText(/炸彈超人 React 版/i);
  expect(gameTitle).toBeInTheDocument();
});
