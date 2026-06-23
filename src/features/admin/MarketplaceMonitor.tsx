import { useTranslation } from '../../hooks/useTranslation';
import React from 'react';
import { ClipboardList, Clock, CheckCircle2, MapPin, Bike, ShieldAlert, ThumbsUp, Package, UserCheck, DollarSign, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export const MarketplaceMonitor: React.FC = () => {
  const { orders, updateOrderStatus, isRTL, showToast } = useApp();

  // Active marketplace orders (excluding delivered and cancelled)
  const activeOrders = orders.filter(
    o => !['delivered', 'cancelled'].includes(o.status)
  );

  const getOrderStepNumber = (status: string) => {
  const {} = useTranslation();

    switch (status) {
      case 'pending': return 1;
      case 'accepted': return 2;
      case 'preparing': return 3;
      case 'readyForPickup': return 4;
      case 'pickedUp': return 5;
      case 'onTheWay': return 6;
      case 'delivered': return 7;
      default: return 1;
    }
  };

  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          label: t('str_133'), 
          color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' 
        };
      case 'accepted':
        return { 
          label: t('str_134'), 
          color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' 
        };
      case 'preparing':
        return { 
          label: t('str_135'), 
          color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' 
        };
      case 'readyForPickup':
        return { 
          label: t('str_136'), 
          color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' 
        };
      case 'pickedUp':
        return { 
          label: t('str_137'), 
          color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' 
        };
      case 'onTheWay':
        return { 
          label: t('str_138'), 
          color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' 
        };
      default:
        return { 
          label: status, 
          color: 'text-theme-muted bg-theme-bg border-theme-border' 
        };
    }
  };

  const handleAdminCancel = (orderId: string) => {
    if (confirm(t('str_582'))) {
      updateOrderStatus(orderId, 'cancelled');
      showToast(t('str_583'));
    }
  };

  return (
    <div className="space-y-5 text-theme-text">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('str_584'), value: activeOrders.length, color: 'text-primary' },
          { label: t('str_585'), value: activeOrders.filter(o => o.status === 'pending').length, color: 'text-amber-500' },
          { label: t('str_586'), value: activeOrders.filter(o => o.status === 'preparing').length, color: 'text-blue-500' },
          { label: t('str_587'), value: activeOrders.filter(o => o.status === 'ready_for_delivery').length, color: 'text-cyan-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-theme-card border border-theme-border rounded-2xl p-4 shadow-sm text-center theme-transition">
            <span className="text-[10px] text-theme-muted font-bold block">{stat.label}</span>
            <span className={`text-xl font-black block mt-1 ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Monitor Card List */}
      <div className="bg-theme-card rounded-[30px] border border-theme-border p-5 shadow-sm space-y-4 animate-fade-in theme-transition">
        <h3 className="font-black text-theme-text text-sm flex items-center gap-2 border-b border-theme-border/60 pb-2.5">
          <ClipboardList size={18} className="text-primary" />
          {t('str_588')}
        </h3>

        {activeOrders.length === 0 ? (
          <div className="bg-theme-bg p-8 rounded-2xl border border-theme-border text-center text-theme-muted font-bold theme-transition">
            <Clock size={32} className="mx-auto mb-2 text-theme-muted animate-pulse" />
            <p className="text-xs">{t('str_589')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map(order => {
              const statusInfo = getStatusDetails(order.status);
              const stepNum = getOrderStepNumber(order.status);

              return (
                <div 
                  key={order.id} 
                  className="bg-theme-bg border border-theme-border rounded-2xl p-4 space-y-4 shadow-sm theme-transition"
                >
                  {/* Header info */}
                  <div className="flex justify-between items-start pb-2.5 border-b border-theme-border/60">
                    <div>
                      <h4 className="font-black text-xs text-theme-text">{order.shopName}</h4>
                      <p className="text-[9px] text-theme-muted font-bold mt-0.5">
                        {t('str_590')} • {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border leading-none ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <button
                        onClick={() => handleAdminCancel(order.id)}
                        className="p-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500/20 transition"
                        title={t('str_591')}
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* Order Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-bold text-theme-muted">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1"><MapPin size={11} /> <span className="truncate">{order.location.name}</span></div>
                      <div>{t('str_592')}</div>
                    </div>
                    <div className="space-y-1 sm:text-right">
                      <div>
                        {t('str_593')}
                        <span className={order.driverName ? 'text-primary font-black' : 'text-amber-500 animate-pulse'}>
                          {order.driverName || (t('str_594'))}
                        </span>
                      </div>
                      <div className="flex items-center sm:justify-end gap-1">
                        <DollarSign size={11} className="text-primary" />
                        <span className="text-theme-text font-black text-xs">{order.total} ج.م</span>
                        <span>({order.paymentMethod === 'cash' ? (t('str_595')) : order.paymentMethod})</span>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal 8-state timeline */}
                  <div className="pt-1.5 pb-2 border-t border-theme-border/30">
                    <div className="flex items-center justify-between relative px-1">
                      {/* Progress Line */}
                      <div className="absolute top-1/2 left-3 right-3 h-0.5 bg-theme-border -translate-y-1/2 z-0"></div>
                      <div 
                        className="absolute top-1/2 left-3 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
                        style={{ 
                          width: `${((stepNum - 1) / 6) * 90}%`,
                          right: isRTL ? 'auto' : undefined,
                          left: isRTL ? undefined : '0.75rem' 
                        }}
                      ></div>

                      {/* Steps */}
                      {[
                        { step: 1, icon: Clock, label: t('str_158') },
                        { step: 2, icon: ThumbsUp, label: t('str_159') },
                        { step: 3, icon: ClipboardList, label: t('str_160') },
                        { step: 4, icon: Package, label: t('str_161') },
                        { step: 5, icon: UserCheck, label: t('str_162') },
                        { step: 6, icon: Bike, label: t('str_163') },
                        { step: 7, icon: CheckCircle2, label: t('str_164') }
                      ].map(s => {
                        const isActive = stepNum >= s.step;
                        const isCurrent = stepNum === s.step;
                        return (
                          <div key={s.step} className="flex flex-col items-center z-10">
                            <div 
                              className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center transition-all ${
                                isCurrent
                                  ? 'bg-primary border-primary text-white scale-110 shadow-md ring-2 ring-primary/20 animate-pulse'
                                  : isActive 
                                  ? 'bg-primary border-primary text-white shadow-sm' 
                                  : 'bg-theme-card border-theme-border text-theme-muted'
                              }`}
                              title={s.label}
                            >
                              <s.icon size={8} strokeWidth={2.5} />
                            </div>
                            <span className={`text-[7.5px] font-black mt-1 whitespace-nowrap scale-[0.85] ${isCurrent ? 'text-primary' : isActive ? 'text-theme-text' : 'text-theme-muted'}`}>
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
export default MarketplaceMonitor;
