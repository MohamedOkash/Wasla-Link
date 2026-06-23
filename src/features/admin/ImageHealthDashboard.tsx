import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Product } from '../../types/product.types';
import { Store } from '../../types/store.types';
import { useApp } from '../../contexts/AppContext';
import { 
  Heart, AlertTriangle, CheckCircle, Database, LayoutGrid, 
  Sparkles, TrendingUp, BarChart2, Loader2, RefreshCw 
} from 'lucide-react';

export const ImageHealthDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalAssets: 0,
    healthyAssets: 0,
    brokenAssets: 0,
    recoveredAssets: 0,
    coveragePct: 0,
    storeLogosMissing: 0,
    storeCoversMissing: 0,
    offerBannersMissing: 0,
    galleryCoveragePct: 0
  });

  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // 1. Fetch templates
      const templatesSnap = await getDocs(collection(db, 'productTemplates'));
      const templates = templatesSnap.docs.map(d => d.data() as Product);

      // 2. Fetch products
      const productsSnap = await getDocs(collection(db, 'products'));
      const products = productsSnap.docs.map(d => d.data() as Product);

      // 3. Fetch stores
      const storesSnap = await getDocs(collection(db, 'stores'));
      const stores = storesSnap.docs.map(d => d.data() as Store);

      // 4. Fetch recovery logs from /assets
      const recoveryQuery = query(collection(db, 'assets'), where('uploadedBy', '==', 'system_recovery'));
      const recoverySnap = await getDocs(recoveryQuery);
      const recoveredCount = recoverySnap.size;

      // Compute indicators
      const templatesWithImages = templates.filter(t => t.primaryImage || t.imageUrl || t.imgUrl).length;
      const productsWithImages = products.filter(p => p.primaryImage || p.imageUrl || p.imgUrl).length;

      const totalTemplates = templates.length;
      const totalProducts = products.length;
      const totalStores = stores.length;

      const totalAssets = totalTemplates + totalProducts + totalStores;
      const healthyAssets = templatesWithImages + productsWithImages + stores.filter(s => s.logoUrl && s.coverUrl).length * 2;
      const brokenAssets = (totalTemplates - templatesWithImages) + (totalProducts - productsWithImages);

      const coveragePct = totalTemplates + totalProducts > 0
        ? Math.round(((templatesWithImages + productsWithImages) / (totalTemplates + totalProducts)) * 100)
        : 0;

      const storeLogosMissing = stores.filter(s => !s.logoUrl).length;
      const storeCoversMissing = stores.filter(s => !s.coverUrl).length;
      const offerBannersMissing = stores.filter(s => !s.promoBanner).length;

      const galleryCoveragePct = totalTemplates > 0
        ? Math.round((templates.filter(t => t.galleryImages && t.galleryImages.length > 0).length / totalTemplates) * 100)
        : 0;

      setStats({
        totalAssets,
        healthyAssets,
        brokenAssets,
        recoveredAssets: recoveredCount,
        coveragePct,
        storeLogosMissing,
        storeCoversMissing,
        offerBannersMissing,
        galleryCoveragePct
      });

      // Generate System Alerts
      const newAlerts: string[] = [];
      if (coveragePct < 75) {
        newAlerts.push(isRTL 
          ? `نسبة تغطية الصور العامة منخفضة للغاية (${coveragePct}%). يرجى تشغيل استيراد الصور الجماعي.` 
          : `General asset coverage is critical (${coveragePct}%). Run bulk image importer.`
        );
      }
      if (brokenAssets > 0) {
        newAlerts.push(isRTL 
          ? `تم اكتشاف عدد ${brokenAssets} أصل بيكسل مكسور أو مفقود. شغل فحص استرداد الأصول.` 
          : `Detected ${brokenAssets} missing or broken asset URLs. Run asset recovery scanner.`
        );
      }
      if (storeLogosMissing > 0 || storeCoversMissing > 0) {
        newAlerts.push(isRTL 
          ? `هناك عدد ${storeLogosMissing} متجر بدون شعار و ${storeCoversMissing} متجر بدون غلاف.` 
          : `${storeLogosMissing} store logos and ${storeCoversMissing} store covers are missing.`
        );
      }
      if (galleryCoveragePct < 50) {
        newAlerts.push(isRTL 
          ? `تغطية معرض ألبوم الصور منخفضة (${galleryCoveragePct}%). القوالب تحتاج لرفع ألبومات إضافية.` 
          : `Template gallery coverage is low (${galleryCoveragePct}%). Templates require multi-image uploads.`
        );
      }

      setAlerts(newAlerts);
    } catch (err) {
      console.error(err);
      showToast(t('str_559'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-theme-text font-sans">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-theme-card p-5 rounded-3xl border border-theme-border/60 shadow-sm theme-transition">
          <Database size={16} className="text-primary mb-2.5" />
          <h5 className="text-[10px] text-theme-muted font-bold uppercase">{t('str_560')}</h5>
          <p className="text-xl font-black mt-1">{stats.totalAssets}</p>
        </div>

        <div className="bg-theme-card p-5 rounded-3xl border border-theme-border/60 shadow-sm theme-transition">
          <CheckCircle size={16} className="text-green-500 mb-2.5" />
          <h5 className="text-[10px] text-theme-muted font-bold uppercase">{t('str_561')}</h5>
          <p className="text-xl font-black text-green-500 mt-1">{stats.healthyAssets}</p>
        </div>

        <div className="bg-theme-card p-5 rounded-3xl border border-theme-border/60 shadow-sm theme-transition">
          <AlertTriangle size={16} className="text-red-500 mb-2.5" />
          <h5 className="text-[10px] text-theme-muted font-bold uppercase">{t('str_562')}</h5>
          <p className="text-xl font-black text-red-500 mt-1">{stats.brokenAssets}</p>
        </div>

        <div className="bg-theme-card p-5 rounded-3xl border border-theme-border/60 shadow-sm theme-transition">
          <Heart size={16} className="text-indigo-500 mb-2.5" />
          <h5 className="text-[10px] text-theme-muted font-bold uppercase">{t('str_563')}</h5>
          <p className="text-xl font-black text-indigo-500 mt-1">{stats.recoveredAssets}</p>
        </div>
      </div>

      {/* Coverage Progress Bar */}
      <div className="bg-theme-card p-5 rounded-3xl border border-theme-border/60 shadow-sm theme-transition">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-black">{t('str_564')}</span>
          <span className="text-xs font-black text-primary">{stats.coveragePct}%</span>
        </div>
        <div className="w-full h-2.5 bg-theme-bg rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${stats.coveragePct}%` }} />
        </div>
      </div>

      {/* Grid: Details Coverage & Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Coverage Details */}
        <div className="bg-theme-card p-5 rounded-3xl border border-theme-border/60 shadow-sm space-y-4 theme-transition">
          <h4 className="font-black text-xs text-theme-text uppercase tracking-wider border-b border-theme-border/60 pb-2 flex items-center gap-1.5">
            <BarChart2 size={14} className="text-primary" />
            {t('str_565')}
          </h4>

          <div className="space-y-3 text-xs font-bold text-theme-muted">
            <div className="flex justify-between items-center">
              <span>{t('str_566')}</span>
              <span className="text-theme-text font-black">{stats.galleryCoveragePct}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>{t('str_567')}</span>
              <span className="text-red-500 font-black">{stats.storeLogosMissing}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>{t('str_568')}</span>
              <span className="text-red-500 font-black">{stats.storeCoversMissing}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>{t('str_569')}</span>
              <span className="text-amber-500 font-black">{stats.offerBannersMissing}</span>
            </div>
          </div>
        </div>

        {/* Live Alerts */}
        <div className="bg-theme-card p-5 rounded-3xl border border-theme-border/60 shadow-sm space-y-4 theme-transition">
          <h4 className="font-black text-xs text-theme-text uppercase tracking-wider border-b border-theme-border/60 pb-2 flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-red-500" />
            {t('str_570')}
          </h4>

          <div className="space-y-2.5">
            {alerts.length === 0 ? (
              <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-xl text-center text-xs font-bold">
                {t('str_571')}
              </div>
            ) : (
              alerts.map((alert, idx) => (
                <div key={idx} className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-xs flex items-start gap-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{alert}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Visual Simulated Charts (Egyptian 4G friendly SVG charts) */}
      <div className="bg-theme-card p-5 rounded-3xl border border-theme-border/60 shadow-sm space-y-4 theme-transition">
        <h4 className="font-black text-xs text-theme-text uppercase tracking-wider border-b border-theme-border/60 pb-2">
          {t('str_572')}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Chart 1: Coverage Trend */}
          <div className="space-y-2">
            <h5 className="text-[10px] text-theme-muted font-bold uppercase">{t('str_573')}</h5>
            <div className="h-28 flex items-end gap-3.5 bg-theme-bg/30 p-3 rounded-2xl border border-theme-border/40">
              <div className="flex-1 bg-primary/20 h-[45%] rounded-t-lg relative group"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black opacity-0 group-hover:opacity-100 bg-black text-white px-1.5 py-0.5 rounded">45%</span></div>
              <div className="flex-1 bg-primary/40 h-[60%] rounded-t-lg relative group"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black opacity-0 group-hover:opacity-100 bg-black text-white px-1.5 py-0.5 rounded">60%</span></div>
              <div className="flex-1 bg-primary/60 h-[72%] rounded-t-lg relative group"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black opacity-0 group-hover:opacity-100 bg-black text-white px-1.5 py-0.5 rounded">72%</span></div>
              <div className="flex-1 bg-primary h-[85%] rounded-t-lg relative group"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black opacity-0 group-hover:opacity-100 bg-black text-white px-1.5 py-0.5 rounded">85%</span></div>
            </div>
          </div>

          {/* Chart 2: Recovery Trend */}
          <div className="space-y-2">
            <h5 className="text-[10px] text-theme-muted font-bold uppercase">{t('str_574')}</h5>
            <div className="h-28 flex items-end gap-3.5 bg-theme-bg/30 p-3 rounded-2xl border border-theme-border/40">
              <div className="flex-1 bg-indigo-500/20 h-[20%] rounded-t-lg"></div>
              <div className="flex-1 bg-indigo-500/40 h-[40%] rounded-t-lg"></div>
              <div className="flex-1 bg-indigo-500/60 h-[70%] rounded-t-lg"></div>
              <div className="flex-1 bg-indigo-500 h-[50%] rounded-t-lg"></div>
            </div>
          </div>

          {/* Chart 3: Upload Activity */}
          <div className="space-y-2">
            <h5 className="text-[10px] text-theme-muted font-bold uppercase">{t('str_575')}</h5>
            <div className="h-28 flex items-end gap-3.5 bg-theme-bg/30 p-3 rounded-2xl border border-theme-border/40">
              <div className="flex-1 bg-green-500/20 h-[30%] rounded-t-lg"></div>
              <div className="flex-1 bg-green-500/40 h-[55%] rounded-t-lg"></div>
              <div className="flex-1 bg-green-500/60 h-[45%] rounded-t-lg"></div>
              <div className="flex-1 bg-green-500 h-[90%] rounded-t-lg"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer scan action */}
      <div className="flex justify-end pt-2">
        <button 
          onClick={fetchStats}
          disabled={loading}
          className="bg-theme-card border border-theme-border hover:bg-theme-border-hover text-theme-text font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {t('str_576')}
        </button>
      </div>
    </div>
  );
};

export default ImageHealthDashboard;
