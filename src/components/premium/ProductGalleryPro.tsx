import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { placeholderService } from '../../services/placeholder.service';
import { assetRecoveryService } from '../../services/assetRecovery.service';
import { tokens } from '../../design/tokens';

interface ProductGalleryProProps {
  primaryImage?: string;
  galleryImages?: string[];
  productName?: string;
  categoryName?: string;
}

export const ProductGalleryPro: React.FC<ProductGalleryProProps> = ({
  primaryImage,
  galleryImages = [],
  productName = 'Product',
  categoryName = ''
}) => {
  const allImages = [
    primaryImage || placeholderService.getPlaceholderForCategory(categoryName),
    ...galleryImages.filter(img => img && img !== primaryImage)
  ].filter(Boolean);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [recoveredUrls, setRecoveredUrls] = useState<Record<number, string>>({});

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const lastTap = useRef(0);

  // Reset indices on product change
  useEffect(() => {
    setActiveIndex(0);
    setZoomScale(1);
    setIsLoading(true);
    setImageErrors({});
    setRecoveredUrls({});
  }, [primaryImage, galleryImages]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomScale(1);
    setIsLoading(true);
    setActiveIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomScale(1);
    setIsLoading(true);
    setActiveIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  // Mobile Swipe Gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      handleNext(); // Swiped Left
    } else if (diff < -50) {
      handlePrev(); // Swiped Right
    }
  };

  // Fullscreen Zoom Controls
  const handleZoomIn = () => {
    setZoomScale(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomScale(prev => Math.max(prev - 0.5, 1));
  };

  // Double Tap Zoom
  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
      setZoomScale(prev => (prev > 1 ? 1 : 2.5));
    } else {
      lastTap.current = now;
    }
  };

  const currentImage = recoveredUrls[activeIndex] || allImages[activeIndex] || '';

  // Recover broken image on current index
  useEffect(() => {
    let active = true;
    if (!currentImage) return;

    const runCheck = async () => {
      const isBroken = await assetRecoveryService.checkBrokenAsset(currentImage);
      if (isBroken && active) {
        // Fallback cascade logic
        const fallback = placeholderService.getPlaceholderForCategory(categoryName);
        setRecoveredUrls(prev => ({ ...prev, [activeIndex]: fallback }));
        setImageErrors(prev => ({ ...prev, [activeIndex]: true }));
      }
      setIsLoading(false);
    };

    runCheck();

    return () => {
      active = false;
    };
  }, [activeIndex, currentImage, categoryName]);

  return (
    <div className="flex flex-col w-full relative">
      {/* Main image container */}
      <div 
        className="w-full aspect-square bg-theme-card border border-theme-border/60 rounded-3xl overflow-hidden relative flex items-center justify-center select-none group cursor-pointer"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleDoubleTap}
      >
        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 bg-theme-card/70 flex items-center justify-center z-10 backdrop-blur-xs">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* Counter Overlay */}
        <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-wider">
          {activeIndex + 1} / {allImages.length}
        </div>

        {/* Status Badge */}
        {imageErrors[activeIndex] && (
          <div className="absolute top-4 right-4 z-10 bg-red-500/95 text-white px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
            RECOVERED FALLBACK
          </div>
        )}

        {/* Image element */}
        <img
          src={currentImage}
          alt={productName}
          onLoad={() => setIsLoading(false)}
          className="w-full h-full object-contain transition-transform duration-300 pointer-events-none"
          loading="lazy"
        />

        {/* Navigation arrows (desktop visible only on hover) */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3.5 bg-black/50 hover:bg-black/70 text-white rounded-2xl transition opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3.5 bg-black/50 hover:bg-black/70 text-white rounded-2xl transition opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Fullscreen Triggers */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFullscreen(true);
          }}
          className="absolute bottom-4 right-4 z-10 p-3.5 bg-black/50 hover:bg-black/70 text-white rounded-2xl hover:scale-105 transition"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Thumbnails strip */}
      {allImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-3 mt-2">
          {allImages.map((img, idx) => {
            const isActive = idx === activeIndex;
            const thumbSrc = recoveredUrls[idx] || img;
            return (
              <button
                key={idx}
                onClick={() => {
                  setActiveIndex(idx);
                  setZoomScale(1);
                  setIsLoading(true);
                }}
                className={`relative w-18 h-18 rounded-2xl border-2 overflow-hidden flex-shrink-0 bg-theme-card transition-all duration-300 ${
                  isActive 
                    ? 'border-primary scale-102 ring-4 ring-primary/10 shadow-lg' 
                    : 'border-theme-border/60 hover:border-theme-border opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={thumbSrc}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Overlay */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black/98 z-50 flex flex-col justify-between p-6 select-none animate-fade-in"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleDoubleTap}
        >
          {/* Top Panel Actions */}
          <div className="flex justify-between items-center w-full z-55">
            <span className="text-white font-bold text-sm tracking-wider">
              {productName} — ({activeIndex + 1} / {allImages.length})
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleZoomIn}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl active:scale-95 transition"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl active:scale-95 transition"
              >
                <ZoomOut size={18} />
              </button>
              <button
                onClick={() => {
                  setIsFullscreen(false);
                  setZoomScale(1);
                }}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl active:scale-95 transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Central Zoom Viewer */}
          <div className="flex-grow flex items-center justify-center relative overflow-hidden my-4">
            {allImages.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-2 z-55 p-4.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl active:scale-95 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <div 
              className="max-w-full max-h-full transition-transform duration-300"
              style={{ transform: `scale(${zoomScale})` }}
            >
              <img
                src={currentImage}
                alt={productName}
                className="max-w-[90vw] max-h-[70vh] object-contain rounded-2xl"
              />
            </div>

            {allImages.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-2 z-55 p-4.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl active:scale-95 transition-all"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Bottom Thumb Strip inside Fullscreen */}
          <div className="w-full flex justify-center py-4 z-55 overflow-x-auto no-scrollbar gap-2.5">
            {allImages.map((img, idx) => {
              const isActive = idx === activeIndex;
              const thumbSrc = recoveredUrls[idx] || img;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveIndex(idx);
                    setZoomScale(1);
                  }}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition ${
                    isActive ? 'border-primary ring-2 ring-primary/20' : 'border-white/25 hover:border-white/50 opacity-60'
                  }`}
                >
                  <img src={thumbSrc} className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGalleryPro;
