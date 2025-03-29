// src/types.ts
export type Operation = '+' | '-' | '*' | '/';

export interface Problem {
  id: number;
  text: string; // e.g., "5 + 3 ="
  answer: number;
  x: number; // Horizontal position (percentage)
  y: number; // Vertical position (pixels)
}

export interface GameSettings {
  digits: number;
  operations: Operation[];
  initialSpeed: number; // Pixels per frame/tick
  speedIncrement: number; // How much speed increases over time or score
}

export type GameStatus = 'idle' | 'playing' | 'gameOver';
