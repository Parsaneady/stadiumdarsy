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
      onStateChange({ 
        pageNumber, 
        scale, 
        drawings,
        scrollTop: scrollContainerRef.current?.scrollTop || 0,
        scrollLeft: scrollContainerRef.current?.scrollLeft || 0
      });
    }
  }, [pageNumber, scale, drawings, onStateChange]);

  // Restore scroll position from initialState on mount
  useEffect(() => {
    if (initialState?.scrollTop !== undefined || initialState?.scrollLeft !== undefined) {
      const restoreScroll = () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = initialState.scrollTop || 0;
          scrollContainerRef.current.scrollLeft = initialState.scrollLeft || 0;
        }
      };
      // Wait for PDF to render before restoring scroll
      const timer = setTimeout(restoreScroll, 300);
      return () => clearTimeout(timer);
    }
  }, []); // Only run on mount

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
      return;
    }

    // Get the actual rendered PDF canvas inside the Page component
    const pdfCanvas = page.querySelector('canvas.react-pdf__Page__canvas') as HTMLCanvasElement;
    if (!pdfCanvas) {
      // Fallback to page element
      const pageElement = page.querySelector('.react-pdf__Page');
      if (!pageElement) return;
      
      const rect = pageElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    } else {
      // Match the PDF canvas exactly
      canvas.width = pdfCanvas.width;
      canvas.height = pdfCanvas.height;
      canvas.style.width = pdfCanvas.style.width;
      canvas.style.height = pdfCanvas.style.height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate the display scale factor (canvas pixels vs CSS pixels)
    const displayScale = canvas.width / parseFloat(canvas.style.width || String(canvas.width));

    // Draw all lines for current page
    const pageDrawings = drawings.filter(d => d.pageNumber === pageNumber);
    
    for (const line of pageDrawings) {
      if (line.points.length === 0) continue;
      
      ctx.beginPath();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width * displayScale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (line.points.length === 1) {
        // Single point - draw a dot
        ctx.fillStyle = line.color;
        ctx.arc(
          line.points[0].x * scale * displayScale, 
          line.points[0].y * scale * displayScale, 
          line.width * displayScale / 2, 
          0, 
          Math.PI * 2
        );
        ctx.fill();
      } else {
        // Multiple points - draw a line
        ctx.moveTo(line.points[0].x * scale * displayScale, line.points[0].y * scale * displayScale);
        for (let i = 1; i < line.points.length; i++) {
          ctx.lineTo(line.points[i].x * scale * displayScale, line.points[i].y * scale * displayScale);
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
      const touch = e.type === 'touchend' 
        ? (e as React.TouchEvent).changedTouches[0] 
        : (e as React.TouchEvent).touches[0];
      if (!touch) return { x: 0, y: 0 };
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    // Get coordinates relative to canvas at base scale (1.0)
    const x = (clientX - rect.left) / scale;
    const y = (clientY - rect.top) / scale;
    
    return { x, y };
  };

  const getDisplayScale = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.style.width) return 1;
    const cssWidth = parseFloat(canvas.style.width);
    return cssWidth > 0 ? canvas.width / cssWidth : 1;
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (drawMode === 'none') return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    setCurrentLine([coords]);
    
    // Draw initial point
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const displayScale = getDisplayScale();
      ctx.beginPath();
      ctx.fillStyle = drawMode === 'erase' ? '#1a1a2e' : drawColor;
      const radius = (drawMode === 'erase' ? 10 : drawWidth / 2) * displayScale;
      ctx.arc(coords.x * scale * displayScale, coords.y * scale * displayScale, radius, 0, Math.PI * 2);
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
    if (!ctx || !canvas || newLine.length < 2) return;

    const displayScale = getDisplayScale();
    const prevPoint = newLine[newLine.length - 2];
    const currPoint = newLine[newLine.length - 1];
    
    ctx.beginPath();
    ctx.strokeStyle = drawMode === 'erase' ? '#1a1a2e' : drawColor;
    ctx.lineWidth = (drawMode === 'erase' ? 20 : drawWidth) * displayScale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(prevPoint.x * scale * displayScale, prevPoint.y * scale * displayScale);
    ctx.lineTo(currPoint.x * scale * displayScale, currPoint.y * scale * displayScale);
    ctx.stroke();
  };

  const handlePointerUp = (e?: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) {
      return;
    }

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
