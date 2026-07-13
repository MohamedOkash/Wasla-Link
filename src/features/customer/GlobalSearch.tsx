import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { ChevronRight, X, Search, History, Sparkles, Folder } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { searchIndexCollection } from '../../services/search.service';
import { useStores } from '../../hooks/useStores';
import { useProducts } from '../../hooks/useProducts';

interface GlobalSearchProps {
  closeSearch: () => void;
  navigate: (name: string, params?: any) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ closeSearch, navigate }) => {
  const { t } = useTranslation();
  const { categories,  isRTL } = useApp();
  const { stores } = useStores();
  const { products } = useProducts();;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ shops: any[]; products: any[]; categories: any[] }>({ shops: [], products: [], categories: [] });
  const [sortBy, setSortBy] = useState<'relevance' | 'sales' | 'views' | 'favorites'>('relevance');
  
  // Sort products based on selected sorting criteria
  const sortedProducts = [...results.products].sort((a, b) => {
    if (sortBy === 'sales') {
      return (b.salesCount || 0) - (a.salesCount || 0);
    }
    if (sortBy === 'views') {
      return (b.viewsCount || 0) - (a.viewsCount || 0);
    }
    if (sortBy === 'favorites') {
      return (b.favoritesCount || 0) - (a.favoritesCount || 0);
    }
    return 0; // relevance is already sorted by search score
  });
  
  // Recent searches state
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('waslalink_recent_searches');
    return saved ? JSON.parse(saved) : ['كوكاكولا 330 مل', 'بنادول إكسترا', 'شيبسي', 'جهينة كامل الدسم'];
  });

  // Category matching
  const matchedCategories = results.categories || [];

  useEffect(() => {
    const delay = setTimeout(async () => {
      const trimmed = query.trim();
      if (!trimmed) {
        setResults({ shops: [], products: [], categories: [] });
        return;
      }
      try {
        const indexResults = await searchIndexCollection(trimmed);
        const shops: any[] = [];
        const matchedProducts: any[] = [];
        const matchedCategories: any[] = [];

        indexResults.forEach(item => {
          if (item.type === 'store' || item.type === 'restaurant' || item.type === 'pharmacy') {
            const found = stores.find(s => s.id === item.id);
            if (found) {
              shops.push(found);
            } else {
              shops.push({
                id: item.id,
                name: item.title,
                description: item.subtitle,
                logoUrl: item.metadata?.logo || '',
                averageRating: item.metadata?.rating || 5.0,
                isRestaurant: item.type === 'restaurant',
                isPharmacy: item.type === 'pharmacy'
              });
            }
          } else if (item.type === 'product') {
            const found = products.find(p => p.id === item.id);
            const shop = stores.find(s => s.id === item.metadata?.storeId);
            if (found) {
              matchedProducts.push({ ...found, shop });
            } else {
              matchedProducts.push({
                id: item.id,
                name: item.title,
                desc: item.subtitle,
                price: item.metadata?.price || 0,
                imgUrl: item.metadata?.imageUrl || '',
                storeId: item.metadata?.storeId || '',
                category: item.metadata?.category || '',
                shop
              });
            }
          } else if (item.type === 'category') {
            const found = categories.find(c => c.id === item.id);
            if (found) {
              matchedCategories.push(found);
            } else {
              matchedCategories.push({
                id: item.id,
                name: { ar: item.title, en: item.title },
                imgUrl: item.metadata?.icon || ''
              });
            }
          }
        });

        setResults({ shops, products: matchedProducts, categories: matchedCategories });
      } catch (err) {
        console.error('Search index execution error:', err);
      }
    }, 250);
    
    return () => clearTimeout(delay);
  }, [query, stores, products, categories]);

  const handleSearchTrigger = (searchWord: string) => {
    setQuery(searchWord);
    // Add to recent searches (limit 6, no duplicates)
    setRecentSearches(prev => {
      const filtered = prev.filter(w => w !== searchWord);
      const next = [searchWord, ...filtered].slice(0, 6);
      localStorage.setItem('waslalink_recent_searches', JSON.stringify(next));
      return next;
    });
  };

  const handleClearRecentSearch = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const next = prev.filter(w => w !== word);
      localStorage.setItem('waslalink_recent_searches', JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="absolute inset-0 bg-theme-bg z-[80] flex flex-col animate-fade-in theme-transition">
      {/* Top Search bar */}
      <div className="bg-theme-card px-4 pt-12 pb-4 shadow-sm flex items-center gap-3 border-b border-theme-border/60 theme-transition">
        <button 
          onClick={closeSearch} 
          className="p-2 text-theme-text bg-theme-bg hover:bg-theme-border/50 rounded-full transition"
        >
          <ChevronRight size={20} className={isRTL ? '' : 'rotate-180'} />
        </button>
        <div className="flex-1 relative">
          <input 
            autoFocus 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                handleSearchTrigger(query);
              }
            }}
            className={`w-full bg-theme-bg border border-theme-border rounded-xl py-3.5 ${
              isRTL ? 'pr-4 pl-10' : 'pl-4 pr-10'
            } text-xs focus:border-primary outline-none font-bold text-theme-text theme-transition`} 
            placeholder={t('searchPlaceholder')} 
          />
          {query ? (
            <button 
              onClick={() => setQuery('')} 
              className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-4 text-theme-muted hover:text-theme-text`}
            >
              <X size={15} />
            </button>
          ) : (
            <Search size={15} className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-4 text-theme-muted`} />
          )}
        </div>
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        
        {/* Suggestion / Recent state */}
        {!query.trim() ? (
          <div className="space-y-6">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="animate-fade-in">
                <h3 className="font-black mb-3 flex items-center gap-1.5 text-[10px] text-theme-muted uppercase tracking-wider">
                  <History size={13} /> {isRTL ? 'عمليات البحث الأخيرة' : 'Recent Searches'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((word, idx) => (
                    <div 
                      key={idx}
                      onClick={() => handleSearchTrigger(word)}
                      className="bg-theme-card border border-theme-border hover:border-primary/30 rounded-xl pl-2 pr-3 py-1.5 text-[11px] font-bold text-theme-text cursor-pointer flex items-center gap-1.5 shadow-sm theme-transition"
                    >
                      <span>{word}</span>
                      <button 
                        onClick={(e) => handleClearRecentSearch(e, word)}
                        className="text-theme-muted hover:text-red-500 rounded p-0.5 transition"
                      >
                        <X size={10} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            <div className="animate-fade-in">
              <h3 className="font-black mb-3 flex items-center gap-1.5 text-[10px] text-theme-muted uppercase tracking-wider">
                <Sparkles size={13} className="text-amber-500" /> {isRTL ? 'الأكثر بحثاً اليوم' : 'Popular Searches'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  isRTL ? 'كوكاكولا كانز' : 'Coca Cola Can', 
                  isRTL ? 'بنادول إكسترا' : 'Panadol Extra', 
                  isRTL ? 'شيبسي عائلي' : 'Chipsy Large', 
                  isRTL ? 'حليب جهينة' : 'Juhayna Milk', 
                  isRTL ? 'مشويات الباز' : 'Baz Grills',
                  isRTL ? 'بسبوسة الجمل' : 'Gamal Basbousa'
                ].map((word, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleSearchTrigger(word)}
                    className="bg-theme-card border border-theme-border hover:border-primary/20 rounded-xl px-3 py-1.5 text-[11px] font-bold text-theme-text shadow-sm hover:shadow transition"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : results.shops.length === 0 && results.products.length === 0 && matchedCategories.length === 0 ? (
          <div className="text-center text-theme-muted pt-20 animate-fade-in">
            <Search size={44} className="mx-auto mb-4 opacity-25 text-theme-text" />
            <p className="font-black text-sm text-theme-text">{t('noResults')}</p>
            <p className="text-[11px] mt-1">{isRTL ? 'يرجى كتابة كلمة بحث أخرى للوصول لمنتجات حقيقية.' : 'Try writing another search key to resolve catalogs.'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Category matches */}
            {matchedCategories.length > 0 && (
              <div className="animate-fade-in">
                <h3 className="font-black text-[10px] text-theme-muted uppercase tracking-wider mb-2.5 flex items-center gap-1">
                  <Folder size={12} /> {isRTL ? 'أقسام مطابقة' : 'Matching Categories'}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {matchedCategories.map(cat => (
                    <div
                      key={cat.id}
                      onClick={() => { closeSearch(); navigate('category', { catId: cat.id }); }}
                      className="bg-theme-card border border-theme-border rounded-xl p-2.5 flex items-center gap-2 cursor-pointer hover:border-primary/30 transition shadow-sm"
                    >
                      <img src={cat.imgUrl} className="w-8 h-8 rounded-lg object-cover" alt="" />
                      <span className="font-black text-xs text-theme-text truncate">{isRTL ? cat.name.ar : cat.name.en}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Store results */}
            {results.shops.length > 0 && (
              <div className="animate-fade-in">
                <h3 className="font-black text-[10px] text-theme-muted uppercase tracking-wider mb-2.5">{t('allStores')}</h3>
                <div className="space-y-2.5">
                  {results.shops.map(shop => (
                    <div 
                      key={shop.id} 
                      onClick={() => { handleSearchTrigger(query); closeSearch(); navigate('shop', { shop }); }} 
                      className="bg-theme-card p-3 rounded-2xl flex items-center gap-3 border border-theme-border cursor-pointer shadow-sm hover:border-primary/20 transition-all theme-transition"
                    >
                      <img src={shop.logoUrl} className="w-11 h-11 rounded-xl object-cover border border-theme-border bg-theme-bg" alt={shop.name} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-xs text-theme-text leading-tight">{shop.name}</h4>
                        <p className="text-[10px] text-theme-muted font-bold mt-1">
                          {categories.find(c => c.id === shop.catId)?.name.ar}
                        </p>
                      </div>
                      <ChevronRight size={14} className={`text-theme-muted ${isRTL ? '' : 'rotate-180'}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product results from ALL stores */}
            {results.products.length > 0 && (
              <div className="animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h3 className="font-black text-[10px] text-theme-muted uppercase tracking-wider">{t('products')}</h3>
                  {/* Sorting pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                    <button
                      onClick={() => setSortBy('relevance')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition ${
                        sortBy === 'relevance'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-theme-card border-theme-border text-theme-muted hover:text-theme-text'
                      }`}
                    >
                      {isRTL ? 'الصلة' : 'Relevance'}
                    </button>
                    <button
                      onClick={() => setSortBy('sales')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition ${
                        sortBy === 'sales'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-theme-card border-theme-border text-theme-muted hover:text-theme-text'
                      }`}
                    >
                      {isRTL ? 'البيع' : 'Sales'}
                    </button>
                    <button
                      onClick={() => setSortBy('views')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition ${
                        sortBy === 'views'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-theme-card border-theme-border text-theme-muted hover:text-theme-text'
                      }`}
                    >
                      {isRTL ? 'المشاهدة' : 'Views'}
                    </button>
                    <button
                      onClick={() => setSortBy('favorites')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition ${
                        sortBy === 'favorites'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-theme-card border-theme-border text-theme-muted hover:text-theme-text'
                      }`}
                    >
                      {isRTL ? 'المفضلة' : 'Favorites'}
                    </button>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {sortedProducts.map(prod => (
                    <div 
                      key={prod.id} 
                      onClick={() => { handleSearchTrigger(query); closeSearch(); navigate('product', { product: prod, shop: prod.shop }); }} 
                      className="bg-theme-card p-3 rounded-2xl flex items-center gap-3 border border-theme-border cursor-pointer shadow-sm hover:border-primary/20 transition-all theme-transition"
                    >
                      <img src={prod.imgUrl} className="w-12 h-12 rounded-xl object-cover bg-theme-bg border border-theme-border" alt={prod.name} />
                      <div className="flex-1 min-w-0 pr-1">
                        <h4 className="font-black text-xs text-theme-text truncate leading-tight">{prod.name}</h4>
                        <p className="text-[10px] text-theme-muted font-bold truncate mt-1">{prod.desc}</p>
                        <p className="text-xs font-black text-primary mt-1.5 flex items-center gap-2">
                          <span>{prod.price} {t('currencyEGP')}</span>
                          <span className="text-theme-muted font-bold text-[9px] bg-theme-bg px-2 py-0.5 rounded border border-theme-border">
                            {prod.shop?.name || 'المتجر'}
                          </span>
                        </p>
                      </div>
                      <ChevronRight size={14} className={`text-theme-muted ${isRTL ? '' : 'rotate-180'}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default GlobalSearch;
