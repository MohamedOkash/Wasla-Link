import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, Package, Loader2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { db } from '../../services/firebase';
import { collection, query, where, orderBy, limit, startAfter, getDocs, DocumentData, QueryConstraint } from 'firebase/firestore';

interface VendorTemplatePickerProps {
  onClose: () => void;
  onSelect: (template: any) => void;
}

export const VendorTemplatePicker: React.FC<VendorTemplatePickerProps> = ({ onClose, onSelect }) => {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentData | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchTemplates = async (isLoadMore = false) => {
    if (!isLoadMore) {
      setLoading(true);
      setTemplates([]);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      let qConstraints: QueryConstraint[] = [];

      if (selectedCategory !== 'all') {
        qConstraints.push(where('category', '==', selectedCategory));
      }
      
      if (selectedBrand !== 'all') {
        qConstraints.push(where('brand', '==', selectedBrand));
      }

      // Simple keyword search approximation in Firestore
      // For a robust search, an external search engine is recommended,
      // but for this UI we use a combination of precise filtering or prefix matching.
      if (searchTerm.trim() !== '') {
        const field = isRTL ? 'nameAr' : 'nameEn';
        qConstraints.push(where(field, '>=', searchTerm));
        qConstraints.push(where(field, '<=', searchTerm + '\uf8ff'));
      }

      // Default ordering
      if (searchTerm.trim() === '') {
        qConstraints.push(orderBy(isRTL ? 'nameAr' : 'nameEn', 'asc'));
      } else {
        qConstraints.push(orderBy(isRTL ? 'nameAr' : 'nameEn', 'asc'));
      }

      qConstraints.push(limit(50));

      if (isLoadMore && lastDoc) {
        qConstraints.push(startAfter(lastDoc));
      }

      const q = query(collection(db, 'catalogTemplates'), ...qConstraints);
      const snapshot = await getDocs(q);

      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (isLoadMore) {
        setTemplates(prev => [...prev, ...docs]);
      } else {
        setTemplates(docs);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 50);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchTemplates();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, selectedBrand, language]);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loadingMore && !loading) {
        fetchTemplates(true);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-[120] animate-fade-in">
      <div className="bg-theme-card border border-theme-border rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col h-[85vh] theme-transition">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-theme-border">
          <div>
            <h2 className="text-xl font-black text-theme-text flex items-center gap-2">
              <Package className="text-primary" size={24} />
              {t('addFromCatalog')}
            </h2>
            <p className="text-xs text-theme-muted mt-1">{t('searchTemplates')}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-theme-bg text-theme-muted hover:text-theme-text rounded-xl transition">
            <X size={20} />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="p-5 border-b border-theme-border bg-theme-bg/50 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted" size={16} />
            <input 
              type="text" 
              placeholder={t('searchTemplates')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border rounded-xl pr-10 pl-4 py-2.5 text-sm font-bold text-theme-text focus:border-primary outline-none transition"
            />
          </div>
          <div>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-2.5 text-sm font-bold text-theme-text focus:border-primary outline-none transition"
            >
              <option value="all">{t('filterByCategory')}</option>
              <option value="supermarket">{isRTL ? 'السوبر ماركت' : 'Supermarket'}</option>
              <option value="pharmacy">{isRTL ? 'الصيدلية' : 'Pharmacy'}</option>
              {/* Add more categories here based on your data structure */}
            </select>
          </div>
          <div>
            <select 
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-2.5 text-sm font-bold text-theme-text focus:border-primary outline-none transition"
            >
              <option value="all">{t('filterByBrand')}</option>
              {/* Add dynamically loaded brands if needed, or predefined */}
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 p-5 overflow-y-auto no-scrollbar"
        >
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : templates.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-theme-muted">
              <Package size={48} className="opacity-20 mb-3" />
              <p className="font-bold">{t('str_113')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {templates.map(template => (
                <div 
                  key={template.id}
                  onClick={() => onSelect(template)}
                  className="bg-theme-bg border border-theme-border rounded-2xl p-3 cursor-pointer hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all group"
                >
                  <div className="aspect-square rounded-xl bg-white mb-3 overflow-hidden border border-theme-border/50 relative">
                    <img 
                      src={template.imageUrl || template.fallbackImageUrl} 
                      alt={isRTL ? template.nameAr : template.nameEn}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-black text-theme-text line-clamp-2 leading-tight">
                      {isRTL ? template.nameAr : template.nameEn}
                    </h3>
                    <p className="text-[10px] text-theme-muted font-bold truncate">
                      {isRTL ? template.brand : (template.brandEn || template.brand)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[9px] px-2 py-0.5 bg-theme-border rounded-lg text-theme-text font-bold">
                        {isRTL ? template.category : (template.categoryEn || template.category)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {loadingMore && (
                <div className="col-span-full flex justify-center py-4">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
