'use client';

import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Sparkles,
  FileText
} from 'lucide-react';
import { getPdfUrl } from '@/lib/api';

interface PdfViewerProps {
  chapterId: string;
  chapterTitle: string;
  pdfFilename: string;
  onAskAboutPage?: (pageNum: number) => void;
}

export default function PdfViewer({
  chapterId,
  chapterTitle,
  pdfFilename,
  onAskAboutPage
}: PdfViewerProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const pdfUrl = getPdfUrl(chapterId);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(200, prev + 15));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(70, prev - 15));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Fullscreen request failed:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-700/60 ${
        isFullscreen ? 'p-4 bg-slate-950' : ''
      }`}
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 backdrop-blur border-b border-slate-700 text-slate-200 text-xs shrink-0 select-none">
        {/* Left: Document Info */}
        <div className="flex items-center gap-2 truncate pr-2">
          <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold truncate max-w-[220px] sm:max-w-xs text-slate-200" title={chapterTitle}>
            {chapterTitle}
          </span>
        </div>

        {/* Center: Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-700/80">
          <button
            onClick={handleZoomOut}
            className="p-1 hover:bg-slate-700 rounded transition text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-1.5 py-0.5 text-[11px] font-mono font-medium hover:bg-slate-700 rounded text-slate-300 hover:text-white"
            title="Reset Zoom"
          >
            {zoomLevel}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1 hover:bg-slate-700 rounded transition text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {onAskAboutPage && (
            <button
              onClick={() => onAskAboutPage(currentPage)}
              className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-medium shadow-sm transition active:scale-95 text-[11px]"
              title="Ask AI to explain current page"
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">Ask AI This Page</span>
            </button>
          )}

          <a
            href={pdfUrl}
            download={pdfFilename || 'chapter.pdf'}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition text-slate-300 hover:text-white"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </a>

          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-slate-700 rounded-lg transition text-slate-300 hover:text-white"
            title="Open in new window"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition text-slate-300 hover:text-white"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* PDF Canvas / Embed Container */}
      <div className="relative flex-1 w-full bg-slate-950 overflow-auto flex items-center justify-center p-2">
        <div
          className="transition-transform duration-200 origin-top flex items-center justify-center w-full h-full"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          <object
            data={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&page=${currentPage}`}
            type="application/pdf"
            className="w-full h-full rounded-lg shadow-2xl bg-white"
          >
            {/* Fallback iframe */}
            <iframe
              src={`${pdfUrl}#toolbar=0`}
              title={chapterTitle}
              className="w-full h-full rounded-lg bg-white border-0"
            >
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-300">
                <BookOpen className="w-12 h-12 text-slate-500 mb-3" />
                <p className="font-semibold text-base mb-2">PDF Document Ready</p>
                <p className="text-xs text-slate-400 mb-4 max-w-sm">
                  Your browser does not support inline PDF rendering. You can view or download the textbook chapter directly.
                </p>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
                >
                  Open PDF in Dedicated Viewer
                </a>
              </div>
            </iframe>
          </object>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          <span>Textbook Chapter Document • Live Context Connected</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{pdfFilename}</span>
        </div>
      </div>
    </div>
  );
}
