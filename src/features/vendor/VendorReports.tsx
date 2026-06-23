import { useTranslation } from '../../hooks/useTranslation';
import React, { useState } from 'react';
import { Download, Printer, Calendar, ArrowUpRight, TrendingUp, DollarSign, ShoppingBag, MapPin, ClipboardList, Eye } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { analyticsService } from '../../services/analytics.service';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { PremiumStatCard } from '../../components/premium/PremiumStatCard';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumBadge } from '../../components/premium/PremiumBadge';
import { useProducts } from '../../hooks/useProducts';

export const VendorReports: React.FC = () => {
  const { t } = useTranslation();
  const { orders,  isRTL } = useApp();
  const { products } = useProducts();;
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Filter vendor reports using store g_1 (Al-Khair Markets)
  const kpi = analyticsService.getVendorKPIs('g_1', orders, products);

  // Export handlers
  const handleExportCSV = () => {
  const {} = useTranslation();

    const headers = ['رقم الطلب', 'تاريخ الطلب', 'قيمة المجموع الفرعي', 'رسوم التوصيل', 'إجمالي الطلب', 'طريقة الدفع', 'الحالة'];
    const rows = orders.filter(o => o.shopId === 'g_1').map(o => [
      o.id,
      o.createdAt,
      o.subtotal,
      o.deliveryFee,
      o.total,
      o.paymentMethod === 'cash' ? 'نقدي' : o.paymentMethod === 'vodafone' ? 'فودافون كاش' : 'إنستاباي',
      o.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    handleExportCSV();
  };

  const handlePrint = () => {
    window.print();
  };

  // Custom SVG Sparkline for Sales Trend (Last 7 Days)
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

    // Fill area below trend
    const firstPointX = 20;
    const lastPointX = width - 20;
    const fillPoints = `${firstPointX},${height - 15} ${points} ${lastPointX},${height - 15}`;

    return (
      <PremiumCard hoverable={false} className="p-6 relative overflow-hidden">
        <div className="flex justify-between items-center mb-5">
          <div className="space-y-1">
            <h4 className="font-black text-theme-text text-sm flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              {t('str_992')}
            </h4>
            <p className="text-[10px] text-theme-muted font-bold">
              {t('str_993')}
            </p>
          </div>
          <PremiumBadge variant="primary" pill>Live</PremiumBadge>
        </div>

        <div className="flex justify-between items-baseline mb-4 text-[10px] font-black text-theme-muted bg-theme-bg border border-theme-border/40 px-3 py-1.5 rounded-lg">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            {t('str_994')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
            {t('str_995')}
          </span>
        </div>

        <div className="relative h-32 w-full mt-2">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#FF7A00" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="salesLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FF7A00" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#FF7A00" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* Grid helper lines */}
            <line x1="20" y1={25} x2={width - 20} y2={25} stroke="var(--theme-border)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.6" />
            <line x1="20" y1={height / 2} x2={width - 20} y2={height / 2} stroke="var(--theme-border)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.6" />
            <line x1="20" y1={height - 25} x2={width - 20} y2={height - 25} stroke="var(--theme-border)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.6" />
            
            {/* Area Fill */}
            <polygon
              points={fillPoints}
              fill="url(#salesAreaGrad)"
            />

            {/* Sparkline curve */}
            <polyline
              fill="none"
              stroke="url(#salesLineGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
              filter="url(#glow)"
            />

            {/* Glowing dots at data nodes */}
            {trend.map((val, idx) => {
              const x = (idx / (trend.length - 1)) * (width - 40) + 20;
              const y = height - ((val - min) / range) * (height - 50) - 25;
              const isLast = idx === trend.length - 1;
              return (
                <g key={idx} className="group cursor-pointer">
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
          <span>{t('str_996')}</span>
          <span>{t('str_997')}</span>
          <span>{t('str_998')}</span>
        </div>
      </PremiumCard>
    );
  };

  return (
    <div className="space-y-6 text-theme-text pb-10">
      {/* Selector */}
      <div className="bg-theme-card p-1.5 rounded-2xl border border-theme-border/60 shadow-sm flex justify-between items-center gap-1 theme-transition">
        {[
          { id: 'daily', label: t('str_999') },
          { id: 'weekly', label: t('str_1000') },
          { id: 'monthly', label: t('str_1001') },
        ].map(r => (
          <button
            key={r.id}
            onClick={() => setReportType(r.id as any)}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all duration-300 ${
              reportType === r.id 
                ? 'bg-primary text-white shadow-sm shadow-primary/20 scale-102' 
                : 'text-theme-muted hover:text-theme-text hover:bg-theme-bg'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        <PremiumStatCard
          title={t('str_1002')}
          value={`${kpi.totalSales} ج.م`}
          change={t('str_1003')}
          changeType="positive"
          icon={<DollarSign size={16} />}
        />

        <PremiumStatCard
          title={t('str_1004')}
          value={`${kpi.totalProfit} ج.م`}
          change={t('str_1005')}
          changeType="positive"
          icon={<TrendingUp size={16} />}
        />
      </div>

      {/* Sales Trend Line */}
      {renderSalesTrendChart(kpi.recentSalesTrend)}

      {/* Profit & Margin Breakdown */}
      <PremiumCard hoverable={false} className="p-6">
        <h4 className="font-black text-theme-text text-sm mb-5 flex items-center gap-2">
          <ClipboardList size={16} className="text-primary" />
          {t('str_1006')}
        </h4>
        <div className="space-y-4">
          {[
            {
              label: t('str_1007'),
              val: `${kpi.totalSales} ج.م`,
              highlight: false,
            },
            {
              label: t('str_1008'),
              val: `${kpi.totalProfit} ج.م`,
              highlight: true,
              color: 'text-green-500',
            },
            {
              label: t('str_1009'),
              val: `%${kpi.totalSales > 0 ? Math.round((kpi.totalProfit / kpi.totalSales) * 100) : 0}`,
              highlight: true,
              color: 'text-green-500',
            },
            {
              label: t('str_1010'),
              val: `${kpi.avgOrderValue} ج.م`,
              highlight: false,
            },
            {
              label: t('str_1011'),
              val: `${kpi.deliveredOrdersCount} / ${kpi.cancelledOrdersCount}`,
              highlight: false,
            },
            {
              label: t('str_1012'),
              val: new Date().toLocaleDateString(isRTL ? 'ar-EG' : 'en-US'),
              highlight: false,
              icon: <Calendar size={12} className="inline mr-1 opacity-70" />,
            }
          ].map((item, idx) => (
            <div key={idx} className="flex justify-between items-center py-2.5 border-b border-theme-border/40 text-xs last:border-0 last:pb-0">
              <span className="text-theme-muted font-bold">{item.label}</span>
              <span className={`font-black ${item.highlight ? item.color || 'text-primary' : 'text-theme-text'} flex items-center gap-1`}>
                {item.icon}
                {item.val}
              </span>
            </div>
          ))}
        </div>
      </PremiumCard>

      {/* Demographics / Village Demographics */}
      <PremiumCard hoverable={false} className="p-6">
        <h4 className="font-black text-theme-text text-sm mb-5 flex items-center gap-2">
          <MapPin size={16} className="text-primary" />
          {t('str_1013')}
        </h4>
        {kpi.villageDemographics.length === 0 ? (
          <p className="text-xs text-theme-muted text-center py-4 font-bold">
            {t('str_1014')}
          </p>
        ) : (
          <div className="space-y-4">
            {kpi.villageDemographics.map((village, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-bold border-b border-theme-border/40 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-primary/20 border border-primary/40 rounded-full"></span>
                  <span className="text-theme-text">{village.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <PremiumBadge variant="neutral" pill>
                    {village.orders} {t('str_550')}
                  </PremiumBadge>
                  <span className="text-theme-text font-black">{village.sales} ج.م</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>

      {/* Best Selling Products Table */}
      <PremiumCard hoverable={false} className="p-6">
        <h4 className="font-black text-theme-text text-sm mb-5 flex items-center gap-2">
          <ShoppingBag size={16} className="text-primary" />
          {t('str_1015')}
        </h4>
        {kpi.topProducts.length === 0 ? (
          <p className="text-xs text-theme-muted text-center py-4 font-bold">
            {t('str_1016')}
          </p>
        ) : (
          <div className="space-y-4">
            {kpi.topProducts.map((prod, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-bold py-2.5 border-b border-theme-border/40 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="w-5.5 h-5.5 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center font-black text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="text-theme-text line-clamp-1">{prod.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <PremiumBadge variant="success" pill>
                    {prod.qty} {t('str_783')}
                  </PremiumBadge>
                  <span className="text-theme-text font-black">{prod.sales} ج.م</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>

      {/* Export Options */}
      <PremiumCard hoverable={false} className="p-6 space-y-4">
        <h4 className="font-black text-theme-text text-sm">
          {t('str_1017')}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <PremiumButton
            variant="outline"
            onClick={handleExportCSV}
            leftIcon={<Download size={14} />}
          >
            {t('str_1018')}
          </PremiumButton>
          <PremiumButton
            variant="outline"
            onClick={handleExportExcel}
            leftIcon={<Download size={14} />}
          >
            {t('str_1019')}
          </PremiumButton>
        </div>
        <PremiumButton
          variant="primary"
          onClick={handlePrint}
          className="w-full"
          leftIcon={<Printer size={15} />}
        >
          {t('str_1020')}
        </PremiumButton>
      </PremiumCard>
    </div>
  );
};

export default VendorReports;
