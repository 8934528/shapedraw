import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { useCanvas } from '../hooks/useCanvas';

interface DrawingCanvasProps {
  onStrokeEnd?: () => void;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
  brushWidth?: number;
}

export interface DrawingCanvasHandle {
  clear: () => void;
  undo: () => void;
  redo: () => void;
  getGridData: () => boolean[][];
  getCanvasElement: () => HTMLCanvasElement | null;
}

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(({ onStrokeEnd, onHistoryChange, brushWidth = 2 }, ref) => {
  const {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    clear,
    undo,
    redo,
    getGridData,
    setBrushWidth
  } = useCanvas(28, onHistoryChange);

  useEffect(() => {
    setBrushWidth(brushWidth);
  }, [brushWidth, setBrushWidth]);

  useImperativeHandle(ref, () => ({
    clear,
    undo,
    redo,
    getGridData,
    getCanvasElement: () => canvasRef.current
  }));

  const handlePointerUp = () => {
    stopDrawing();
    if (onStrokeEnd) onStrokeEnd();
  };

  return (
    <div className="drawing-container shadow-lg">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={handlePointerUp}
        className="canvas-element"
      />
    </div>
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;
