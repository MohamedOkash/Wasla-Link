import { useTranslation } from '../../hooks/useTranslation';
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
import { useStores } from '../../hooks/useStores';

interface ChartData {
  label: string;
  value: number;
}

const MiniLineChart: React.FC<{ data: ChartData[]; color?: string }> = ({ data, color = '#ff5722' }) => {
  if (data.length === 0) return null;
  const values = data.map(d => d.value);
  const max = Math.max(...values, 10);
  const min = Math.min(...values, 0);
  const range = max - min || 10;

  const width = 500;
  const height = 150;
  const padding = 25;

  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full bg-theme-card border border-theme-border/60 rounded-2xl p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="currentColor" className="opacity-10" strokeDasharray="4" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="currentColor" className="opacity-10" strokeDasharray="4" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="opacity-20" />

        <polyline fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />

        {data.map((d, index) => {
          const x = padding + (index / (data.length - 1)) * (width - padding * 2);
          const y = height - padding - ((d.value - min) / range) * (height - padding * 2);
          return (
            <g key={index} className="group">
              <circle cx={x} cy={y} r="4" fill="#fff" stroke={color} strokeWidth="2" />
              <text x={x} y={y - 8} textAnchor="middle" className="text-[9px] font-black fill-theme-text opacity-80">
                {d.value}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-[9px] font-bold text-theme-muted mt-2 px-4">
        {data.map((d, idx) => <span key={idx}>{d.label}</span>)}
      </div>
    </div>
  );
};

const MiniBarChart: React.FC<{ data: ChartData[]; color?: string }> = ({ data, color = '#4f46e5' }) => {
  if (data.length === 0) return null;
  const values = data.map(d => d.value);
  const max = Math.max(...values, 5);
  
  const width = 500;
  const height = 150;
  const padding = 25;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const barWidth = (chartWidth / data.length) * 0.6;
  const gap = (chartWidth / data.length) * 0.4;

  return (
    <div className="w-full bg-theme-card border border-theme-border/60 rounded-2xl p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="currentColor" className="opacity-10" strokeDasharray="4" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="opacity-20" />

        {data.map((d, index) => {
          const barHeight = (d.value / max) * chartHeight;
          const x = padding + index * (barWidth + gap) + gap / 2;
          const y = height - padding - barHeight;

          return (
            <g key={index} className="group">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx="4"
                className="opacity-90 hover:opacity-100 transition-opacity"
              />
              <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className="text-[9px] font-black fill-theme-text">
                {d.value}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-[9px] font-bold text-theme-muted mt-2 px-2">
        {data.map((d, idx) => (
          <span key={idx} style={{ width: `${100 / data.length}%`, textAlign: 'center' }} className="truncate">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export const Analytics: React.FC = () => {
  const { t } = useTranslation();
  const { orders, isRTL } = useApp();
  const { stores } = useStores();;
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
    return <div className="p-8 text-center animate-pulse">{t('str_362')}</div>;
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
    const perf = analyticsService.getDriverPerformance(d.id || '', orders);
    return { ...d, ...perf };
  }).sort((a, b) => b.driverScore - a.driverScore).slice(0, 10);

  // Customer Leaderboard
  const customerPerformances = customers.map(c => {
    const perf = analyticsService.getCustomerAnalytics(c.id || c.uid, orders);
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

  // Aggregate revenue for the last 7 days (Part 12)
  const last7DaysData = Array.from({ length: 7 }).map((_, index) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - index));
    const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayStart = d.setHours(0,0,0,0);
    const dayEnd = d.setHours(23,59,59,999);

    const dayRevenue = orders
      .filter(o => {
        const t = new Date(o.createdAt).getTime();
        return t >= dayStart && t <= dayEnd && o.status !== 'cancelled';
      })
      .reduce((sum, o) => sum + (o.total || 0), 0);

    return { label: dayStr, value: Math.round(dayRevenue) };
  });

  // Aggregate category orders distribution (Part 12)
  const categoryData = stores.map(store => {
    const storeOrders = orders.filter(o => o.shopId === store.id);
    return {
      label: store.name.slice(0, 10),
      value: storeOrders.length
    };
  }).filter(c => c.value > 0).slice(0, 7);

  const errorCount = 0;
  const failedOrders = orders.filter(o => o.status === 'cancelled').length;

  return (
    <div className="space-y-8 animate-fade-in text-theme-text pb-10">
      
      {/* 1. Marketplace Overview */}
      <section>
        <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-primary">
          <Activity size={20} /> {t('str_363')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <PremiumStatCard title={t('str_364')} value={kpi.totalUsers.toString()} icon={<Users size={16} />} />
          <PremiumStatCard title={t('str_348')} value={kpi.totalStores.toString()} icon={<StoreIcon size={16} />} />
          <PremiumStatCard title={t('str_351')} value={kpi.totalDrivers.toString()} icon={<Bike size={16} />} />
          <PremiumStatCard title={t('str_365')} value={kpi.totalOrdersCount.toString()} icon={<ClipboardList size={16} />} />
          <PremiumStatCard title={t('str_366')} value={`${kpi.totalGMV} ${t('currencyEGP')}`} icon={<Wallet size={16} />} />
        </div>
      </section>

      {/* Real SVG Charts Performance Panel (Part 12) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PremiumCard className="p-4">
          <h4 className="font-black text-xs text-theme-text mb-3 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-orange-500" />
            <span>{isRTL ? 'إيرادات الـ 7 أيام الماضية' : 'Revenue Growth (Last 7 Days)'}</span>
          </h4>
          <MiniLineChart data={last7DaysData} color="#ff5722" />
        </PremiumCard>

        <PremiumCard className="p-4">
          <h4 className="font-black text-xs text-theme-text mb-3 flex items-center gap-1.5">
            <ClipboardList size={14} className="text-indigo-500" />
            <span>{isRTL ? 'توزيع الطلبات حسب المتجر' : 'Orders Distribution by Store'}</span>
          </h4>
          <MiniBarChart data={categoryData} color="#4f46e5" />
        </PremiumCard>
      </div>

      {/* 2. Logistics Overview */}
      <section>
        <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-primary">
          <Navigation size={20} /> {t('str_367')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PremiumStatCard title={t('str_368')} value={kpi.activeDrivers.toString()} icon={<Bike size={16} />} />
          <PremiumStatCard title={t('str_369')} value={kpi.busyDrivers.toString()} icon={<Truck size={16} />} />
          <PremiumStatCard title={t('str_370')} value={kpi.availableDrivers.toString()} icon={<Users size={16} />} />
          <PremiumStatCard title={t('str_371')} value={kpi.ordersInDelivery.toString()} icon={<TrendingUp size={16} />} />
        </div>
      </section>

      {/* 3. Time Analytics */}
      <section>
        <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-primary">
          <FolderOpen size={20} /> {t('str_372')}
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <PremiumCard className="p-4 flex flex-col justify-center items-center">
            <span className="text-sm font-bold text-theme-muted">{t('str_373')}</span>
            <span className="text-2xl font-black">{ordersToday}</span>
          </PremiumCard>
          <PremiumCard className="p-4 flex flex-col justify-center items-center">
            <span className="text-sm font-bold text-theme-muted">{t('str_374')}</span>
            <span className="text-2xl font-black">{ordersThisWeek}</span>
          </PremiumCard>
          <PremiumCard className="p-4 flex flex-col justify-center items-center">
            <span className="text-sm font-bold text-theme-muted">{t('str_375')}</span>
            <span className="text-2xl font-black">{ordersThisMonth}</span>
          </PremiumCard>
        </div>
      </section>

      {/* 4. Production Monitoring */}
      <section>
        <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-primary">
          <Activity size={20} /> {t('str_376')}
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
            <span className="text-lg font-black">{kpi.avgDeliveryTime} {t('str_191')}</span>
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
                  <span className="font-black text-primary">{c.totalSpending} {t('currencyEGP')}</span>
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
