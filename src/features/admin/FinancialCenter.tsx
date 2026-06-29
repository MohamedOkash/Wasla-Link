import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, Activity, Settings, ArrowRight } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, doc, getDoc, getDocs, updateDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { PlatformSettings, LedgerTransaction, SettlementRequest } from '../../types/financial';
import { useTranslation } from '../../hooks/useTranslation';
import { useApp } from '../../contexts/AppContext';
import { DEFAULT_PLATFORM_SETTINGS } from '../../services/deliveryFee.service';
import { platformSettingsRepository } from "../../services/admin/repository";

export function FinancialCenter() {
  const { t } = useTranslation();
  const { showToast } = useApp();
  const [platformRevenue, setPlatformRevenue] = useState(0);
  const [vendorLiabilities, setVendorLiabilities] = useState(0);
  const [driverLiabilities, setDriverLiabilities] = useState(0);
  const [pendingSettlements, setPendingSettlements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PlatformSettings>({ ...DEFAULT_PLATFORM_SETTINGS });
  
  useEffect(() => {
    async function loadFinances() {
      try {
        const platRef = await getDoc(doc(db, 'platformLedger', 'master'));
        if (platRef.exists()) {
          setPlatformRevenue(platRef.data().totalRevenue || 0);
        }

        const vWallets = await getDocs(collection(db, 'vendorWallets'));
        let vTotal = 0;
        vWallets.forEach(w => vTotal += w.data().balance || 0);
        setVendorLiabilities(vTotal);

        const dWallets = await getDocs(collection(db, 'driverWallets'));
        let dTotal = 0;
        dWallets.forEach(w => dTotal += w.data().balance || 0);
        setDriverLiabilities(dTotal);

        const qSet = query(collection(db, 'settlementRequests'), where('status', '==', 'pending'));
        const sSnap = await getDocs(qSet);
        let sTotal = 0;
        sSnap.forEach(s => sTotal += s.data().amount || 0);
        setPendingSettlements(sTotal);

        const setRef = await getDoc(doc(db, 'platformSettings', 'default'));
        if (setRef.exists()) {
          setSettings(setRef.data() as PlatformSettings);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadFinances();
  }, []);

  const saveSettings = async () => {
    try {
      await platformSettingsRepository.update('default', { ...settings });
      showToast(t('settingsUpdated'));
    } catch (err) {
      console.error(err);
      showToast(t('settingsFailed'));
    }
  };

  if (loading) return <div>{t('loading')}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-theme-text pb-20">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">{t('financialCenter')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-theme-primary to-purple-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2 opacity-80">
            <TrendingUp className="w-5 h-5" />
            <p className="font-medium">{t('platformRevenue')}</p>
          </div>
          <p className="text-4xl font-bold">{platformRevenue.toFixed(2)} {t('currencyEGP')}</p>
        </div>

        <div className="bg-theme-card p-6 rounded-2xl border border-theme-border/60 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-theme-text/70">
            <CreditCard className="w-5 h-5" />
            <p className="font-medium">{t('vendorLiabilities')}</p>
          </div>
          <p className="text-3xl font-bold text-red-500">{vendorLiabilities.toFixed(2)} {t('currencyEGP')}</p>
        </div>

        <div className="bg-theme-card p-6 rounded-2xl border border-theme-border/60 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-theme-text/70">
            <CreditCard className="w-5 h-5" />
            <p className="font-medium">{t('driverLiabilities')}</p>
          </div>
          <p className="text-3xl font-bold text-red-500">{driverLiabilities.toFixed(2)} {t('currencyEGP')}</p>
        </div>

        <div className="bg-theme-card p-6 rounded-2xl border border-theme-border/60 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-theme-text/70">
            <Activity className="w-5 h-5" />
            <p className="font-medium">{t('pendingSettlements')}</p>
          </div>
          <p className="text-3xl font-bold text-yellow-500">{pendingSettlements.toFixed(2)} {t('currencyEGP')}</p>
        </div>
      </div>

      <div className="bg-theme-card rounded-2xl border border-theme-border/60 overflow-hidden mt-8">
        <div className="p-6 border-b border-theme-border/60 flex items-center gap-3">
          <Settings className="w-6 h-6 text-theme-primary" />
          <h2 className="text-xl font-bold">{t('monetizationControls')}</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <label className="block text-sm font-medium mb-2">{t('platformCommission')}</label>
            <input 
              type="number" 
              value={settings.commissionPercent} 
              onChange={e => setSettings({...settings, commissionPercent: Number(e.target.value)})}
              className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('driverBonus')}</label>
            <input 
              type="number" 
              value={settings.driverBonusPercent} 
              onChange={e => setSettings({...settings, driverBonusPercent: Number(e.target.value)})}
              className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-theme-bg rounded-xl border border-theme-border/60">
            <div>
              <p className="font-medium">{t('freeDeliverySubsidy')}</p>
              <p className="text-sm text-theme-text/60">{t('freeDeliverySubsidyDesc')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={settings.freeDeliveryEnabled} onChange={e => setSettings({...settings, freeDeliveryEnabled: e.target.checked})} />
              <div className="w-11 h-6 bg-theme-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-theme-bg rounded-xl border border-theme-border/60">
            <div>
              <p className="font-medium">{t('financialMaintenanceLock')}</p>
              <p className="text-sm text-theme-text/60">{t('financialMaintenanceLockDesc')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={settings.maintenanceRevenueLock} onChange={e => setSettings({...settings, maintenanceRevenueLock: e.target.checked})} />
              <div className="w-11 h-6 bg-theme-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
            </label>
          </div>

        </div>
        <div className="p-6 border-t border-theme-border/60 bg-theme-bg/50 flex justify-end">
          <button 
            onClick={saveSettings}
            className="bg-theme-primary text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            {t('saveMonetizationSettings')}
          </button>
        </div>
      </div>
    </div>
  );
}
