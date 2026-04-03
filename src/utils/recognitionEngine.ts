/**
 * Recognition Engine for ShapeDraw
 * Ports the template matching algorithm from the original prototype
 */
import { recognize as tesseractRecognize } from 'tesseract.js';

export const GRID_SIZE = 28;

export type GridState = boolean[][];

export interface RecognitionResult {
  letter: string;
  confidence: number;
}

// Memory-cached templates
const templates: Record<string, GridState> = {};

function generateTemplateForLetter(letter: string): GridState {
  const template: GridState = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
  const upper = Math.floor(GRID_SIZE * 0.22);
  const lower = Math.floor(GRID_SIZE * 0.78);
  const leftBound = Math.floor(GRID_SIZE * 0.28);
  const rightBound = Math.floor(GRID_SIZE * 0.72);
  const midRow = Math.floor(GRID_SIZE * 0.5);
  const midCol = Math.floor(GRID_SIZE * 0.5);

  switch (letter) {
    case 'A':
      for (let row = upper; row <= lower; row++) {
        const leftCol = leftBound - Math.floor((row - upper) * 0.25);
        const rightCol = rightBound + Math.floor((row - upper) * 0.25);
        if (leftCol >= 2) template[row][leftCol] = true;
        if (rightCol < GRID_SIZE - 2) template[row][rightCol] = true;
      }
      for (let c = leftBound + 2; c <= rightBound - 2; c++) template[Math.floor(GRID_SIZE * 0.45)][c] = true;
      break;
    case 'B':
      for (let r = upper; r <= lower; r++) { template[r][leftBound] = true; }
      for (let r = upper; r <= upper + 8; r++) { template[r][leftBound + 5] = true; }
      for (let r = lower - 8; r <= lower; r++) { template[r][leftBound + 5] = true; }
      for (let c = leftBound; c <= leftBound + 5; c++) { template[upper][c] = true; template[lower][c] = true; }
      break;
    case 'C':
      for (let r = upper; r <= lower; r++) { template[r][leftBound] = true; }
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; template[lower][c] = true; }
      break;
    case 'D':
      for (let r = upper; r <= lower; r++) { template[r][leftBound] = true; template[r][rightBound - 3] = true; }
      for (let c = leftBound; c <= rightBound - 3; c++) { template[upper][c] = true; template[lower][c] = true; }
      break;
    case 'E':
      for (let r = upper; r <= lower; r++) { template[r][leftBound] = true; }
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; template[midRow][c] = true; template[lower][c] = true; }
      break;
    case 'F':
      for (let r = upper; r <= lower; r++) { template[r][leftBound] = true; }
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; template[midRow][c] = true; }
      break;
    case 'G':
      for (let r = upper; r <= lower; r++) { template[r][leftBound] = true; }
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; template[lower][c] = true; }
      for (let r = lower - 5; r <= lower; r++) { template[r][rightBound] = true; }
      break;
    case 'H':
      for (let r = upper; r <= lower; r++) { template[r][leftBound] = true; template[r][rightBound] = true; }
      for (let c = leftBound; c <= rightBound; c++) { template[midRow][c] = true; }
      break;
    case 'I':
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; template[lower][c] = true; }
      for (let r = upper; r <= lower; r++) { template[r][midCol] = true; }
      break;
    case 'J':
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; }
      for (let r = upper; r <= lower; r++) { template[r][rightBound] = true; }
      template[lower][midCol] = true;
      break;
    case 'K':
      for (let r = upper; r <= lower; r++) { template[r][leftBound] = true; }
      for (let i = 0; i <= 10; i++) { 
        const r = upper + i; const c = rightBound - i; 
        if (c >= leftBound && r < GRID_SIZE) template[r][c] = true; 
      }
      for (let i = 0; i <= 10; i++) { 
        const r = lower - i; const c = rightBound - i; 
        if (c >= leftBound && r >= 0) template[r][c] = true; 
      }
      break;
    case 'L':
      for (let r = upper; r <= lower; r++) { template[r][leftBound] = true; }
      for (let c = leftBound; c <= rightBound; c++) { template[lower][c] = true; }
      break;
    case 'M':
      for (let r = upper; r <= lower; r++) { template[r][leftBound] = true; template[r][rightBound] = true; }
      for (let i = 0; i <= 9; i++) { 
        const r = upper + i; const c = leftBound + i; 
        if (c < GRID_SIZE) template[r][c] = true; 
      }
      for (let i = 0; i <= 9; i++) { 
        const r = upper + i; const c = rightBound - i; 
        if (c >= 0) template[r][c] = true; 
      }
      break;
    case 'N':
      for (let r = upper; r <= lower; r++) { template[r][leftBound] = true; template[r][rightBound] = true; }
      for (let i = 0; i <= 16; i++) { 
        const r = upper + i; const c = leftBound + i; 
        if (c <= rightBound && r < GRID_SIZE) template[r][c] = true; 
      }
      break;
    case 'O':
      for (let r = upper; r <= lower; r++) { template[r][leftBound] = true; template[r][rightBound] = true; }
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; template[lower][c] = true; }
      break;
    case 'P':
      for (let r = upper; r <= lower; r++) { template[r][leftBound] = true; }
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; }
      for (let r = upper; r <= upper + 8; r++) { template[r][rightBound - 2] = true; }
      break;
    case 'Q':
      for (let r = upper; r <= lower - 2; r++) { template[r][leftBound] = true; template[r][rightBound] = true; }
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; template[lower - 2][c] = true; }
      template[lower][rightBound - 2] = true; template[lower - 1][rightBound - 1] = true;
      break;
    case 'R':
      for (let r = upper; r <= lower; r++) { template[r][leftBound] = true; }
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; }
      for (let r = upper; r <= upper + 8; r++) { template[r][rightBound - 2] = true; }
      for (let i = 0; i <= 8; i++) { 
        const r = upper + 6 + i; const c = leftBound + 3 + i; 
        if (c < GRID_SIZE && r < GRID_SIZE) template[r][c] = true; 
      }
      break;
    case 'S':
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; template[lower][c] = true; }
      for (let r = upper; r <= upper + 6; r++) { template[r][leftBound] = true; }
      for (let r = lower - 6; r <= lower; r++) { template[r][rightBound] = true; }
      break;
    case 'T':
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; }
      for (let r = upper; r <= lower; r++) { template[r][midCol] = true; }
      break;
    case 'U':
      for (let c = leftBound; c <= rightBound; c++) { template[lower][c] = true; }
      for (let r = upper; r <= lower; r++) { template[r][leftBound] = true; template[r][rightBound] = true; }
      break;
    case 'V':
      for (let i = 0; i <= 16; i++) { 
        const r = upper + i; const cL = leftBound + i; const cR = rightBound - i; 
        if (cL < GRID_SIZE && r < GRID_SIZE) template[r][cL] = true; 
        if (cR >= 0 && r < GRID_SIZE) template[r][cR] = true; 
      }
      break;
    case 'W':
      for (let r = upper; r <= lower; r++) { template[r][leftBound] = true; template[r][rightBound] = true; }
      for (let i = 0; i <= 9; i++) { 
        const r = upper + i; const c = leftBound + 2 * i; 
        if (c < GRID_SIZE && r < GRID_SIZE) template[r][c] = true; 
      }
      for (let i = 0; i <= 9; i++) { 
        const r = upper + i; const c = rightBound - 2 * i; 
        if (c >= 0 && r < GRID_SIZE) template[r][c] = true; 
      }
      break;
    case 'X':
      for (let i = 0; i <= 24; i++) { 
        const r = upper + i; const c1 = leftBound + i; const c2 = rightBound - i; 
        if (c1 < GRID_SIZE && r < GRID_SIZE) template[r][c1] = true; 
        if (c2 >= 0 && r < GRID_SIZE) template[r][c2] = true; 
      }
      break;
    case 'Y':
      for (let i = 0; i <= 10; i++) { 
        const r = upper + i; const cL = leftBound + i; const cR = rightBound - i; 
        if (cL < GRID_SIZE && r < GRID_SIZE) template[r][cL] = true; 
        if (cR >= 0 && r < GRID_SIZE) template[r][cR] = true; 
      }
      for (let r = upper + 11; r <= lower; r++) { template[r][midCol] = true; }
      break;
    case 'Z':
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; template[lower][c] = true; }
      for (let i = 0; i <= 16; i++) { 
        const r = upper + i; const c = rightBound - i; 
        if (c >= leftBound && r < GRID_SIZE) template[r][c] = true; 
      }
      break;
    default: break;
  }
  return template;
}

