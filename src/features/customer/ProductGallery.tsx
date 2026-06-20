import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface ProductGalleryProps {
  images: string[];
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ images }) => {
  const { isRTL } = useApp();
  const [activeIdx, setActiveIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  if (images.length === 0) {
    return (
      <div className="w-full h-full bg-theme-card flex items-center justify-center border border-theme-border text-theme-muted font-bold text-xs">
        {isRTL ? 'لا تتوفر صور للمنتج' : 'No images available'}
      </div>
    );
  }

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setActiveIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleZoom = () => {
    setZoomScale(prev => (prev === 1 ? 2 : 1));
  };

  return (
    <div className="relative w-full h-full group flex flex-col justify-between">
      {/* Active Main Slide */}
      <div className="relative flex-1 bg-theme-bg/10 flex items-center justify-center overflow-hidden">
        <img 
          src={images[activeIdx]} 
          alt={`Product Slide ${activeIdx + 1}`}
          loading="lazy"
          className="w-full h-full object-cover select-none transition-transform duration-300"
          style={{ transform: `scale(${zoomScale})` }}
          onClick={toggleZoom}
        />
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/45 hover:bg-black/60 text-white p-2 rounded-full z-10 transition opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={16} />
            </button>
            <button 
              onClick={handleNext}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/45 hover:bg-black/60 text-white p-2 rounded-full z-10 transition opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        )}

        {/* Fullscreen Trigger */}
        <button
          onClick={() => { setFullscreen(true); setZoomScale(1); }}
          className="absolute bottom-3 right-3 bg-black/45 hover:bg-black/60 text-white p-2 rounded-xl z-10 transition"
          title={isRTL ? 'ملء الشاشة' : 'Fullscreen'}
        >
          <Maximize2 size={14} />
        </button>

        {/* Slide Counter Overlay */}
        <span className="absolute bottom-3 left-3 bg-black/45 px-3 py-1 rounded-xl text-white font-black text-[9px] font-sans">
          {activeIdx + 1} / {images.length}
        </span>
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="bg-theme-card/90 backdrop-blur border-t border-theme-border/50 p-2.5 flex justify-center gap-2 overflow-x-auto no-scrollbar theme-transition">
          {images.map((imgUrl, idx) => (
            <button
              key={idx}
              onClick={() => { setActiveIdx(idx); setZoomScale(1); }}
              className={`w-10 h-10 rounded-lg overflow-hidden border transition flex-shrink-0 ${
                activeIdx === idx ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-theme-border hover:border-theme-border-hover'
              }`}
            >
              <img src={imgUrl} className="w-full h-full object-cover" alt={`Thumb ${idx + 1}`} />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Overlay Viewer */}
      {fullscreen && (
        <div className="fixed inset-0 bg-black z-[110] flex flex-col items-center justify-between p-6 animate-fade-in">
          {/* Header row */}
          <div className="w-full flex justify-between items-center text-white text-xs font-black">
            <span>{isRTL ? `عرض الصورة ${activeIdx + 1} من ${images.length}` : `Image ${activeIdx + 1} of ${images.length}`}</span>
            <div className="flex gap-2">
              <button 
                onClick={toggleZoom}
                className="bg-white/10 p-2 rounded-xl text-white hover:bg-white/20 transition"
              >
                {zoomScale > 1 ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
              </button>
              <button 
                onClick={() => { setFullscreen(false); setZoomScale(1); }}
                className="bg-primary p-2 rounded-xl text-white hover:scale-105 active:scale-95 transition"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Large image slide */}
          <div className="flex-1 flex items-center justify-center w-full max-h-[75vh]">
            <img 
              src={images[activeIdx]} 
              className="max-w-full max-h-full object-contain select-none transition-transform duration-200" 
              style={{ transform: `scale(${zoomScale})` }}
              alt="Fullscreen slide"
            />
          </div>

          {/* Footer Navigation control */}
          {images.length > 1 && (
            <div className="w-full flex justify-center gap-6 text-white pb-4">
              <button 
                onClick={handlePrev}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition"
              >
                <ChevronRight size={20} />
              </button>
              <button 
                onClick={handleNext}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default ProductGallery;
