import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up the worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  file: File | null;
}

export const PdfViewer = ({ file }: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  if (!file || !pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>فایل PDF انتخاب نشده</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between p-2 border-b border-white/10 bg-background/50">
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
            onClick={() => setScale(s => Math.min(2, s + 0.1))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
        
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
            {pageNumber} / {numPages}
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

      {/* PDF Document */}
      <div className="flex-1 overflow-auto p-2 flex justify-center">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          }
          error={
            <div className="text-destructive text-center p-4">
              خطا در بارگذاری PDF
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
};
