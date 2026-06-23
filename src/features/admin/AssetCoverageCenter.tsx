import { useTranslation } from '../../hooks/useTranslation';
import React, { useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { PremiumStatCard } from '../../components/premium/PremiumStatCard';
import { Image, AlertTriangle, Layers, Percent } from 'lucide-react';
import { useStores } from '../../hooks/useStores';
import { useProducts } from '../../hooks/useProducts';

export const AssetCoverageCenter: React.FC = () => {
  const { isRTL } = useApp();
  const { stores } = useStores();
  const { products } = useProducts();;

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
          <h2 className="text-xl font-black text-theme-text">{t('str_377')}</h2>
          <p className="text-xs text-theme-muted mt-1">{t('str_378')}</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PremiumStatCard
          title={t('str_379')}
          value={`${stats.productImageCoverage}%`}
          change={t('str_380')}
          changeType={stats.productImageCoverage > 90 ? 'positive' : stats.productImageCoverage > 70 ? 'neutral' : 'negative'}
          icon={<Image size={16} />}
        />
        <PremiumStatCard
          title={t('str_381')}
          value={`${stats.productGalleryCoverage}%`}
          change={t('str_382')}
          changeType={stats.productGalleryCoverage > 50 ? 'positive' : 'neutral'}
          icon={<Layers size={16} />}
        />
        <PremiumStatCard
          title={t('str_383')}
          value={`${stats.storeLogoCoverage}%`}
          change={t('str_384')}
          changeType={stats.storeLogoCoverage === 100 ? 'positive' : 'negative'}
          icon={<Percent size={16} />}
        />
        <PremiumStatCard
          title={t('str_385')}
          value={`${stats.storeCoverCoverage}%`}
          change={t('str_384')}
          changeType={stats.storeCoverCoverage === 100 ? 'positive' : 'negative'}
          icon={<Percent size={16} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing Primary Images List */}
        <PremiumCard className="p-5 flex flex-col h-96">
          <h3 className="text-sm font-black text-red-500 flex items-center gap-2 mb-4">
            <AlertTriangle size={18} />
            {t('str_386')}
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-auto">
              {stats.missingProductImage.length}
            </span>
          </h3>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            {stats.missingProductImage.length === 0 ? (
              <div className="h-full flex items-center justify-center text-theme-muted text-xs font-bold">
                {t('str_387')}
              </div>
            ) : (
              stats.missingProductImage.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-theme-bg p-3 rounded-xl border border-theme-border/50">
                  <span className="text-xs font-bold text-theme-text">{p.name}</span>
                  <span className="text-[9px] text-theme-muted bg-theme-card px-2 py-1 rounded-md">{t('str_388')} {p.id}</span>
                </div>
              ))
            )}
          </div>
        </PremiumCard>

        {/* Missing Galleries List */}
        <PremiumCard className="p-5 flex flex-col h-96">
          <h3 className="text-sm font-black text-amber-500 flex items-center gap-2 mb-4">
            <AlertTriangle size={18} />
            {t('str_389')}
            <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-auto">
              {stats.missingProductGallery.length}
            </span>
          </h3>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            {stats.missingProductGallery.length === 0 ? (
              <div className="h-full flex items-center justify-center text-theme-muted text-xs font-bold">
                {t('str_390')}
              </div>
            ) : (
              stats.missingProductGallery.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-theme-bg p-3 rounded-xl border border-theme-border/50">
                  <span className="text-xs font-bold text-theme-text truncate max-w-[70%]">{p.name}</span>
                  <span className="text-[9px] text-theme-muted bg-theme-card px-2 py-1 rounded-md">{t('str_391')} {stores.find(s => s.id === p.storeId)?.name || p.storeId}</span>
                </div>
              ))
            )}
          </div>
        </PremiumCard>
      </div>

    </div>
  );
};
