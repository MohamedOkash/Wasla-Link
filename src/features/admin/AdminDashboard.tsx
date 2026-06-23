import { useTranslation } from '../../hooks/useTranslation';
import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { 
  LayoutGrid, 
  LogOut, 
  Store as StoreIcon, 
  FolderOpen, 
  Users, 
  Bike, 
  Activity, 
  Tag, 
  Truck, 
  BarChart3,
  Image as ImageIcon,
  Shield,
  Navigation
} from 'lucide-react';

import PremiumButton from '../../components/premium/PremiumButton';
import StoreApprovals from './StoreApprovals';
import CatalogManagement from './CatalogManagement';
import UserManagement from './UserManagement';
import DriverManagement from './DriverManagement';
import MarketplaceMonitor from './MarketplaceMonitor';
import BannerManagement from './BannerManagement';
import { DeliveryConfig } from './DeliveryConfig';
import Analytics from './Analytics';
import { AssetCoverageCenter } from './AssetCoverageCenter';
import { SecurityCenter } from './SecurityCenter';
import { LogisticsCenter } from './LogisticsCenter';
import { FinancialCenter } from './FinancialCenter';
import { SettlementRequests } from './SettlementRequests';

export const AdminDashboard = () => {
  const { t } = useTranslation();
  const {} = useTranslation();

  const { isRTL, goHome } = useApp();
  
  const [activeTab, setActiveTab] = useState<'home' | 'stores' | 'categories' | 'users' | 'drivers' | 'monitor' | 'banners' | 'delivery' | 'analytics' | 'assets' | 'security' | 'logistics' | 'finance' | 'settlements'>('home');

  const adminModules = [
    { id: 'stores', label: t('str_348'), icon: StoreIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'categories', label: t('str_349'), icon: FolderOpen, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'users', label: t('str_350'), icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'drivers', label: t('str_351'), icon: Bike, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'logistics', label: t('str_352'), icon: Navigation, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'monitor', label: t('str_353'), icon: Activity, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'banners', label: t('str_354'), icon: Tag, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { id: 'assets', label: t('str_355'), icon: ImageIcon, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { id: 'delivery', label: t('str_356'), icon: Truck, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'analytics', label: t('str_357'), icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'finance', label: 'Finance', icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
    { id: 'settlements', label: 'Settlements', icon: Activity, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { id: 'security', label: t('str_358'), icon: Shield, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-theme-bg theme-transition pb-24 text-theme-text font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-theme-card/85 backdrop-blur-md border-b border-theme-border/60 px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 shadow-sm theme-transition">
        <div className="max-w-[1200px] w-full mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-primary-hover text-white p-2.5 rounded-2xl shadow-lg shadow-primary/25">
              <LayoutGrid size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-theme-text">{t('adminDashboard')}</h1>
              <p className="text-[10px] text-theme-muted font-bold mt-0.5 uppercase tracking-wider">
                {t('str_359')}
              </p>
            </div>
          </div>
          
          <PremiumButton
            variant="ghost"
            size="sm"
            onClick={goHome}
            className="p-2.5 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500/15 active:scale-95 transition"
            title={t('logOut')}
          >
            <LogOut size={16} />
          </PremiumButton>
        </div>
      </header>

      {/* Sub components content */}
      <main className="p-4 md:p-5 flex-grow max-w-[1200px] w-full mx-auto pb-24">
        {activeTab === 'home' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-fade-in">
            {adminModules.map(mod => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveTab(mod.id as any)}
                  className="bg-theme-card border border-theme-border/60 hover:border-primary/50 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-lg active:scale-95 group"
                >
                  <div className={`p-4 rounded-2xl ${mod.bg} ${mod.color} group-hover:scale-110 transition-transform`}>
                    <Icon size={28} />
                  </div>
                  <span className="text-xs font-black text-center text-theme-text">{mod.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="animate-fade-in duration-300">
            {activeTab === 'stores' && <StoreApprovals />}
            {activeTab === 'categories' && <CatalogManagement />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'drivers' && <DriverManagement />}
            {activeTab === 'logistics' && <LogisticsCenter />}
            {activeTab === 'monitor' && <MarketplaceMonitor />}
            {activeTab === 'banners' && <BannerManagement />}
            {activeTab === 'assets' && <AssetCoverageCenter />}
            {activeTab === 'delivery' && <DeliveryConfig />}
            {activeTab === 'analytics' && <Analytics />}
            {activeTab === 'security' && <SecurityCenter />}
            {activeTab === 'finance' && <FinancialCenter />}
            {activeTab === 'settlements' && <SettlementRequests />}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-theme-card/90 backdrop-blur-md border-t border-theme-border/60 pb-[env(safe-area-inset-bottom)] z-50">
        <div className="flex justify-around items-center h-16 max-w-[1200px] mx-auto px-2">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'home' ? 'text-primary' : 'text-theme-muted'}`}
          >
            <LayoutGrid size={20} className={activeTab === 'home' ? 'animate-bounce-slight' : ''} />
            <span className="text-[10px] font-black">{t('str_360')}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('monitor')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'monitor' ? 'text-primary' : 'text-theme-muted'}`}
          >
            <Activity size={20} className={activeTab === 'monitor' ? 'animate-bounce-slight' : ''} />
            <span className="text-[10px] font-black">{t('str_361')}</span>
          </button>

          <button 
            onClick={() => setActiveTab('stores')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'stores' ? 'text-primary' : 'text-theme-muted'}`}
          >
            <StoreIcon size={20} className={activeTab === 'stores' ? 'animate-bounce-slight' : ''} />
            <span className="text-[10px] font-black">{t('str_348')}</span>
          </button>

          <button 
            onClick={() => setActiveTab('users')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'users' ? 'text-primary' : 'text-theme-muted'}`}
          >
            <Users size={20} className={activeTab === 'users' ? 'animate-bounce-slight' : ''} />
            <span className="text-[10px] font-black">{t('str_350')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

