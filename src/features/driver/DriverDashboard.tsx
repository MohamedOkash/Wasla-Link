import React, { useState } from 'react';
import { BarChart3, ClipboardList, User, LogOut, Bike, Star, Power } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { DriverOrders } from './DriverOrders';
import { DriverProfile } from './DriverProfile';

export const DriverDashboard: React.FC = () => {
  const { goHome, currentUser, lang, isRTL, orders, drivers, toggleDriverOnline, driverMetrics } = useApp();
  const [activeTab, setActiveTab] = useState<'summary' | 'orders' | 'profile'>('summary');

  const driverId = currentUser?.email || 'd1';
  const driverName = currentUser?.name || 'كابتن محمود رضا';

  // Get driver's details
  const driverDetail = drivers.find(d => d.id === 'd1') || {
    id: 'd1',
    name: driverName,
    isOnline: true,
    rating: 4.8
  };

  // Calculations
  const driverOrders = orders.filter(o => o.driverId === driverId);
  const activeCount = driverOrders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
  const completedCount = driverOrders.filter(o => o.status === 'delivered').length;
  const earnings = driverOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.deliveryFee, 0);

  const availableCount = orders.filter(o => o.status === 'readyForPickup' && !o.driverId).length;

  const metrics = driverMetrics[driverDetail.id] || {
    driverId: driverDetail.id,
    todayEarnings: earnings,
    weeklyEarnings: earnings * 5,
    monthlyEarnings: earnings * 20,
    lifetimeEarnings: earnings * 80,
    acceptanceRate: 98,
    completionRate: 97,
    averageDeliveryTime: 22,
    completedDeliveries: completedCount
  };

  return (
    <div className="flex flex-col min-h-screen bg-theme-bg theme-transition pb-20 text-theme-text">
      {/* Top Header */}
      <div className="bg-theme-card px-5 pt-12 pb-4 shadow-sm border-b border-theme-border flex justify-between items-center sticky top-0 z-30 theme-transition">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-white p-2.5 rounded-xl">
            <Bike size={20} />
          </div>
          <div>
            <h1 className="text-base font-black text-theme-text truncate max-w-[180px]">{driverName}</h1>
            <p className="text-[10px] text-theme-muted font-bold mt-0.5">
              {isRTL ? 'لوحة توصيل الطلبات للمندوبين' : 'Driver Delivery Workspace'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Online/Offline Toggle */}
          <button
            onClick={() => toggleDriverOnline(driverDetail.id)}
            className={`p-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              driverDetail.isOnline 
                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/15' 
                : 'bg-red-500/10 text-red-500 hover:bg-red-500/15'
            }`}
            title={driverDetail.isOnline ? (isRTL ? 'متصل' : 'Online') : (isRTL ? 'غير متصل' : 'Offline')}
          >
            <Power size={16} />
            <span className="text-[10px] font-black hidden md:inline">
              {driverDetail.isOnline ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'مغلق' : 'Inactive')}
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
          { id: 'summary', label: isRTL ? 'لوحة القيادة' : 'Dashboard', icon: BarChart3 },
          { id: 'orders', label: `${isRTL ? 'المهام والطلبات' : 'Dispatches'} (${activeCount + availableCount})`, icon: ClipboardList },
          { id: 'profile', label: isRTL ? 'حسابي والركوبة' : 'My Account', icon: User },
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
      <div className="p-5 flex-1 max-w-[1200px] w-full mx-auto">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            
            {/* Quick Earnings Dashboard */}
            <div className="bg-gradient-to-br from-primary to-primary-hover text-white rounded-[32px] p-6 shadow-lg shadow-primary/10 relative overflow-hidden flex flex-col justify-between h-44">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider opacity-80">{isRTL ? 'محفظة الأرباح (الرصيد المتاح)' : 'Wallet Total Balance'}</span>
                <h2 className="text-3xl font-black mt-2">{metrics.todayEarnings} ج.م</h2>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/20 text-[10px] font-bold text-center">
                <div>
                  <span className="opacity-75 block">{isRTL ? 'أرباح الأسبوع' : 'Weekly'}</span>
                  <span className="font-black text-sm block mt-0.5">{metrics.weeklyEarnings} ج.م</span>
                </div>
                <div>
                  <span className="opacity-75 block">{isRTL ? 'أرباح الشهر' : 'Monthly'}</span>
                  <span className="font-black text-sm block mt-0.5">{metrics.monthlyEarnings} ج.م</span>
                </div>
                <div>
                  <span className="opacity-75 block">{isRTL ? 'مدى الحياة' : 'Lifetime'}</span>
                  <span className="font-black text-sm block mt-0.5">{metrics.lifetimeEarnings} ج.م</span>
                </div>
              </div>
            </div>

            {/* Stats Summary Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-theme-card border border-theme-border p-4 rounded-[22px] text-center shadow-sm theme-transition">
                <span className="text-[9px] text-theme-muted font-black block">{isRTL ? 'طلبات نشطة' : 'Active'}</span>
                <span className="text-lg font-black text-theme-text mt-1.5 block">{activeCount}</span>
              </div>
              <div className="bg-theme-card border border-theme-border p-4 rounded-[22px] text-center shadow-sm theme-transition">
                <span className="text-[9px] text-theme-muted font-black block">{isRTL ? 'طلبات متاحة' : 'Available'}</span>
                <span className="text-lg font-black text-theme-text mt-1.5 block">{availableCount}</span>
              </div>
              <div className="bg-theme-card border border-theme-border p-4 rounded-[22px] text-center shadow-sm theme-transition">
                <span className="text-[9px] text-theme-muted font-black block">{isRTL ? 'التقييم العام' : 'Rating'}</span>
                <span className="text-lg font-black text-amber-500 mt-1.5 block flex items-center justify-center gap-0.5">
                  <Star size={14} fill="currentColor" /> {driverDetail.rating}
                </span>
              </div>
              <div className="bg-theme-card border border-theme-border p-4 rounded-[22px] text-center shadow-sm theme-transition">
                <span className="text-[9px] text-theme-muted font-black block">{isRTL ? 'الرحلات الناجحة' : 'Completed'}</span>
                <span className="text-lg font-black text-theme-text mt-1.5 block">{metrics.completedDeliveries}</span>
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="bg-theme-card border border-theme-border rounded-[28px] p-5 shadow-sm theme-transition grid grid-cols-3 gap-2 text-center text-xs font-bold">
              <div className="border-l border-theme-border/60 last:border-0 pl-2">
                <span className="text-[9px] text-theme-muted font-black block">{isRTL ? 'معدل القبول' : 'Acceptance Rate'}</span>
                <span className="text-sm font-black text-green-500 mt-1 block">{metrics.acceptanceRate}%</span>
              </div>
              <div className="border-l border-theme-border/60 last:border-0 pl-2">
                <span className="text-[9px] text-theme-muted font-black block">{isRTL ? 'معدل الإكمال' : 'Completion Rate'}</span>
                <span className="text-sm font-black text-green-500 mt-1 block">{metrics.completionRate}%</span>
              </div>
              <div>
                <span className="text-[9px] text-theme-muted font-black block">{isRTL ? 'متوسط زمن التوصيل' : 'Avg Delivery Time'}</span>
                <span className="text-sm font-black text-primary mt-1 block">{metrics.averageDeliveryTime} {isRTL ? 'دقيقة' : 'mins'}</span>
              </div>
            </div>

            {/* Driver Guidelines / Status alert */}
            <div className={`p-4 rounded-2xl border flex gap-3 items-center ${
              driverDetail.isOnline 
                ? 'bg-green-500/10 border-green-500/20 text-green-900 dark:text-green-300' 
                : 'bg-red-500/10 border-red-500/20 text-red-900 dark:text-red-300'
            }`}>
              <div className={`p-2.5 rounded-xl ${driverDetail.isOnline ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <Bike size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black">
                  {driverDetail.isOnline 
                    ? (isRTL ? 'أنت متصل بالشبكة وجاهز للاستلام!' : 'You are online and ready!')
                    : (isRTL ? 'حسابك مغلق حالياً، لن تتلقى طلبات.' : 'You are offline, turn active to receive orders.')
                  }
                </h4>
                <p className="text-[9px] font-bold mt-0.5 opacity-80">
                  {driverDetail.isOnline 
                    ? (isRTL ? 'سيتم تنبيهك فور توفر طلبات جديدة بالقرب منك.' : 'New orders in your zone will prompt immediately.')
                    : (isRTL ? 'قم بتعديل الحالة من الزر بالأعلى للبدء.' : 'Change status trigger on top to begin.')
                  }
                </p>
              </div>
            </div>

            {/* Quick Trip Log list */}
            <div className="bg-theme-card border border-theme-border rounded-[28px] p-5 space-y-4 shadow-sm theme-transition">
              <h3 className="font-black text-theme-text text-sm border-b border-theme-border/60 pb-3">
                {isRTL ? 'سجل آخر التوصيلات المكتملة' : 'Recent Completed Trip Logs'}
              </h3>
              {completedCount === 0 ? (
                <p className="text-xs text-theme-muted text-center py-6 font-bold">
                  {isRTL ? 'لا توجد عمليات توصيل مسجلة حالياً.' : 'No completed deliveries logged yet.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {driverOrders.filter(o => o.status === 'delivered').slice(0, 3).map(o => (
                    <div key={o.id} className="flex justify-between items-center text-xs font-bold border-b border-theme-border/60 pb-2.5 last:border-b-0 last:pb-0">
                      <div>
                        <span className="text-theme-text block">{o.shopName}</span>
                        <span className="text-[9px] text-theme-muted mt-0.5 block">{new Date(o.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <span className="text-green-500 font-black">+{o.deliveryFee} ج.م</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'orders' && <DriverOrders />}

        {activeTab === 'profile' && <DriverProfile />}
      </div>
    </div>
  );
};

export default DriverDashboard;
