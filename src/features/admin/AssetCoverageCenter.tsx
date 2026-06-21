import React, { useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { PremiumStatCard } from '../../components/premium/PremiumStatCard';
import { Image, AlertTriangle, Layers, Percent } from 'lucide-react';

export const AssetCoverageCenter: React.FC = () => {
  const { products, stores, isRTL } = useApp();

  const stats = useMemo(() => {
    // Products calculations
    const totalProducts = products.length;
    const productsWithImages = products.filter(p => p.imageUrl && p.imageUrl.trim() !== '').length;
    const productsWithGalleries = products.filter(p => p.gallery && p.gallery.length > 0).length;
    
    const productImageCoverage = totalProducts ? Math.round((productsWithImages / totalProducts) * 100) : 0;
    const productGalleryCoverage = totalProducts ? Math.round((productsWithGalleries / totalProducts) * 100) : 0;

    // Stores calculations
    const totalStores = stores.length;
    const storesWithLogo = stores.filter(s => s.logoUrl && s.logoUrl.trim() !== '').length;
    const storesWithCover = stores.filter(s => s.coverUrl && s.coverUrl.trim() !== '').length;

    const storeLogoCoverage = totalStores ? Math.round((storesWithLogo / totalStores) * 100) : 0;
    const storeCoverCoverage = totalStores ? Math.round((storesWithCover / totalStores) * 100) : 0;

    const missingProductImage = products.filter(p => !p.imageUrl || p.imageUrl.trim() === '');
    const missingProductGallery = products.filter(p => !p.gallery || p.gallery.length === 0);

    return {
      totalProducts,
      productsWithImages,
      productImageCoverage,
      productsWithGalleries,
      productGalleryCoverage,
      missingProductImage,
      missingProductGallery,
      totalStores,
      storeLogoCoverage,
      storeCoverCoverage
    };
  }, [products, stores]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 text-primary rounded-xl">
          <Image size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-theme-text">{isRTL ? 'مركز تغطية الأصول' : 'Asset Coverage Center'}</h2>
          <p className="text-xs text-theme-muted mt-1">{isRTL ? 'مراقبة اكتمال الصور والوسائط للمنتجات والمتاجر' : 'Monitor media completeness for products and stores'}</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PremiumStatCard
          title={isRTL ? 'تغطية صور المنتجات الأساسية' : 'Primary Image Coverage'}
          value={`${stats.productImageCoverage}%`}
          change={isRTL ? `${stats.productsWithImages} من ${stats.totalProducts}` : `${stats.productsWithImages} of ${stats.totalProducts}`}
          changeType={stats.productImageCoverage > 90 ? 'positive' : stats.productImageCoverage > 70 ? 'neutral' : 'negative'}
          icon={<Image size={16} />}
        />
        <PremiumStatCard
          title={isRTL ? 'تغطية المعرض (جاليري)' : 'Gallery Coverage'}
          value={`${stats.productGalleryCoverage}%`}
          change={isRTL ? `${stats.productsWithGalleries} منتج به صور إضافية` : `${stats.productsWithGalleries} products with galleries`}
          changeType={stats.productGalleryCoverage > 50 ? 'positive' : 'neutral'}
          icon={<Layers size={16} />}
        />
        <PremiumStatCard
          title={isRTL ? 'تغطية شعارات المتاجر' : 'Store Logos Coverage'}
          value={`${stats.storeLogoCoverage}%`}
          change={isRTL ? 'تحليل لجميع المتاجر النشطة' : 'Across all active stores'}
          changeType={stats.storeLogoCoverage === 100 ? 'positive' : 'negative'}
          icon={<Percent size={16} />}
        />
        <PremiumStatCard
          title={isRTL ? 'تغطية أغطية المتاجر' : 'Store Covers Coverage'}
          value={`${stats.storeCoverCoverage}%`}
          change={isRTL ? 'تحليل لجميع المتاجر النشطة' : 'Across all active stores'}
          changeType={stats.storeCoverCoverage === 100 ? 'positive' : 'negative'}
          icon={<Percent size={16} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing Primary Images List */}
        <PremiumCard className="p-5 flex flex-col h-96">
          <h3 className="text-sm font-black text-red-500 flex items-center gap-2 mb-4">
            <AlertTriangle size={18} />
            {isRTL ? 'منتجات بدون صورة أساسية' : 'Products Missing Primary Image'}
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-auto">
              {stats.missingProductImage.length}
            </span>
          </h3>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            {stats.missingProductImage.length === 0 ? (
              <div className="h-full flex items-center justify-center text-theme-muted text-xs font-bold">
                {isRTL ? 'ممتاز! جميع المنتجات تحتوي على صور أساسية.' : 'Excellent! All products have primary images.'}
              </div>
            ) : (
              stats.missingProductImage.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-theme-bg p-3 rounded-xl border border-theme-border/50">
                  <span className="text-xs font-bold text-theme-text">{p.name}</span>
                  <span className="text-[9px] text-theme-muted bg-theme-card px-2 py-1 rounded-md">{isRTL ? 'معرف:' : 'ID:'} {p.id}</span>
                </div>
              ))
            )}
          </div>
        </PremiumCard>

        {/* Missing Galleries List */}
        <PremiumCard className="p-5 flex flex-col h-96">
          <h3 className="text-sm font-black text-amber-500 flex items-center gap-2 mb-4">
            <AlertTriangle size={18} />
            {isRTL ? 'منتجات بدون معرض صور (جاليري)' : 'Products Missing Gallery'}
            <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-auto">
              {stats.missingProductGallery.length}
            </span>
          </h3>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            {stats.missingProductGallery.length === 0 ? (
              <div className="h-full flex items-center justify-center text-theme-muted text-xs font-bold">
                {isRTL ? 'جميع المنتجات تحتوي على معارض.' : 'All products have galleries.'}
              </div>
            ) : (
              stats.missingProductGallery.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-theme-bg p-3 rounded-xl border border-theme-border/50">
                  <span className="text-xs font-bold text-theme-text truncate max-w-[70%]">{p.name}</span>
                  <span className="text-[9px] text-theme-muted bg-theme-card px-2 py-1 rounded-md">{isRTL ? 'متجر:' : 'Store:'} {stores.find(s => s.id === p.storeId)?.name || p.storeId}</span>
                </div>
              ))
            )}
          </div>
        </PremiumCard>
      </div>

    </div>
  );
};