function generateTemplateForDigit(digit: string): GridState {
  const template: GridState = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
  const upper = Math.floor(GRID_SIZE * 0.2);
  const lower = Math.floor(GRID_SIZE * 0.8);
  const leftBound = Math.floor(GRID_SIZE * 0.25);
  const rightBound = Math.floor(GRID_SIZE * 0.75);
  const midRow = Math.floor(GRID_SIZE * 0.5);
  const midCol = Math.floor(GRID_SIZE * 0.5);

  switch (digit) {
    case '0':
      for (let r = upper; r <= lower; r++) { template[r][leftBound] = true; template[r][rightBound] = true; }
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; template[lower][c] = true; }
      break;
    case '1':
      for (let r = upper; r <= lower; r++) { template[r][midCol] = true; }
      break;
    case '2':
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; template[midRow][c] = true; template[lower][c] = true; }
      for (let r = upper; r <= midRow; r++) { template[r][rightBound] = true; }
      for (let r = midRow; r <= lower; r++) { template[r][leftBound] = true; }
      break;
    case '3':
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; template[midRow][c] = true; template[lower][c] = true; }
      for (let r = upper; r <= lower; r++) { template[r][rightBound] = true; }
      break;
    case '4':
      for (let r = upper; r <= lower; r++) { template[r][rightBound] = true; }
      for (let r = upper; r <= midRow; r++) { template[r][leftBound] = true; }
      for (let c = leftBound; c <= rightBound; c++) { template[midRow][c] = true; }
      break;
    case '5':
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; template[midRow][c] = true; template[lower][c] = true; }
      for (let r = upper; r <= midRow; r++) { template[r][leftBound] = true; }
      for (let r = midRow; r <= lower; r++) { template[r][rightBound] = true; }
      break;
    case '6':
      for (let c = leftBound; c <= rightBound; c++) { template[midRow][c] = true; template[lower][c] = true; }
      for (let r = upper; r <= lower; r++) { template[r][leftBound] = true; }
      for (let r = midRow; r <= lower; r++) { template[r][rightBound] = true; }
      break;
    case '7':
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; }
      for (let r = upper; r <= lower; r++) { template[r][rightBound] = true; }
      break;
    case '8':
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; template[midRow][c] = true; template[lower][c] = true; }
      for (let r = upper; r <= lower; r++) { template[r][leftBound] = true; template[r][rightBound] = true; }
      break;
    case '9':
      for (let c = leftBound; c <= rightBound; c++) { template[upper][c] = true; template[midRow][c] = true; }
      for (let r = upper; r <= lower; r++) { template[r][rightBound] = true; }
      for (let r = upper; r <= midRow; r++) { template[r][leftBound] = true; }
      break;
    default:
      break;
  }

  return template;
}

