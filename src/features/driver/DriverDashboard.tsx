import React, { useState, useEffect } from 'react';
import { BarChart3, ClipboardList, User, LogOut, Bike, Star, Power, Wallet } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { DriverOrders } from './DriverOrders';
import { DriverProfile } from './DriverProfile';
import { DriverEarnings } from './DriverEarnings';

export const DriverDashboard: React.FC = () => {
  const { goHome, currentUser, isRTL, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'summary' | 'orders' | 'earnings' | 'profile'>('summary');
  const [driver, setDriver] = useState<any>(null);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'driver') return;
    
    const unsub = onSnapshot(doc(db, 'drivers', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setDriver({ id: docSnap.id, ...docSnap.data() });
      }
    });

    return () => unsub();
  }, [currentUser]);

  const toggleAvailability = async () => {
    if (!driver) return;
    try {
      const newStatus = driver.availability === 'online' ? 'offline' : 'online';
      await updateDoc(doc(db, 'drivers', driver.id), {
        availability: newStatus
      });
      showToast(
        isRTL 
          ? `أنت الآن ${newStatus === 'online' ? 'متصل' : 'غير متصل'}` 
          : `You are now ${newStatus}`
      );
    } catch (error) {
      console.error(error);
      showToast(isRTL ? 'حدث خطأ' : 'Error', 'error');
    }
  };

  if (!driver) {
    return <div className="h-screen bg-theme-bg flex items-center justify-center animate-pulse"><Bike size={40} className="text-primary" /></div>;
  }

  // Calculate metrics based on driver object (from Phase 14A driver schema)
  const isOnline = driver.availability === 'online';
  const isBusy = driver.availability === 'busy';

  return (
    <div className="flex flex-col min-h-screen bg-theme-bg theme-transition pb-20 text-theme-text">
      {/* Top Header */}
      <div className="bg-theme-card px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 shadow-sm border-b border-theme-border flex justify-between items-center sticky top-0 z-30 theme-transition">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-white p-2.5 rounded-xl">
            <Bike size={20} />
          </div>
          <div>
            <h1 className="text-base font-black text-theme-text truncate max-w-[180px]">{driver.name}</h1>
            <p className="text-[10px] text-theme-muted font-bold mt-0.5">
              {isRTL ? 'لوحة توصيل الطلبات للمندوبين' : 'Driver Delivery Workspace'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Online/Offline Toggle */}
          <button
            onClick={toggleAvailability}
            disabled={isBusy}
            className={`p-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              isBusy ? 'bg-amber-500/10 text-amber-500 opacity-50 cursor-not-allowed' :
              isOnline 
                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/15' 
                : 'bg-theme-border/50 text-theme-muted hover:text-theme-text'
            }`}
            title={isOnline ? (isRTL ? 'متصل' : 'Online') : (isRTL ? 'غير متصل' : 'Offline')}
          >
            <Power size={16} />
            <span className="text-[10px] font-black hidden md:inline">
              {isBusy ? (isRTL ? 'مشغول' : 'Busy') : isOnline ? (isRTL ? 'متصل' : 'Online') : (isRTL ? 'غير متصل' : 'Offline')}
            </span>
          </button>

          <button 
            onClick={goHome} 
            className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/15 transition flex items-center justify-center"
            title={isRTL ? 'تسجيل الخروج' : 'Log Out'}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="bg-theme-card px-3 py-2.5 border-b border-theme-border flex overflow-x-auto no-scrollbar gap-1.5 theme-transition">
        {[
          { id: 'summary', label: isRTL ? 'الرئيسية' : 'Dashboard', icon: BarChart3 },
          { id: 'orders', label: isRTL ? 'الطلبات' : 'Orders', icon: ClipboardList },
          { id: 'earnings', label: isRTL ? 'الأرباح' : 'Earnings', icon: Wallet },
          { id: 'profile', label: isRTL ? 'حسابي' : 'Account', icon: User },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition flex-shrink-0 ${
              activeTab === tab.id 
                ? 'bg-primary text-white font-black shadow-sm' 
                : 'text-theme-muted font-bold hover:text-theme-text hover:bg-theme-bg'
            }`}
          >
            <tab.icon size={15} />
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="p-5 flex-1 max-w-[1200px] w-full mx-auto pb-[120px]">
        {activeTab === 'summary' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Driver Guidelines / Status alert */}
            <div className={`p-4 rounded-2xl border flex gap-3 items-center ${
              isBusy ? 'bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-300' :
              isOnline 
                ? 'bg-green-500/10 border-green-500/20 text-green-900 dark:text-green-300' 
                : 'bg-theme-border/30 border-theme-border/50 text-theme-muted'
            }`}>
              <div className={`p-2.5 rounded-xl ${isBusy ? 'bg-amber-500/20 text-amber-500' : isOnline ? 'bg-green-500/20 text-green-500' : 'bg-theme-border text-theme-text'}`}>
                <Bike size={18} />
              </div>
              <div>
                <h4 className="text-sm font-black">
                  {isBusy 
                    ? (isRTL ? 'أنت في مهمة توصيل حالياً' : 'You are currently on a delivery')
                    : isOnline 
                    ? (isRTL ? 'أنت متصل ومستعد لاستقبال الطلبات' : 'You are online and ready!')
                    : (isRTL ? 'أنت غير متصل' : 'You are offline')
                  }
                </h4>
                <p className="text-[10px] font-bold mt-0.5 opacity-80">
                  {isBusy 
                    ? (isRTL ? 'يرجى إكمال الطلب الحالي لاستلام طلبات جديدة.' : 'Complete current order to receive new ones.')
                    : isOnline 
                    ? (isRTL ? 'سيتم تنبيهك فور توفر طلبات بالقرب منك.' : 'New orders will prompt immediately.')
                    : (isRTL ? 'قم بالاتصال لبدء استقبال الطلبات.' : 'Go online to receive orders.')
                  }
                </p>
              </div>
            </div>

            {/* Stats Summary Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-theme-card border border-theme-border p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-primary">
                  <ClipboardList size={18} />
                  <span className="text-xs font-black">{isRTL ? 'الطلبات المكتملة' : 'Completed'}</span>
                </div>
                <span className="text-2xl font-black text-theme-text block">{driver.completedOrders || 0}</span>
              </div>
              <div className="bg-theme-card border border-theme-border p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-amber-500">
                  <Star size={18} className="fill-amber-500" />
                  <span className="text-xs font-black">{isRTL ? 'التقييم العام' : 'Rating'}</span>
                </div>
                <span className="text-2xl font-black text-theme-text block">{driver.rating || 5.0}</span>
              </div>
              <div className="bg-theme-card border border-theme-border p-4 rounded-2xl shadow-sm col-span-2">
                <div className="flex items-center gap-2 mb-2 text-green-500">
                  <Wallet size={18} />
                  <span className="text-xs font-black">{isRTL ? 'إجمالي الأرباح' : 'Total Earnings'}</span>
                </div>
                <span className="text-3xl font-black text-theme-text block">{driver.totalEarnings || 0} <span className="text-sm text-theme-muted">ج.م</span></span>
              </div>
            </div>

            {/* Active Order Placeholder */}
            <div className="bg-theme-card border border-theme-border rounded-[28px] p-5 shadow-sm theme-transition">
               <h3 className="font-black text-theme-text text-sm flex items-center gap-2 border-b border-theme-border/60 pb-3">
                <Bike size={18} className="text-primary" />
                {isRTL ? 'الطلب الحالي' : 'Active Order'}
              </h3>
              {driver.currentOrderId ? (
                <div className="pt-4 text-center">
                  {/* Phase 14B logic will go here. For now just show a button to navigate to orders tab */}
                   <p className="text-xs font-bold text-amber-500 mb-3">{isRTL ? 'لديك طلب قيد التوصيل' : 'You have an active delivery'}</p>
                   <button onClick={() => setActiveTab('orders')} className="bg-primary text-white text-xs font-black py-2.5 px-6 rounded-xl shadow-md hover:bg-primary-hover transition">
                     {isRTL ? 'عرض الطلب' : 'View Order'}
                   </button>
                </div>
              ) : (
                <div className="pt-8 pb-4 text-center opacity-60">
                   <ClipboardList size={32} className="mx-auto mb-2 text-theme-muted" />
                   <p className="text-xs font-bold text-theme-muted">{isRTL ? 'لا يوجد طلب حالي' : 'No active order'}</p>
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'orders' && <DriverOrders driver={driver} />}
        {activeTab === 'earnings' && <DriverEarnings driver={driver} />}
        {activeTab === 'profile' && <DriverProfile driver={driver} />}
      </div>
    </div>
  );
};

export default DriverDashboard;
