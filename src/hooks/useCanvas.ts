import { useRef, useState, useCallback, useEffect } from 'react';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export const useCanvas = (gridSize: number = 28, onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);
  const [currentStrokes, setCurrentStrokes] = useState<Stroke[]>([]);
  const [brushColor, setBrushColor] = useState('#4F7942');
  const [brushWidth, setBrushWidth] = useState(2);

  useEffect(() => {
    if (onHistoryChange) {
      onHistoryChange(history.length > 0, redoStack.length > 0);
    }
  }, [history, redoStack, onHistoryChange]);

  const getCoordinates = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): Point | null => {
    if (!canvasRef.current) return null;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e.nativeEvent);
    if (!coords) return;

    setIsDrawing(true);
    const newStroke: Stroke = {
      points: [coords],
      color: brushColor,
      width: brushWidth
    };
    setCurrentStrokes(prev => [...prev, newStroke]);
    setRedoStack([]);
  }, [brushColor, brushWidth]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e.nativeEvent);
    if (!coords) return;

    setCurrentStrokes(prev => {
      const lastStroke = prev[prev.length - 1];
      const updatedStroke = {
        ...lastStroke,
        points: [...lastStroke.points, coords]
      };
      return [...prev.slice(0, -1), updatedStroke];
    });
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHistory(prev => [...prev, [...currentStrokes]]);
  }, [isDrawing, currentStrokes]);

  const clear = useCallback(() => {
    setHistory([]);
    setCurrentStrokes([]);
    setRedoStack([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const newHistory = history.slice(0, -1);
    const lastItem = history[history.length - 1];
    setHistory(newHistory);
    setRedoStack(prev => [...prev, lastItem]);
    setCurrentStrokes(newHistory.length > 0 ? newHistory[newHistory.length - 1] : []);
  }, [history]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextItem = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setHistory(prev => [...prev, nextItem]);
    setCurrentStrokes(nextItem);
  }, [redoStack]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    currentStrokes.forEach(stroke => {
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      stroke.points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });
  }, [currentStrokes]);

  const getGridData = useCallback((): boolean[][] => {
    const canvas = canvasRef.current;
    if (!canvas) return Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
    
    // Create an offscreen canvas to downsample
    const offscreen = document.createElement('canvas');
    offscreen.width = gridSize;
    offscreen.height = gridSize;
    const oCtx = offscreen.getContext('2d');
    if (!oCtx) return Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));

    oCtx.drawImage(canvas, 0, 0, gridSize, gridSize);
    const imgData = oCtx.getImageData(0, 0, gridSize, gridSize).data;
    
    const grid: boolean[][] = [];
    for (let r = 0; r < gridSize; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < gridSize; c++) {
        const index = (r * gridSize + c) * 4;
        const alpha = imgData[index + 3];
        row.push(alpha > 50);
      }
      grid.push(row);
    }
    return grid;
  }, [gridSize]);

  return {
    canvasRef,
    isDrawing,
    startDrawing,
    draw,
    stopDrawing,
    clear,
    undo,
    redo,
    getGridData,
    brushColor,
    setBrushColor,
    brushWidth,
    setBrushWidth,
    canUndo: history.length > 0,
    canRedo: redoStack.length > 0
  };
};