function generateTemplateForSymbol(symbol: string): GridState {
  const template: GridState = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
  const upper = Math.floor(GRID_SIZE * 0.3);
  const lower = Math.floor(GRID_SIZE * 0.7);
  const leftBound = Math.floor(GRID_SIZE * 0.25);
  const rightBound = Math.floor(GRID_SIZE * 0.75);
  const midRow = Math.floor(GRID_SIZE * 0.5);
  const midCol = Math.floor(GRID_SIZE * 0.5);

  switch (symbol) {
    case '+':
      for (let c = leftBound; c <= rightBound; c++) { template[midRow][c] = true; }
      for (let r = upper; r <= lower; r++) { template[r][midCol] = true; }
      break;
    case '-':
    case '−':
      for (let c = leftBound; c <= rightBound; c++) { template[midRow][c] = true; }
      break;
    case '×':
    case '*':
      for (let i = -6; i <= 6; i++) {
        const r1 = midRow + i;
        const c1 = midCol + i;
        const r2 = midRow + i;
        const c2 = midCol - i;
        if (r1 >= 0 && r1 < GRID_SIZE && c1 >= 0 && c1 < GRID_SIZE) template[r1][c1] = true;
        if (r2 >= 0 && r2 < GRID_SIZE && c2 >= 0 && c2 < GRID_SIZE) template[r2][c2] = true;
      }
      break;
    case '÷':
    case '/':
      for (let c = leftBound; c <= rightBound; c++) { template[midRow][c] = true; }
      template[upper][midCol] = true;
      template[lower][midCol] = true;
      break;
    case '=':
      for (let c = leftBound; c <= rightBound; c++) {
        template[midRow - 2][c] = true;
        template[midRow + 2][c] = true;
      }
      break;
    default:
      break;
  }

  return template;
}

