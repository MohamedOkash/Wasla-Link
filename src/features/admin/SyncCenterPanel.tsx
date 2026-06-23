import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { catalogSyncService } from '../../services/catalogSync.service';
import { Product } from '../../types/product.types';
import { useApp } from '../../contexts/AppContext';
import { RefreshCw, Play, Loader2, CheckCircle, AlertTriangle, Layers, Info } from 'lucide-react';

export const SyncCenterPanel: React.FC = () => {
  const { isRTL, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    syncedProducts: 0,
    outdatedProducts: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const templatesSnap = await getDocs(collection(db, 'productTemplates'));
      const templates = templatesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));

      const productsSnap = await getDocs(collection(db, 'products'));
      const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));

      let outdatedCount = 0;
      products.forEach(p => {
        if (p.templateId) {
          const temp = templates.find(t => t.id === p.templateId);
          if (temp) {
            const tempVer = temp.templateImageVersion || temp.assetVersion || 1;
            const prodVer = p.assetVersion || 0;
            if (prodVer < tempVer || p.syncStatus === 'outdated') {
              outdatedCount++;
            }
          }
        }
      });

      setStats({
        totalProducts: products.length,
        syncedProducts: products.length - outdatedCount,
        outdatedProducts: outdatedCount
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      const res = await catalogSyncService.syncAllProducts();
      showToast(isRTL 
        ? `اكتملت المزامنة بنجاح! تم فحص ${res.totalTemplates} قوالب وتحديث ${res.totalSynced} نسخة فروع.` 
        : `Cascaded updates complete. Synced ${res.totalSynced} products.`
      );
      await fetchStats();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-theme-card rounded-[30px] border border-theme-border/60 p-6 shadow-sm space-y-6 animate-fade-in theme-transition">
      <div>
        <h3 className="font-black text-theme-text text-sm flex items-center gap-2 border-b border-theme-border pb-2">
          <RefreshCw size={18} className="text-primary" />
          {t('str_663')}
        </h3>
        <p className="text-[10px] text-theme-muted font-bold mt-1 uppercase tracking-wider">
          {t('str_664')}
        </p>
      </div>

      {/* Sync stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-theme-bg p-4.5 rounded-2xl border border-theme-border/60 text-center">
          <Layers size={16} className="text-theme-muted mx-auto mb-1.5" />
          <span className="text-[10px] text-theme-muted font-bold block uppercase">{t('str_665')}</span>
          <span className="text-lg font-black text-theme-text mt-0.5 block">{stats.totalProducts}</span>
        </div>

        <div className="bg-theme-bg p-4.5 rounded-2xl border border-theme-border/60 text-center">
          <CheckCircle size={16} className="text-green-500 mx-auto mb-1.5" />
          <span className="text-[10px] text-theme-muted font-bold block uppercase">{t('str_666')}</span>
          <span className="text-lg font-black text-green-500 mt-0.5 block">{stats.syncedProducts}</span>
        </div>

        <div className="bg-theme-bg p-4.5 rounded-2xl border border-theme-border/60 text-center">
          <AlertTriangle size={16} className="text-red-500 mx-auto mb-1.5" />
          <span className="text-[10px] text-theme-muted font-bold block uppercase">{t('str_667')}</span>
          <span className="text-lg font-black text-red-500 mt-0.5 block">{stats.outdatedProducts}</span>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-5">
        <div className="space-y-1.5 text-xs font-bold text-theme-muted">
          <p className="text-theme-text font-black text-sm flex items-center gap-1.5">
            <Info size={14} className="text-primary" />
            {t('str_668')}
          </p>
          <ul className="list-disc pr-4 space-y-0.5">
            <li>{t('str_669')}</li>
            <li>{t('str_670')}</li>
          </ul>
        </div>

        <button 
          onClick={handleTriggerSync}
          disabled={syncing || stats.outdatedProducts === 0}
          className="bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white font-black px-6 py-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition shrink-0"
        >
          {syncing ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
          {t('str_671')}
        </button>
      </div>

      <div className="flex justify-end gap-2">
        <button 
          onClick={fetchStats}
          disabled={loading}
          className="bg-theme-bg border border-theme-border hover:bg-theme-border-hover text-theme-text font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {t('str_672')}
        </button>
      </div>
    </div>
  );
};

export default SyncCenterPanel;
