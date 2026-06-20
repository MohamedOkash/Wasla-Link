import React from 'react';
import { Store as StoreIcon, ClipboardList, Wallet, Users, FolderOpen, Star, TrendingUp, DollarSign, Award, ThumbsUp } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { analyticsService } from '../../services/analytics.service';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { PremiumStatCard } from '../../components/premium/PremiumStatCard';
import { PremiumBadge } from '../../components/premium/PremiumBadge';

export const Analytics: React.FC = () => {
  const { stores, orders, categories, isRTL } = useApp();

  const kpi = analyticsService.getAdminKPIs(orders);

  const totalRevenue = kpi.totalGMV;
  const totalCommissions = kpi.totalCommissions;
  const totalOrders = kpi.totalOrdersCount;
  const approvedStores = stores.filter(s => s.status === 'approved');
  const totalCustomers = kpi.activeUsersCount;

  // Top Stores by Rating
  const topStores = [...stores]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  // Top Categories by Store Count
  const topCategories = categories.map(cat => ({
    name: typeof cat.name === 'object' ? cat.name.ar : cat.name,
    count: approvedStores.filter(s => s.catId === cat.id).length
  })).sort((a, b) => b.count - a.count).slice(0, 3);

  // Custom SVG Sparkline for Platform Sales Trend (Last 7 Days)
  const renderSalesTrendChart = (trend: number[]) => {
    if (trend.length === 0) return null;
    const max = Math.max(...trend, 100);
    const min = Math.min(...trend, 0);
    const range = max - min || 1;
    
    const height = 140;
    const width = 500;
    
    // Generate coordinate path for SVG polyline
    const points = trend.map((val, idx) => {
      const x = (idx / (trend.length - 1)) * (width - 40) + 20;
      const y = height - ((val - min) / range) * (height - 50) - 25;
      return `${x},${y}`;
    }).join(' ');

    const firstPointX = 20;
    const lastPointX = width - 20;
    const fillPoints = `${firstPointX},${height - 15} ${points} ${lastPointX},${height - 15}`;

    return (
      <PremiumCard hoverable={false} className="p-6 relative overflow-hidden">
        <div className="flex justify-between items-center mb-5">
          <div className="space-y-1">
            <h4 className="font-black text-sm text-theme-text flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              {isRTL ? 'تحليل حجم مبيعات المنصة الأسبوعي (GMV)' : 'Weekly Platform Sales Volume (GMV)'}
            </h4>
            <p className="text-[10px] text-theme-muted font-bold">
              {isRTL ? 'مراقبة المبيعات وتدفق السيولة الكلية بالمنصة' : 'Gross transaction volume across all local districts'}
            </p>
          </div>
          <PremiumBadge variant="info" pill>System Metrics</PremiumBadge>
        </div>

        <div className="flex justify-between items-baseline mb-4 text-[10px] font-black text-theme-muted bg-theme-bg border border-theme-border/40 px-3 py-1.5 rounded-lg">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            {isRTL ? `أعلى قيمة معاملات: ${max} ج.م` : `Peak Volume: ${max} EGP`}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            {isRTL ? `أدنى قيمة معاملات: ${min} ج.م` : `Floor Volume: ${min} EGP`}
          </span>
        </div>

        <div className="relative h-32 w-full mt-2">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="adminAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#FF7A00" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="adminLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FF7A00" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#8b5cf6" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Grid helper lines */}
            <line x1="20" y1={25} x2={width - 20} y2={25} stroke="var(--theme-border)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.6" />
            <line x1="20" y1={height / 2} x2={width - 20} y2={height / 2} stroke="var(--theme-border)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.6" />
            <line x1="20" y1={height - 25} x2={width - 20} y2={height - 25} stroke="var(--theme-border)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.6" />
            
            {/* Area Fill */}
            <polygon
              points={fillPoints}
              fill="url(#adminAreaGrad)"
            />

            {/* Sparkline curve */}
            <polyline
              fill="none"
              stroke="url(#adminLineGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
              filter="url(#glow)"
            />

            {/* Nodes */}
            {trend.map((val, idx) => {
              const x = (idx / (trend.length - 1)) * (width - 40) + 20;
              const y = height - ((val - min) / range) * (height - 50) - 25;
              const isLast = idx === trend.length - 1;
              return (
                <g key={idx} className="cursor-pointer">
                  <circle
                    cx={x}
                    cy={y}
                    r={isLast ? "6" : "4"}
                    className="fill-theme-card stroke-primary"
                    strokeWidth={isLast ? "3" : "2"}
                  />
                  {isLast && (
                    <circle
                      cx={x}
                      cy={y}
                      r="10"
                      className="fill-primary/20 animate-ping"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex justify-between text-[9px] font-black text-theme-muted mt-3 border-t border-theme-border/50 pt-2.5">
          <span>{isRTL ? 'منذ 6 أيام' : '6 days ago'}</span>
          <span>{isRTL ? 'منذ 3 أيام' : '3 days ago'}</span>
          <span>{isRTL ? 'اليوم' : 'Today'}</span>
        </div>
      </PremiumCard>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in text-theme-text pb-10">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <PremiumStatCard
          title={isRTL ? 'إجمالي المبيعات (GMV)' : 'Gross Merchandise Value'}
          value={`${totalRevenue} ج.م`}
          icon={<Wallet size={16} />}
        />

        <PremiumStatCard
          title={isRTL ? 'عمولات المنصة (5%)' : 'Platform Commissions (5%)'}
          value={`${totalCommissions} ج.م`}
          icon={<DollarSign size={16} />}
        />

        <PremiumStatCard
          title={isRTL ? 'إجمالي عدد الطلبات' : 'Total System Orders'}
          value={`${totalOrders} طلب`}
          icon={<ClipboardList size={16} />}
        />

        <PremiumStatCard
          title={isRTL ? 'المشترون النشطون' : 'Active Purchasers'}
          value={`${totalCustomers} عميل`}
          icon={<Users size={16} />}
        />
      </div>

      {/* Sales Trend Line */}
      {renderSalesTrendChart(kpi.salesTrend)}

      {/* Store Performance Leaderboard */}
      <PremiumCard hoverable={false} className="p-6">
        <h4 className="font-black text-sm text-theme-text flex items-center gap-2 mb-5">
          <StoreIcon size={16} className="text-primary" /> 
          {isRTL ? 'ترتيب المبيعات وأداء المتاجر الشريكة' : 'Store Performance Leaderboard'}
        </h4>
        {kpi.storePerformance.length === 0 ? (
          <p className="text-xs text-theme-muted text-center py-4 font-bold">
            {isRTL ? 'لا تتوفر مبيعات للمتاجر حالياً' : 'No store performance metrics logged.'}
          </p>
        ) : (
          <div className="space-y-4">
            {kpi.storePerformance.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-bold border-b border-theme-border/40 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="w-5.5 h-5.5 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center font-black text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="text-theme-text">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <PremiumBadge variant="neutral" pill>
                    {item.ordersCount} {isRTL ? 'طلب' : 'orders'}
                  </PremiumBadge>
                  <span className="text-theme-text font-black">{item.gmv} ج.م</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>

      {/* Top Stores by Rating */}
      <PremiumCard hoverable={false} className="p-6">
        <h4 className="font-black text-sm text-theme-text flex items-center gap-2 mb-5">
          <Award size={16} className="text-primary" /> 
          {isRTL ? 'المتاجر الأعلى تقييماً بالمنصة' : 'Top Rated Stores'}
        </h4>
        <div className="space-y-4">
          {topStores.map((shop, idx) => (
            <div key={shop.id} className="flex justify-between items-center text-xs font-bold pb-3 border-b border-theme-border/40 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className="w-5.5 h-5.5 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center font-black text-[10px]">
                  {idx + 1}
                </span>
                <span className="text-theme-text">{shop.name}</span>
              </div>
              <PremiumBadge variant="warning" className="flex items-center gap-1 font-black">
                <Star size={11} className="fill-current" />
                <span>{shop.rating.toFixed(1)}</span>
              </PremiumBadge>
            </div>
          ))}
        </div>
      </PremiumCard>

      {/* Top Categories Panel */}
      <PremiumCard hoverable={false} className="p-6">
        <h4 className="font-black text-sm text-theme-text flex items-center gap-2 mb-5">
          <FolderOpen size={16} className="text-primary" /> 
          {isRTL ? 'تصنيف الأقسام الأكثر شعبية' : 'Popular Store Categories'}
        </h4>
        <div className="space-y-4">
          {topCategories.map((cat, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs font-bold pb-3 border-b border-theme-border/40 last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <span className="w-2 bg-primary h-2 rounded-full"></span>
                <span className="text-theme-text">{cat.name}</span>
              </div>
              <PremiumBadge variant="info" pill>
                {cat.count} {isRTL ? 'متجر معتمد' : 'stores'}
              </PremiumBadge>
            </div>
          ))}
        </div>
      </PremiumCard>
    </div>
  );
};

export default Analytics;
