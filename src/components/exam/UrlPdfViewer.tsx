import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Pencil, Eraser, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up the worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface UrlPdfViewerProps {
  url: string;
  viewerId?: string;
  onStateChange?: (state: PdfViewerState) => void;
  initialState?: PdfViewerState;
}

export interface PdfViewerState {
  pageNumber: number;
  scale: number;
  drawings: DrawingLine[];
  scrollTop?: number;
  scrollLeft?: number;
}

interface DrawingLine {
  pageNumber: number;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface PdfViewerRef {
  getState: () => PdfViewerState;
  setState: (state: PdfViewerState) => void;
}

export const UrlPdfViewer = forwardRef<PdfViewerRef, UrlPdfViewerProps>(({ 
  url, 
  viewerId,
  onStateChange,
  initialState 
}, ref) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialState?.pageNumber || 1);
  const [scale, setScale] = useState<number>(initialState?.scale || 1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pageRendered, setPageRendered] = useState(false);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<'none' | 'draw' | 'erase'>('none');
  const [drawings, setDrawings] = useState<DrawingLine[]>(initialState?.drawings || []);
  const [currentLine, setCurrentLine] = useState<{ x: number; y: number }[]>([]);
  const [drawColor, setDrawColor] = useState('#ef4444');
  const [drawWidth, setDrawWidth] = useState(3);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getState: () => ({
      pageNumber,
      scale,
      drawings,
      scrollTop: scrollContainerRef.current?.scrollTop || 0,
      scrollLeft: scrollContainerRef.current?.scrollLeft || 0
    }),
    setState: (state: PdfViewerState) => {
      setPageNumber(state.pageNumber);
      setScale(state.scale);
      setDrawings(state.drawings || []);
      // Scroll position will be restored after render
      if (scrollContainerRef.current && state.scrollTop !== undefined) {
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = state.scrollTop || 0;
            scrollContainerRef.current.scrollLeft = state.scrollLeft || 0;
          }
        }, 100);
      }
    }
  }));

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange({ pageNumber, scale, drawings });
    }
  }, [pageNumber, scale, drawings, onStateChange]);

  // Reset page rendered state when page changes
  useEffect(() => {
    setPageRendered(false);
  }, [pageNumber]);

  // Redraw canvas when page or drawings change
  useEffect(() => {
    if (pageRendered) {
      redrawCanvas();
    }
  }, [pageNumber, drawings, scale, pageRendered]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const page = pageRef.current;
    if (!canvas || !page) {
      console.log('redrawCanvas: canvas or page not ready');
      return;
    }

    // Get the actual rendered page dimensions
    const pageElement = page.querySelector('.react-pdf__Page');
    const targetElement = pageElement || page;
    const rect = targetElement.getBoundingClientRect();
    
    console.log('redrawCanvas: setting canvas size to', rect.width, 'x', rect.height);
    
    // Set canvas size to match PDF page
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all lines for current page
    const pageDrawings = drawings.filter(d => d.pageNumber === pageNumber);
    console.log('redrawCanvas: drawing', pageDrawings.length, 'lines for page', pageNumber);
    
    for (const line of pageDrawings) {
      if (line.points.length === 0) continue;
      
      ctx.beginPath();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (line.points.length === 1) {
        // Single point - draw a dot
        ctx.fillStyle = line.color;
        ctx.arc(line.points[0].x * scale, line.points[0].y * scale, line.width / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Multiple points - draw a line
        ctx.moveTo(line.points[0].x * scale, line.points[0].y * scale);
        for (let i = 1; i < line.points.length; i++) {
          ctx.lineTo(line.points[i].x * scale, line.points[i].y * scale);
        }
        ctx.stroke();
      }
    }
  }, [pageNumber, drawings, scale]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Get coordinates relative to canvas at base scale (1.0)
    const x = (clientX - rect.left) / scale;
    const y = (clientY - rect.top) / scale;
    
    console.log('Canvas coords:', { x, y, clientX, clientY, rectLeft: rect.left, rectTop: rect.top, scale });
    
    return { x, y };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (drawMode === 'none') return;
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Pointer down, drawMode:', drawMode);
    
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    setCurrentLine([coords]);
    
    // Draw initial point
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.fillStyle = drawMode === 'erase' ? '#1a1a2e' : drawColor;
      ctx.arc(coords.x * scale, coords.y * scale, (drawMode === 'erase' ? 10 : drawWidth / 2), 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || drawMode === 'none') return;
    e.preventDefault();
    e.stopPropagation();
    
    const coords = getCanvasCoords(e);
    const newLine = [...currentLine, coords];
    setCurrentLine(newLine);

    // Draw current stroke incrementally
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || newLine.length < 2) return;

    const prevPoint = newLine[newLine.length - 2];
    const currPoint = newLine[newLine.length - 1];
    
    ctx.beginPath();
    ctx.strokeStyle = drawMode === 'erase' ? '#1a1a2e' : drawColor;
    ctx.lineWidth = drawMode === 'erase' ? 20 : drawWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(prevPoint.x * scale, prevPoint.y * scale);
    ctx.lineTo(currPoint.x * scale, currPoint.y * scale);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!isDrawing) {
      return;
    }
    
    console.log('Pointer up, currentLine length:', currentLine.length);

    if (currentLine.length >= 1) {
      const newLine: DrawingLine = {
        pageNumber,
        points: currentLine,
        color: drawMode === 'erase' ? '#1a1a2e' : drawColor,
        width: drawMode === 'erase' ? 20 : drawWidth
      };
      setDrawings(prev => [...prev, newLine]);
    }

    setIsDrawing(false);
    setCurrentLine([]);
  };

  const clearCurrentPage = () => {
    setDrawings(prev => prev.filter(d => d.pageNumber !== pageNumber));
    toast.success('نقاشی‌های این صفحه پاک شد');
  };

  const clearAllDrawings = () => {
    setDrawings([]);
    toast.success('همه نقاشی‌ها پاک شد');
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    if (!initialState) {
      setPageNumber(1);
    }
    setLoading(false);
    setError(false);
  };

  const onDocumentLoadError = () => {
    setLoading(false);
    setError(true);
  };

  // Resize observer for canvas
  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const observer = new ResizeObserver(() => {
      setTimeout(redrawCanvas, 100);
    });

    observer.observe(page);
    return () => observer.disconnect();
  }, [redrawCanvas]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 p-8">
        <p className="text-center">خطا در بارگذاری PDF</p>
        <p className="text-sm text-center">ممکن است مرورگر شما از نمایش این فایل پشتیبانی نکند</p>
        <Button
          variant="outline"
          onClick={() => window.open(url, '_blank')}
        >
          باز کردن در تب جدید
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between p-2 border-b border-white/10 bg-card/50 backdrop-blur-sm flex-wrap gap-2">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setScale(s => Math.min(3, s + 0.1))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Drawing Controls */}
        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
          <Button
            size="icon"
            variant={drawMode === 'draw' ? 'default' : 'ghost'}
            className="h-8 w-8"
            onClick={() => setDrawMode(drawMode === 'draw' ? 'none' : 'draw')}
            title="قلم"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant={drawMode === 'erase' ? 'default' : 'ghost'}
            className="h-8 w-8"
            onClick={() => setDrawMode(drawMode === 'erase' ? 'none' : 'erase')}
            title="پاک‌کن"
          >
            <Eraser className="w-4 h-4" />
          </Button>
          
          {/* Color Picker */}
          {drawMode === 'draw' && (
            <div className="flex items-center gap-1 px-1">
              {['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#000000'].map(color => (
                <button
                  key={color}
                  onClick={() => setDrawColor(color)}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    drawColor === color ? 'ring-2 ring-white scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
          
          <div className="h-6 w-px bg-white/20 mx-1" />
          
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={clearCurrentPage}
            title="پاک کردن این صفحه"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Page Controls */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-xs">
            {pageNumber} / {numPages || '...'}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Document with Canvas Overlay */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto p-4 flex justify-center bg-muted/20"
      >
        <div className="relative" ref={pageRef}>
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg"
              onRenderSuccess={() => {
                setPageRendered(true);
                setTimeout(redrawCanvas, 50);
              }}
            />
          </Document>
          
          {/* Drawing Canvas Overlay */}
          {pageRendered && (
            <canvas
              ref={canvasRef}
              className={`absolute top-0 left-0 ${drawMode !== 'none' ? 'cursor-crosshair' : 'pointer-events-none'}`}
              style={{ touchAction: 'none' }}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            />
          )}
        </div>
      </div>
    </div>
  );
});

UrlPdfViewer.displayName = 'UrlPdfViewer';
