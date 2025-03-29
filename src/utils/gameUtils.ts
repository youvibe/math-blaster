// src/utils/gameUtils.ts
import { Problem, GameSettings } from '../types';

// Helper to generate random number within a range based on digits
function getRandomNumber(digits: number): number {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateProblem(
  settings: GameSettings,
  currentId: number
): Problem | null {
  if (settings.operations.length === 0) {
    console.error('No operations selected in settings!');
    return null; // Or handle this case appropriately
  }

  const operation =
    settings.operations[Math.floor(Math.random() * settings.operations.length)];
  let num1 = getRandomNumber(settings.digits);
  let num2 = getRandomNumber(settings.digits);
  let answer: number;
  let text: string;

  switch (operation) {
    case '+':
      answer = num1 + num2;
      text = `${num1} + ${num2} =`;
      break;
    case '-':
      // Ensure non-negative result for simplicity with young kids
      if (num1 < num2) {
        [num1, num2] = [num2, num1]; // Swap them
      }
      answer = num1 - num2;
      text = `${num1} - ${num2} =`;
      break;
    case '*':
      // Maybe start with smaller numbers for multiplication? Adjust digits if needed.
      // For simplicity, let's stick to the digits setting for now.
      answer = num1 * num2;
      text = `${num1} x ${num2} =`;
      break;
    case '/':
      // Ensure whole number division result
      // Generate answer first, then num1
      answer = getRandomNumber(settings.digits > 1 ? settings.digits - 1 : 1); // Keep answer smaller potentially
      if (answer === 0) answer = 1; // Avoid division by zero issues indirectly
      num2 = getRandomNumber(settings.digits);
      if (num2 === 0) num2 = 1; // Avoid division by zero
      num1 = answer * num2;
      // Prevent extremely large num1 if digits setting is high
      if (num1 >= Math.pow(10, settings.digits + 1)) {
        // If num1 gets too big, try regenerating or simplify
        // For now, let's retry generation simply by returning null, caller can retry
        console.warn(
          'Division problem generation resulted in large number, retrying...'
        );
        return null;
      }
      text = `${num1} ÷ ${num2} =`;
      break;
    default:
      throw new Error('Invalid operation');
  }

  return {
    id: currentId, // Use a unique ID generator
    text,
    answer,
    x: Math.random() * 80 + 10, // Random horizontal start (10% to 90%)
    y: -50, // Start above the screen
  };
}