export function initEngine() {
  for (let ch = 65; ch <= 90; ch++) {
    const letter = String.fromCharCode(ch);
    templates[letter] = generateTemplateForLetter(letter);
  }

  for (let ch = 97; ch <= 122; ch++) {
    const lowercase = String.fromCharCode(ch);
    templates[lowercase] = generateTemplateForLetter(lowercase.toUpperCase());
  }

  for (let d = 0; d <= 9; d++) {
    const digit = String(d);
    templates[digit] = generateTemplateForDigit(digit);
  }

  const symbols = ['+', '-', '−', '*', '×', '÷', '/', '='] as const;
  symbols.forEach(sym => {
    templates[sym] = generateTemplateForSymbol(sym);
  });
}

function computeSimilarity(userGrid: GridState, templateGrid: GridState): number {
  let intersection = 0, union = 0;
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const userVal = userGrid[i][j] ? 1 : 0;
      const tempVal = templateGrid[i][j] ? 1 : 0;
      if (userVal === 1 && tempVal === 1) intersection++;
      if (userVal === 1 || tempVal === 1) union++;
    }
  }
  return union === 0 ? 0 : intersection / union;
}

export function recognize(userGrid: GridState, mode: 'standard' | 'sensitive' | 'precise' = 'standard', threshold: number = 0.28): RecognitionResult {
  if (Object.keys(templates).length === 0) initEngine();

  let bestLetter = '?';
  let bestScore = -1;

  for (const key in templates) {
    let score = computeSimilarity(userGrid, templates[key]);
    
    // Apply mode adjustments
    if (mode === 'sensitive') score = Math.min(1, score * 1.2);
    if (mode === 'precise') score = score * 0.9;
    
    if (score > bestScore) {
      bestScore = score;
      bestLetter = key;
    }
  }

  const totalActive = userGrid.flat().filter(v => v === true).length;
  if (totalActive < 8) {
    return { letter: '?', confidence: 0 };
  }

  const confidencePercent = Math.min(99, Math.floor(bestScore * 100));
  if (bestScore < threshold) {
    return { letter: '?', confidence: confidencePercent };
  }

  return { letter: bestLetter, confidence: confidencePercent };
}

const supportedChars = new Set(
  [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', '+', '-', '−', '*', '×', '÷', '/', '=']
);

function pickBestOcrCharacter(text: string): string | null {
  const cleaned = text.replace(/\s+/g, '');
  for (const char of cleaned) {
    if (supportedChars.has(char)) {
      return char;
    }
  }
  return null;
}

export async function recognizeWithOcr(
  userGrid: GridState,
  sourceCanvas: HTMLCanvasElement | null,
  mode: 'standard' | 'sensitive' | 'precise' = 'standard',
  threshold: number = 0.28
): Promise<RecognitionResult> {
  const templateResult = recognize(userGrid, mode, threshold);
  if (!sourceCanvas) return templateResult;

  try {
    const { data } = await tesseractRecognize(sourceCanvas, 'eng');
    const ocrChar = pickBestOcrCharacter(data.text ?? '');
    const ocrConfidence = Math.max(0, Math.min(99, Math.round(data.confidence ?? 0)));

    if (!ocrChar) return templateResult;

    if (templateResult.letter === '?') {
      return { letter: ocrChar, confidence: ocrConfidence };
    }

    if (templateResult.letter === ocrChar) {
      return {
        letter: templateResult.letter,
        confidence: Math.max(templateResult.confidence, ocrConfidence)
      };
    }

    if (ocrConfidence >= templateResult.confidence + 10) {
      return { letter: ocrChar, confidence: ocrConfidence };
    }

    return templateResult;
  } catch {
    return templateResult;
  }
}
