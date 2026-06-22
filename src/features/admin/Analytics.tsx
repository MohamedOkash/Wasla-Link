import React, { useEffect, useState } from 'react';
import { Store as StoreIcon, ClipboardList, Wallet, Users, FolderOpen, Star, TrendingUp, DollarSign, Award, Truck, Bike, Navigation, Activity } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { analyticsService, StorePerformance, DriverPerformance, CustomerAnalytics } from '../../services/analytics.service';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { PremiumStatCard } from '../../components/premium/PremiumStatCard';
import { PremiumBadge } from '../../components/premium/PremiumBadge';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { User } from '../../types/user.types';

export const Analytics: React.FC = () => {
  const { stores, orders, isRTL } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) {
    return <div className="p-8 text-center animate-pulse">{isRTL ? 'جاري تحميل التحليلات...' : 'Loading Analytics...'}</div>;
  }

  const drivers = users.filter(u => u.role === 'driver');
  const customers = users.filter(u => u.role === 'customer');

  const kpi = analyticsService.getAdminKPIs(orders, users, stores, drivers);

  // Store Leaderboard
  const storePerformances = stores.map(s => {
    const perf = analyticsService.getStorePerformance(s.id, orders);
    return { ...s, ...perf };
  }).sort((a, b) => b.storeScore - a.storeScore).slice(0, 10);

  // Driver Leaderboard
  const driverPerformances = drivers.map(d => {
    const perf = analyticsService.getDriverPerformance(d.id, orders);
    return { ...d, ...perf };
  }).sort((a, b) => b.driverScore - a.driverScore).slice(0, 10);

  // Customer Leaderboard
  const customerPerformances = customers.map(c => {
    const perf = analyticsService.getCustomerAnalytics(c.id, orders);
    return { ...c, ...perf };
  }).sort((a, b) => b.totalSpending - a.totalSpending).slice(0, 10);

  // Time Analytics
  const now = Date.now();
  const todayStart = new Date().setHours(0,0,0,0);
  const weekStart = now - 7 * 24 * 60 * 60 * 1000;
  const monthStart = now - 30 * 24 * 60 * 60 * 1000;

  const ordersToday = orders.filter(o => new Date(o.createdAt).getTime() >= todayStart).length;
  const ordersThisWeek = orders.filter(o => new Date(o.createdAt).getTime() >= weekStart).length;
  const ordersThisMonth = orders.filter(o => new Date(o.createdAt).getTime() >= monthStart).length;

  // Production Monitoring
  const errorCount = 0; // Static placeholder unless we query errorLogs collection
  const failedOrders = orders.filter(o => o.status === 'cancelled').length;

  return (
    <div className="space-y-8 animate-fade-in text-theme-text pb-10">
      
      {/* 1. Marketplace Overview */}
      <section>
        <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-primary">
          <Activity size={20} /> {isRTL ? 'نظرة عامة على السوق' : 'Marketplace Overview'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <PremiumStatCard title={isRTL ? 'المستخدمين' : 'Users'} value={kpi.totalUsers.toString()} icon={<Users size={16} />} />
          <PremiumStatCard title={isRTL ? 'المتاجر' : 'Stores'} value={kpi.totalStores.toString()} icon={<StoreIcon size={16} />} />
          <PremiumStatCard title={isRTL ? 'السائقين' : 'Drivers'} value={kpi.totalDrivers.toString()} icon={<Bike size={16} />} />
          <PremiumStatCard title={isRTL ? 'الطلبات' : 'Orders'} value={kpi.totalOrdersCount.toString()} icon={<ClipboardList size={16} />} />
          <PremiumStatCard title={isRTL ? 'العوائد' : 'Revenue'} value={`${kpi.totalGMV} ج.م`} icon={<Wallet size={16} />} />
        </div>
      </section>

      {/* 2. Logistics Overview */}
      <section>
        <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-primary">
          <Navigation size={20} /> {isRTL ? 'نظرة عامة على اللوجستيات' : 'Logistics Overview'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PremiumStatCard title={isRTL ? 'سائقين نشطين' : 'Active Drivers'} value={kpi.activeDrivers.toString()} icon={<Bike size={16} />} />
          <PremiumStatCard title={isRTL ? 'سائقين مشغولين' : 'Busy Drivers'} value={kpi.busyDrivers.toString()} icon={<Truck size={16} />} />
          <PremiumStatCard title={isRTL ? 'سائقين متاحين' : 'Available Drivers'} value={kpi.availableDrivers.toString()} icon={<Users size={16} />} />
          <PremiumStatCard title={isRTL ? 'طلبات قيد التوصيل' : 'Orders In Delivery'} value={kpi.ordersInDelivery.toString()} icon={<TrendingUp size={16} />} />
        </div>
      </section>

      {/* 3. Time Analytics */}
      <section>
        <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-primary">
          <FolderOpen size={20} /> {isRTL ? 'تحليلات الوقت' : 'Time Analytics'}
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <PremiumCard className="p-4 flex flex-col justify-center items-center">
            <span className="text-sm font-bold text-theme-muted">{isRTL ? 'طلبات اليوم' : 'Orders Today'}</span>
            <span className="text-2xl font-black">{ordersToday}</span>
          </PremiumCard>
          <PremiumCard className="p-4 flex flex-col justify-center items-center">
            <span className="text-sm font-bold text-theme-muted">{isRTL ? 'طلبات هذا الأسبوع' : 'Orders This Week'}</span>
            <span className="text-2xl font-black">{ordersThisWeek}</span>
          </PremiumCard>
          <PremiumCard className="p-4 flex flex-col justify-center items-center">
            <span className="text-sm font-bold text-theme-muted">{isRTL ? 'طلبات هذا الشهر' : 'Orders This Month'}</span>
            <span className="text-2xl font-black">{ordersThisMonth}</span>
          </PremiumCard>
        </div>
      </section>

      {/* 4. Production Monitoring */}
      <section>
        <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-primary">
          <Activity size={20} /> {isRTL ? 'مراقبة الإنتاج' : 'Production Monitoring'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PremiumCard className="p-4">
            <h4 className="text-xs font-bold text-theme-muted mb-2">Firestore Reads</h4>
            <span className="text-lg font-black">Tracked by GCP</span>
          </PremiumCard>
          <PremiumCard className="p-4">
            <h4 className="text-xs font-bold text-theme-muted mb-2">Error Count</h4>
            <span className="text-lg font-black">{errorCount}</span>
          </PremiumCard>
          <PremiumCard className="p-4">
            <h4 className="text-xs font-bold text-theme-muted mb-2">Failed Orders</h4>
            <span className="text-lg font-black">{failedOrders}</span>
          </PremiumCard>
          <PremiumCard className="p-4">
            <h4 className="text-xs font-bold text-theme-muted mb-2">Avg Delivery Time</h4>
            <span className="text-lg font-black">{kpi.avgDeliveryTime} {isRTL ? 'دقيقة' : 'min'}</span>
          </PremiumCard>
        </div>
      </section>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Store Leaderboard */}
        <PremiumCard className="p-4">
          <h4 className="font-black text-sm mb-4 border-b border-theme-border/50 pb-2">Top 10 Stores</h4>
          <div className="space-y-3">
            {storePerformances.map((s, idx) => (
              <div key={s.id} className="flex justify-between text-xs">
                <span className="font-bold truncate pr-2">#{idx+1} {s.name}</span>
                <span className="font-black text-primary">{s.storeScore} pts</span>
              </div>
            ))}
          </div>
        </PremiumCard>

        {/* Driver Leaderboard */}
        <PremiumCard className="p-4">
          <h4 className="font-black text-sm mb-4 border-b border-theme-border/50 pb-2">Top 10 Drivers</h4>
          <div className="space-y-3">
            {driverPerformances.map((d, idx) => (
              <div key={d.id} className="flex justify-between text-xs">
                <span className="font-bold truncate pr-2">#{idx+1} {d.name}</span>
                <span className="font-black text-primary">{d.driverScore} pts</span>
              </div>
            ))}
          </div>
        </PremiumCard>

        {/* Customer Leaderboard */}
        <PremiumCard className="p-4">
          <h4 className="font-black text-sm mb-4 border-b border-theme-border/50 pb-2">Top 10 Customers</h4>
          <div className="space-y-3">
            {customerPerformances.map((c, idx) => (
              <div key={c.id} className="flex justify-between text-xs">
                <span className="font-bold truncate pr-2">#{idx+1} {c.name}</span>
                <div className="flex items-center gap-2">
                  <PremiumBadge variant="info" pill>{c.retentionStatus}</PremiumBadge>
                  <span className="font-black text-primary">{c.totalSpending} ج.م</span>
                </div>
              </div>
            ))}
          </div>
        </PremiumCard>

      </div>
    </div>
  );
};

export default Analytics;
