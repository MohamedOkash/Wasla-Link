import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Star, X, MessageSquare, AlertCircle, Camera, Upload, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { db } from '../../services/firebase';
import { doc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { mediaService } from '../../services/media.service';

interface ReviewModalProps {
  order: any;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ order, onClose }) => {
  const { lang, isRTL, currentUser, showToast } = useApp();
  const { t } = useTranslation();
  
  // General experience ratings
  const [ratingStore, setRatingStore] = useState(5);
  const [ratingDriver, setRatingDriver] = useState(5);
  const [ratingProducts, setRatingProducts] = useState(5);
  const [comment, setComment] = useState('');
  
  // Product-specific ratings
  const [productRatings, setProductRatings] = useState<Record<string, { rating: number; comment: string; files: File[]; previews: string[] }>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order && order.items) {
      const initial: Record<string, { rating: number; comment: string; files: File[]; previews: string[] }> = {};
      order.items.forEach((item: any) => {
        initial[item.id] = { rating: 5, comment: '', files: [], previews: [] };
      });
      setProductRatings(initial);
    }
  }, [order]);

  const handleProductRatingChange = (productId: string, rating: number) => {
    setProductRatings(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        rating
      }
    }));
  };

  const handleProductCommentChange = (productId: string, commentVal: string) => {
    setProductRatings(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        comment: commentVal
      }
    }));
  };

  const handleProductImageUpload = (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const filesArray = Array.from(selectedFiles);
    
    filesArray.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        showToast(isRTL ? 'حجم الصورة يتعدى 5 ميجا' : 'Image exceeds 5MB limit');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProductRatings(prev => {
          const current = prev[productId] || { rating: 5, comment: '', files: [], previews: [] };
          return {
            ...prev,
            [productId]: {
              ...current,
              files: [...current.files, file],
              previews: [...current.previews, reader.result as string]
            }
          };
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveProductImage = (productId: string, imgIdx: number) => {
    setProductRatings(prev => {
      const current = prev[productId];
      if (!current) return prev;
      return {
        ...prev,
        [productId]: {
          ...current,
          files: current.files.filter((_, idx) => idx !== imgIdx),
          previews: current.previews.filter((_, idx) => idx !== imgIdx)
        }
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast(isRTL ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
      return;
    }
    setLoading(true);

    try {
      const itemsReviews: any[] = [];
      for (const item of order.items) {
        const itemReview = productRatings[item.id] || { rating: 5, comment: '', files: [], previews: [] };
        const uploadedUrls: string[] = [];
        for (const file of itemReview.files) {
          const url = await mediaService.uploadImage(file, `reviews/${item.id}`);
          uploadedUrls.push(url);
        }
        itemsReviews.push({ item, itemReview, uploadedUrls });
      }

      await import('../../services/shared/app.service').then(m => m.appService.submitMultiReview(
        order.id, ratingStore, ratingDriver, ratingProducts, comment, itemsReviews, currentUser
      ));
      showToast(isRTL ? 'تم تقديم تقييمك بنجاح!' : 'Your review was submitted successfully!');
      onClose();
    } catch (err) {
      console.error('Error submitting review:', err);
      alert(isRTL ? 'حدث خطأ أثناء إرسال التقييم' : 'Error submitting review');
    } finally {
      setLoading(false);
    }
  };

  const StarRating: React.FC<{
    value: number;
    onChange: (val: number) => void;
    label: string;
  }> = ({ value, onChange, label }) => {
    return (
      <div className="space-y-1">
        <label className="text-[10px] font-black text-theme-text block">{label}</label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              disabled={loading}
              className={`p-0.5 transition-transform active:scale-90 hover:scale-105 ${
                star <= value ? 'text-amber-500' : 'text-theme-border'
              }`}
            >
              <Star size={20} fill={star <= value ? 'currentColor' : 'none'} strokeWidth={2} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-theme-card border border-theme-border rounded-[32px] p-5 max-w-md w-full space-y-5 shadow-2xl relative my-8 theme-transition flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-theme-border/60 pb-3 shrink-0">
          <div>
            <h3 className="font-black text-sm text-theme-text">
              {isRTL ? 'تقييم تجربة الشراء والمنتجات' : 'Rate Products & Order'}
            </h3>
            <p className="text-[9px] text-theme-muted font-bold mt-0.5">
              {isRTL ? `للطلب رقم: ${order.id}` : `Order ID: ${order.id}`}
            </p>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="p-2 text-theme-muted hover:text-theme-text bg-theme-bg hover:bg-theme-border/60 rounded-full transition"
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-5 py-1">
          {/* Section 1: Store & Rider Ratings */}
          <div className="bg-theme-bg/30 p-4 border border-theme-border rounded-2xl space-y-4">
            <h4 className="font-black text-xs text-theme-text border-b border-theme-border/60 pb-1.5">
              {isRTL ? 'تقييم التجربة العامة' : 'General Experience'}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <StarRating 
                value={ratingStore} 
                onChange={setRatingStore} 
                label={isRTL ? 'تقييم المتجر والخدمة' : 'Store & Service'} 
              />
              <StarRating 
                value={ratingDriver} 
                onChange={setRatingDriver} 
                label={isRTL ? 'تقييم مندوب التوصيل' : 'Delivery Rider'} 
              />
            </div>
            <StarRating 
              value={ratingProducts} 
              onChange={setRatingProducts} 
              label={isRTL ? 'جودة وتعبئة الطلب العام' : 'Overall Quality & Packaging'} 
            />

            <div className="space-y-1">
              <label className="text-[9px] font-black text-theme-text block">
                {isRTL ? 'ملاحظات عامة (اختياري)' : 'General Comments (Optional)'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={loading}
                className="w-full bg-theme-card border border-theme-border rounded-xl p-2.5 text-xs font-bold focus:border-primary outline-none text-theme-text transition h-16 resize-none"
                placeholder={isRTL ? 'اكتب ملاحظاتك هنا...' : 'Tell us about your experience...'}
              />
            </div>
          </div>

          {/* Section 2: Product Specific Ratings */}
          <div className="space-y-4">
            <h4 className="font-black text-xs text-theme-text border-b border-theme-border/60 pb-1.5 px-1">
              {isRTL ? 'تقييم المنتجات المشتراة' : 'Rate Purchased Items'}
            </h4>

            {order.items.map((item: any) => {
              const itemReview = productRatings[item.id] || { rating: 5, comment: '', files: [], previews: [] };
              
              return (
                <div key={item.id} className="p-4 border border-theme-border rounded-2xl bg-theme-card/50 space-y-3.5">
                  <div className="flex items-center gap-3">
                    <img 
                      src={item.imgUrl} 
                      alt={item.name} 
                      className="w-10 h-10 object-cover rounded-lg border border-theme-border shrink-0" 
                    />
                    <div className="min-w-0 flex-1">
                      <h5 className="font-black text-xs text-theme-text truncate leading-tight">{item.name}</h5>
                      <span className="text-[9px] text-theme-muted font-bold block mt-0.5">
                        {item.price} {t('currencyEGP')} × {item.quantity}
                      </span>
                    </div>
                  </div>

                  {/* Stars for this product */}
                  <StarRating 
                    value={itemReview.rating}
                    onChange={(val) => handleProductRatingChange(item.id, val)}
                    label={isRTL ? 'تقييم المنتج:' : 'Item Rating:'}
                  />

                  {/* Comment for this product */}
                  <div className="space-y-1">
                    <input 
                      type="text"
                      placeholder={isRTL ? 'رأيك في هذا المنتج بالتفصيل (اختياري)...' : 'Write a review for this item (Optional)...'}
                      value={itemReview.comment}
                      onChange={(e) => handleProductCommentChange(item.id, e.target.value)}
                      disabled={loading}
                      className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none text-theme-text transition"
                    />
                  </div>

                  {/* Images for this product */}
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-theme-muted block uppercase tracking-wider">
                      {isRTL ? 'أضف صور المنتج (بحد أقصى 5 ميجا)' : 'Attach Product Images (Max 5MB)'}
                    </label>
                    
                    <div className="flex flex-wrap gap-2 items-center">
                      {itemReview.previews.map((prev, imgIdx) => (
                        <div key={imgIdx} className="relative w-12 h-12 rounded-xl overflow-hidden border border-theme-border shrink-0">
                          <img src={prev} className="w-full h-full object-cover" alt="preview" />
                          <button
                            type="button"
                            onClick={() => handleRemoveProductImage(item.id, imgIdx)}
                            disabled={loading}
                            className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600 transition"
                          >
                            <Trash2 size={8} />
                          </button>
                        </div>
                      ))}
                      
                      <label className="w-12 h-12 border-2 border-dashed border-theme-border hover:border-primary/40 rounded-xl flex flex-col items-center justify-center cursor-pointer transition shrink-0 bg-theme-bg/50">
                        <Upload size={14} className="text-theme-muted" />
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          disabled={loading}
                          onChange={(e) => handleProductImageUpload(item.id, e)}
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl shadow-lg mt-2 transition flex items-center justify-center gap-2 text-xs"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              isRTL ? 'إرسال جميع التقييمات والملاحظات' : 'Submit All Reviews'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
