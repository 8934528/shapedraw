import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  RotateCw,
  Trash2,
  Settings as SettingsIcon,
  Download,
  Info,
  Maximize2,
  Expand,
  Brush,
  X,
  SlidersHorizontal,
  Target,
  CircleHelp,
  Sparkles,
  Keyboard,
  Eye,
} from 'lucide-react';
import DrawingCanvas from './components/DrawingCanvas';
import type { DrawingCanvasHandle } from './components/DrawingCanvas';
import { recognizeWithOcr } from './utils/recognitionEngine';
import type { RecognitionResult } from './utils/recognitionEngine';

const App: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [result, setResult] = useState<RecognitionResult>({ letter: '?', confidence: 0 });
  const [mode, setMode] = useState<'standard' | 'sensitive' | 'precise'>('standard');
  const [threshold, setThreshold] = useState(0.28);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFullscreenResultOpen, setIsFullscreenResultOpen] = useState(false);
  const [brushSize, setBrushSize] = useState(2);
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const fullscreenTargetRef = useRef<HTMLDivElement>(null);
  const recognitionRequestRef = useRef(0);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      setIsFullscreenResultOpen(false);
    }
  }, [isFullscreen]);

  const runRecognition = useCallback(async () => {
    if (!canvasRef.current) return;
    const currentRequestId = ++recognitionRequestRef.current;
    const grid = canvasRef.current.getGridData();
    const sourceCanvas = canvasRef.current.getCanvasElement();
    const res = await recognizeWithOcr(grid, sourceCanvas, mode, threshold);
    if (currentRequestId === recognitionRequestRef.current) {
      setResult(res);
    }
  }, [mode, threshold]);

  const handleStrokeEnd = () => {
    void runRecognition();
  };

  const handleClear = () => {
    canvasRef.current?.clear();
    setResult({ letter: '?', confidence: 0 });
  };

  const handleUndo = () => {
    canvasRef.current?.undo();
    void runRecognition();
  };

  const handleRedo = () => {
    canvasRef.current?.redo();
    void runRecognition();
  };

  const handleDownload = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `shapedraw-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const handleToggleFullscreen = async () => {
    if (!document.fullscreenElement && fullscreenTargetRef.current) {
      await fullscreenTargetRef.current.requestFullscreen();
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  };

  const toggleFullscreenResultModal = () => {
    setIsFullscreenResultOpen((prev) => !prev);
  };

  const closeFullscreenResultModal = () => {
    setIsFullscreenResultOpen(false);
  };

  const fullscreenResultToggleTitle = isFullscreenResultOpen ? 'Hide recognition results' : 'Show recognition results';
  const fullscreenResultToggleLabel = isFullscreenResultOpen ? 'Hide Result' : 'Show Result';

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget = Boolean(
        target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable)
      );
      if (isTypingTarget) return;

      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        void handleToggleFullscreen();
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        void runRecognition();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [runRecognition]);

  return (
    <div className="container-fluid min-vh-100 d-flex flex-column py-2 px-0">
      {/* Header */}
      <header className="d-flex justify-content-between align-items-center mb-2 px-2 px-md-3 animate-fade-in">
        <div className="d-flex flex-column">
          <p className="text-secondary small mb-0">Precision Pattern Recognition</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          {!isFullscreen && (
            <label htmlFor="brush-size-slider" className="d-flex align-items-center gap-2 text-secondary small mb-0" title="Brush size">
              <Brush size={18} aria-hidden />
              <input id="brush-size-slider" type="range" className="accent-forest" min="1" max="10" step="1" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value, 10))} aria-label="Brush size" />
              <span className="text-white">{brushSize}</span>
            </label>
          )}
          <button className="custom-btn-outline" title="Fullscreen Drawing" onClick={handleToggleFullscreen}>
            <Expand size={15} />
          </button>
          <button className="custom-btn-outline" title="Settings" onClick={() => setIsSettingsOpen(true)}>
            <SettingsIcon size={15} />
          </button>
          <button className="custom-btn-outline" title="Info" onClick={() => setIsInfoOpen(true)}>
            <Info size={15} />
          </button>
        </div>
      </header>

      <main className="row g-4 flex-grow-1 mx-0 align-items-stretch">
        {/* Left Column */}
        <div className="col-12 col-lg-8 d-flex flex-column align-items-center animate-fade-in animate-delay-100">
          <div className="glass-panel p-4 w-100 h-100 d-flex flex-column align-items-center">
            <div ref={fullscreenTargetRef} className={`w-100 ${isFullscreen ? 'fullscreen-drawing-wrapper' : ''}`}>
              
              {/* Toolbar */}
              <div className="mb-3 d-flex flex-wrap justify-content-start gap-3 w-100">
                <button 
                  onClick={handleUndo} 
                  disabled={!canUndo}
                  className="custom-btn-outline d-flex align-items-center gap-2"
                >
                  <RotateCcw size={15} /> 
                </button>
                <button 
                  onClick={handleRedo} 
                  disabled={!canRedo}
                  className="custom-btn-outline d-flex align-items-center gap-2"
                >
                  <RotateCw size={15} /> 
                </button>
                <button 
                  onClick={handleClear} 
                  className="custom-btn-outline d-flex align-items-center gap-2 text-danger border-danger-subtle"
                >
                  <Trash2 size={15} /> 
                </button>
                <button 
                  onClick={handleDownload} 
                  className="custom-btn d-flex align-items-center gap-2"
                >
                  <Download size={15} /> 
                </button>
                {isFullscreen && (
                  <label htmlFor="brush-size-slider-fullscreen" className="d-flex align-items-center gap-2 text-secondary small mb-0" title="Brush size">
                    <Brush size={18} aria-hidden />
                    <input
                      id="brush-size-slider-fullscreen"
                      type="range"
                      className="accent-forest"
                      min="1"
                      max="10"
                      step="1"
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                      aria-label="Brush size"
                    />
                    <span className="text-white">{brushSize}</span>
                  </label>
                )}
              </div>

              {/* Drawing Area */}
              <DrawingCanvas 
                ref={canvasRef} 
                onStrokeEnd={handleStrokeEnd} 
                brushWidth={brushSize}
                onHistoryChange={(undo, redo) => {
                  setCanUndo(undo);
                  setCanRedo(redo);
                }}
              />

              {/* Fullscreen Result Controls */}
              {isFullscreen && (
                <>
                  {/* Floating toggle button */}
                  <button
                    className="fullscreen-result-toggle custom-btn-outline d-flex align-items-center gap-2"
                    onClick={toggleFullscreenResultModal}
                    title={fullscreenResultToggleTitle}
                    aria-label={fullscreenResultToggleTitle}
                    aria-expanded={isFullscreenResultOpen}
                    aria-controls="fullscreen-recognition-modal"
                  >
                    <Eye size={16} />
                    <span>{fullscreenResultToggleLabel}</span>
                  </button>

                  <AnimatePresence>
                    {isFullscreenResultOpen && (
                      <motion.div
                        id="fullscreen-recognition-modal"
                        className="fullscreen-result-modal"
                        initial={{ opacity: 0, y: -18, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -18, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        role="dialog"
                        aria-modal="false"
                        aria-label="Recognition results"
                      >
                        <div className="app-modal-card">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="mb-0">Recognition Result</h4>
                            <button
                              className="custom-btn-outline p-2"
                              onClick={closeFullscreenResultModal}
                              title="Close result modal"
                              aria-label="Close recognition results"
                            >
                              <X size={18} />
                            </button>
                          </div>
                          <div className="d-flex justify-content-center align-items-center fs-1 fw-bold text-forest mb-3">
                            {result.letter}
                          </div>
                          <p className="mb-1 text-secondary">
                            Exact confidence: <span className="text-forest fw-bold">{result.confidence}%</span>
                          </p>
                          <p className="mb-0 text-secondary small">Press Esc to exit fullscreen.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Results & Controls */}
        <div className={`col-12 col-lg-4 animate-fade-in animate-delay-200 ${isFullscreen ? 'd-none' : ''}`}>
          <div className="glass-panel p-4 h-100 d-flex flex-column">
            <h3 className="h5 mb-4 d-flex align-items-center gap-2">
              <Maximize2 size={18} className="text-forest" /> Recognition Result
            </h3>
            
            <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-center py-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={result.letter}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="recognition-result text-forest"
                >
                  {result.letter}
                </motion.div>
              </AnimatePresence>
              
              <div className="w-100 max-w-sm mt-3">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary small">Confidence</span>
                  <span className="text-forest fw-bold">{result.confidence}%</span>
                </div>
                <div className="conf-bar-container">
                  <div 
                    className="conf-bar-fill" 
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-forest bg-opacity-10 rounded-3 border border-white border-opacity-25 small text-white mt-auto">
              <i className="bi bi-gear me-2"></i>
              Press Enter anytime to refresh recognition. Use Settings to adjust mode and threshold.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-2 py-2 text-center text-secondary small opacity-50">
        <p className="mb-0">&copy; {currentYear} ShapeDraw</p>
      </footer>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="app-modal-backdrop" onClick={() => setIsSettingsOpen(false)}>
          <div className="app-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0 d-flex align-items-center gap-2">
                <SettingsIcon size={18} className="text-forest" />
                Settings & Controls
              </h4>
              <button className="custom-btn-outline p-2" onClick={() => setIsSettingsOpen(false)} title="Close">
                <X size={18} />
              </button>
            </div>

            <label className="text-secondary small fw-bold text-uppercase mb-3 d-flex align-items-center gap-2">
              <SlidersHorizontal size={14} className="text-forest" />
              Recognition Mode
            </label>
            <div className="d-flex gap-2 mb-4">
              {(['standard', 'sensitive', 'precise'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-grow-1 py-2 px-3 rounded-3 transition-all ${mode === m ? 'custom-btn border-0' : 'custom-btn-outline'}`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>

            <label htmlFor="threshold-slider" className="text-secondary small fw-bold text-uppercase mb-2 d-flex justify-content-between align-items-center">
              <span className="d-flex align-items-center gap-2">
                <Target size={14} className="text-forest" />
                Threshold
              </span>
              <span>{Math.round(threshold * 100)}%</span>
            </label>
            <input
              id="threshold-slider"
              type="range"
              className="w-100 accent-forest mb-2"
              min="0.1"
              max="0.8"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
            />
            <p className="text-secondary opacity-75 text-micro mb-4">
              Lower = more guesses, Higher = stricter
            </p>

            <div className="p-3 bg-forest bg-opacity-10 rounded-3 border border-white border-opacity-25 small text-white d-flex align-items-start gap-2">
              <CircleHelp size={16} className="mt-1 flex-shrink-0" />
              Undo, redo, clear and export are below the canvas. Recognition updates after each stroke.
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {isInfoOpen && (
        <div className="app-modal-backdrop" onClick={() => setIsInfoOpen(false)}>
          <div className="info-modal-layout" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0 d-flex align-items-center gap-2">
                <Info size={18} className="text-forest" />
                About ShapeDraw
              </h4>
              <button className="custom-btn-outline p-2" onClick={() => setIsInfoOpen(false)} title="Close">
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-secondary small">
              Draw one clear character or symbol per canvas. Recognition runs when you finish a stroke. Press <kbd className="px-1 rounded border border-secondary border-opacity-50 bg-dark bg-opacity-25">Enter</kbd> anytime to refresh the prediction.
            </p>

            <div className="row g-4">
              <div className="col-12 col-md-6">
                <h5 className="h6 text-uppercase text-forest mb-2 d-flex align-items-center gap-2">
                  <Eye size={16} />
                  What It Recognizes
                </h5>
                <p className="small text-secondary mb-0">
                  Numbers, common math symbols, uppercase letters, and lowercase letters. ShapeDraw combines a <strong className="text-forest">28x28 grid matcher</strong> with <strong className="text-forest">Tesseract OCR</strong> and returns the best combined result.
                </p>
              </div>

              <div className="col-12 col-md-6">
                <h5 className="h6 text-uppercase text-forest mb-2 d-flex align-items-center gap-2">
                  <SettingsIcon size={16} />
                  Header Controls
                </h5>
                <ul className="small text-secondary mb-0 ps-3">
                  <li className="mb-1"><strong className="text-forest">Brush</strong> - adjust stroke thickness from 1 to 10.</li>
                  <li className="mb-1"><strong className="text-forest">Fullscreen</strong> - draw in a larger focused workspace.</li>
                  <li className="mb-1"><strong className="text-forest">Settings</strong> - tune mode and threshold.</li>
                  <li className="mb-0"><strong className="text-forest">Info</strong> - open this guide.</li>
                </ul>
              </div>

              <div className="col-12 col-md-6">
                <h5 className="h6 text-uppercase text-forest mb-2 d-flex align-items-center gap-2">
                  <Brush size={16} />
                  Canvas Toolbar
                </h5>
                <ul className="small text-secondary mb-0 ps-3">
                  <li className="mb-1"><strong className="text-forest">Undo / Redo</strong> - step through drawing history.</li>
                  <li className="mb-1"><strong className="text-forest">Clear</strong> - erase the canvas and reset result.</li>
                  <li className="mb-0"><strong className="text-forest">Download</strong> - save the drawing as PNG.</li>
                </ul>
              </div>

              <div className="col-12 col-md-6">
                <h5 className="h6 text-uppercase text-forest mb-2 d-flex align-items-center gap-2">
                  <Keyboard size={16} />
                  Shortcuts
                </h5>
                <ul className="small text-secondary mb-0 ps-3">
                  <li className="mb-1"><kbd className="px-1 rounded border border-secondary border-opacity-50 bg-dark bg-opacity-25">F</kbd> - toggle fullscreen</li>
                  <li className="mb-1"><kbd className="px-1 rounded border border-secondary border-opacity-50 bg-dark bg-opacity-25">Enter</kbd> - run recognition again</li>
                  <li className="mb-0"><kbd className="px-1 rounded border border-secondary border-opacity-50 bg-dark bg-opacity-25">Esc</kbd> - exit fullscreen</li>
                </ul>
              </div>

              <div className="col-12">
                <h5 className="h6 text-uppercase text-forest mb-2 d-flex align-items-center gap-2">
                  <Sparkles size={16} />
                  Tips For Better Accuracy
                </h5>
                <div className="row g-2 small text-secondary">
                  <div className="col-12 col-md-4">Draw larger and keep the symbol centered.</div>
                  <div className="col-12 col-md-4">Clear before starting a new character.</div>
                  <div className="col-12 col-md-4">If confidence is low, try a thicker stroke or cleaner shape.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
