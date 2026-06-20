import React from 'react';
import { Bike, MapPin, DollarSign, ArrowRight, ShieldCheck, ClipboardCheck, Clock, ThumbsUp, ClipboardList, Package, UserCheck, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export const DriverOrders: React.FC = () => {
  const { orders, updateOrderStatus, currentUser, lang, isRTL } = useApp();

  const getOrderStepNumber = (status: string) => {
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

  const driverId = currentUser?.email || 'd1';
  const driverName = currentUser?.name || 'كابتن محمود رضا';

  // Available deliveries: status === 'readyForPickup' && no driverId
  const availableOrders = orders.filter(
    o => o.status === 'readyForPickup' && !o.driverId
  );

  // Active deliveries: assigned to me and in progress
  const activeOrders = orders.filter(
    o => o.driverId === driverId && !['delivered', 'cancelled'].includes(o.status)
  );

  // Completed deliveries: assigned to me and delivered
  const completedOrders = orders.filter(
    o => o.driverId === driverId && o.status === 'delivered'
  );

  const getStatusLabelAr = (status: string) => {
    switch (status) {
      case 'readyForPickup': return 'جاهز للاستلام';
      case 'pickedUp': return 'تم الاستلام';
      case 'onTheWay': return 'في الطريق للتوصيل';
      default: return status;
    }
  };

  const getStatusLabelEn = (status: string) => {
    switch (status) {
      case 'readyForPickup': return 'Ready for Pickup';
      case 'pickedUp': return 'Picked Up';
      case 'onTheWay': return 'On The Way';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 text-theme-text pb-24">
      {/* Active Deliveries Section */}
      <div>
        <h3 className="font-black text-sm mb-3 flex items-center gap-1.5">
          <ActivityIcon size={16} className="text-primary animate-pulse" />
          {isRTL ? 'الطلبات النشطة والجاري توصيلها' : 'Active Delivery Workloads'} ({activeOrders.length})
        </h3>
        
        {activeOrders.length === 0 ? (
          <p className="bg-theme-card p-6 text-center border border-theme-border rounded-[22px] text-xs text-theme-muted font-bold theme-transition">
            {isRTL ? 'لا توجد شحنات جارية لتوصيلها حالياً. تفقد التبويب بالأسفل لقبول طلب.' : 'No active dispatches. Accept a package below.'}
          </p>
        ) : (
          <div className="space-y-4">
            {activeOrders.map(order => (
              <div 
                key={order.id}
                className="bg-theme-card border border-theme-border rounded-[28px] p-5 space-y-4 shadow-sm theme-transition animate-card-entrance"
              >
                <div className="flex justify-between items-start border-b border-theme-border/60 pb-3">
                  <div>
                    <span className="text-[9px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md leading-none">
                      {isRTL ? getStatusLabelAr(order.status) : getStatusLabelEn(order.status)}
                    </span>
                    <h4 className="font-black text-sm text-theme-text mt-1.5">{order.shopName}</h4>
                  </div>
                  <span className="font-black text-xs text-theme-text">#{order.id}</span>
                </div>

                <div className="space-y-2 text-xs font-bold text-theme-muted">
                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="text-theme-muted flex-shrink-0 mt-0.5" />
                    <span className="leading-snug">{order.location.name}</span>
                  </div>
                </div>

                {/* Status Stepper Tracker */}
                <div className="pt-1.5 pb-2.5 border-t border-theme-border/30">
                  <div className="flex items-center justify-between relative px-1">
                    {/* Progress Line */}
                    <div className="absolute top-1/2 left-3 right-3 h-0.5 bg-theme-border -translate-y-1/2 z-0"></div>
                    <div 
                      className="absolute top-1/2 left-3 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
                      style={{ 
                        width: `${((getOrderStepNumber(order.status) - 1) / 6) * 90}%`,
                        right: isRTL ? 'auto' : undefined,
                        left: isRTL ? undefined : '0.75rem' 
                      }}
                    ></div>

                    {/* Steps */}
                    {[
                      { step: 1, icon: Clock, label: isRTL ? 'إرسال' : 'Sent' },
                      { step: 2, icon: ThumbsUp, label: isRTL ? 'قبول' : 'Accept' },
                      { step: 3, icon: ClipboardList, label: isRTL ? 'تحضير' : 'Prep' },
                      { step: 4, icon: Package, label: isRTL ? 'جاهز' : 'Ready' },
                      { step: 5, icon: UserCheck, label: isRTL ? 'استلام' : 'Picked' },
                      { step: 6, icon: Bike, label: isRTL ? 'طريق' : 'Transit' },
                      { step: 7, icon: CheckCircle2, label: isRTL ? 'تم' : 'Done' }
                    ].map(s => {
                      const stepNum = getOrderStepNumber(order.status);
                      const isActive = stepNum >= s.step;
                      const isCurrent = stepNum === s.step;
                      return (
                        <div key={s.step} className="flex flex-col items-center z-10">
                          <div 
                            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                              isCurrent
                                ? 'bg-primary border-primary text-white scale-110 shadow-md ring-4 ring-primary/20 animate-pulse'
                                : isActive 
                                ? 'bg-primary border-primary text-white shadow-sm' 
                                : 'bg-theme-card border-theme-border text-theme-muted'
                            }`}
                            title={s.label}
                          >
                            <s.icon size={10} strokeWidth={2.5} />
                          </div>
                          <span className={`text-[8px] font-black mt-1 whitespace-nowrap scale-[0.9] ${isCurrent ? 'text-primary' : isActive ? 'text-theme-text' : 'text-theme-muted'}`}>
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Workflow Transitions Buttons */}
                <div className="pt-2 border-t border-theme-border/60 flex flex-wrap gap-2">
                  {order.status === 'readyForPickup' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'pickedUp')}
                      className="flex-1 bg-primary text-white text-[10px] font-black py-3 rounded-xl flex items-center justify-center gap-1 hover:bg-primary-hover transition shadow active:scale-95"
                    >
                      <ClipboardCheck size={14} />
                      {isRTL ? 'تأكيد استلام الشحنة من المتجر' : 'Pick Up From Store'}
                    </button>
                  )}
                  {order.status === 'pickedUp' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'onTheWay')}
                      className="flex-1 bg-blue-500 text-white text-[10px] font-black py-3 rounded-xl flex items-center justify-center gap-1 hover:bg-blue-600 transition shadow active:scale-95"
                    >
                      <Bike size={14} />
                      {isRTL ? 'البدء في التحرك (في الطريق)' : 'Start Route Delivery'}
                    </button>
                  )}
                  {order.status === 'onTheWay' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="flex-1 bg-green-500 text-white text-[10px] font-black py-3 rounded-xl flex items-center justify-center gap-1 hover:bg-green-600 transition shadow active:scale-95"
                    >
                      <ShieldCheck size={14} />
                      {isRTL ? 'إتمام التوصيل وتسليم العميل' : 'Mark as Delivered'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Deliveries Section */}
      <div>
        <h3 className="font-black text-sm mb-3 flex items-center gap-1.5">
          <Bike size={16} className="text-primary" />
          {isRTL ? 'طلبات التوصيل المتاحة حالياً' : 'Available Delivery Pool'} ({availableOrders.length})
        </h3>

        {availableOrders.length === 0 ? (
          <p className="bg-theme-card p-6 text-center border border-theme-border rounded-[22px] text-xs text-theme-muted font-bold theme-transition">
            {isRTL ? 'لا توجد شحنات جاهزة للاستلام حالياً في منطقتك.' : 'No packages are ready for dispatch right now.'}
          </p>
        ) : (
          <div className="space-y-4">
            {availableOrders.map(order => (
              <div 
                key={order.id}
                className="bg-theme-card border border-theme-border rounded-[28px] p-5 space-y-4 shadow-sm theme-transition animate-card-entrance"
              >
                <div className="flex justify-between items-start border-b border-theme-border/60 pb-3">
                  <div>
                    <h4 className="font-black text-sm text-theme-text">{order.shopName}</h4>
                    <p className="text-[9px] text-theme-muted font-bold mt-1">
                      {isRTL ? 'بانتظار سائق يستلمها' : 'Awaiting courier assignation'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-xs text-theme-text block">#{order.id}</span>
                    <span className="text-primary font-black text-xs block mt-1">+{order.deliveryFee} ج.م</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-bold text-theme-muted">
                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="text-theme-muted flex-shrink-0 mt-0.5" />
                    <span className="leading-snug">{order.location.name}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-theme-border/60 flex gap-2">
                  <button
                    onClick={() => updateOrderStatus(order.id, 'readyForPickup', driverId, driverName)}
                    className="flex-1 bg-primary text-white text-xs font-black py-3 rounded-xl flex items-center justify-center gap-1 hover:bg-primary-hover transition shadow active:scale-95"
                  >
                    {isRTL ? 'قبول وتأكيد المهمة' : 'Accept Delivery'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ActivityIcon = ({ size, className }: { size: number; className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export default DriverOrders;
