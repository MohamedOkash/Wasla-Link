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
  BarChart3 
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

export const AdminDashboard = () => {
  const { t, isRTL, goHome } = useApp();
  
  const [activeTab, setActiveTab] = useState<'stores' | 'categories' | 'users' | 'drivers' | 'monitor' | 'banners' | 'delivery' | 'analytics'>('stores');


  return (
    <div className="flex flex-col min-h-screen bg-theme-bg theme-transition pb-24 text-theme-text font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-theme-card/85 backdrop-blur-md border-b border-theme-border/60 px-5 pt-12 pb-4 shadow-sm theme-transition">
        <div className="max-w-[1200px] w-full mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-primary-hover text-white p-2.5 rounded-2xl shadow-lg shadow-primary/25">
              <LayoutGrid size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-theme-text">{t('adminDashboard')}</h1>
              <p className="text-[10px] text-theme-muted font-bold mt-0.5 uppercase tracking-wider">
                {isRTL ? 'لوحة التحكم والمراقبة الرئيسية للمنصة' : 'Platform Operations & Control Center'}
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

      {/* Tabs Menu Navigation */}
      <nav className="bg-theme-card/50 backdrop-blur-sm border-b border-theme-border/40 py-2 sticky top-[73px] z-30 theme-transition overflow-hidden">
        <div className="max-w-[1200px] w-full mx-auto px-4 flex overflow-x-auto no-scrollbar gap-2">
          {[
            { id: 'stores', label: isRTL ? 'المتاجر' : 'Stores', icon: StoreIcon },
            { id: 'categories', label: isRTL ? 'الكتالوج والأقسام' : 'Catalog Center', icon: FolderOpen },
            { id: 'users', label: isRTL ? 'الأعضاء' : 'Users', icon: Users },
            { id: 'drivers', label: isRTL ? 'السائقين' : 'Drivers', icon: Bike },
            { id: 'monitor', label: isRTL ? 'مراقبة السوق' : 'Market Monitor', icon: Activity },
            { id: 'banners', label: isRTL ? 'الإعلانات' : 'Banners', icon: Tag },
            { id: 'delivery', label: isRTL ? 'إعدادات التوصيل' : 'Delivery Rates', icon: Truck },
            { id: 'analytics', label: isRTL ? 'التحليلات' : 'Analytics', icon: BarChart3 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4.5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 flex-shrink-0 text-xs font-black select-none ${
                  isActive 
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-102' 
                    : 'text-theme-muted hover:text-theme-text hover:bg-theme-card border border-transparent hover:border-theme-border/40'
                }`}
              >
                <Icon size={14} className={isActive ? 'animate-pulse' : ''} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sub components content */}
      <main className="p-5 flex-grow max-w-[1200px] w-full mx-auto">
        <div className="animate-fade-in duration-300">
          {activeTab === 'stores' && <StoreApprovals />}
          {activeTab === 'categories' && <CatalogManagement />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'drivers' && <DriverManagement />}
          {activeTab === 'monitor' && <MarketplaceMonitor />}
          {activeTab === 'banners' && <BannerManagement />}
          {activeTab === 'delivery' && <DeliveryConfig />}
          {activeTab === 'analytics' && <Analytics />}
        </div>
      </main>
    </div>
  );
};

