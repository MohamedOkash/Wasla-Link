import { useTranslation } from '../../hooks/useTranslation';
import React from 'react';
import { Bike, MapPin, DollarSign, Clock, ClipboardList, CheckCircle2, ArrowRight } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

import { ChatWidget } from '../../components/chat/ChatWidget';
import { MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface DriverOrdersProps {
  driver: any;
}

export const DriverOrders: React.FC<DriverOrdersProps> = ({ driver }) => {
  const { t } = useTranslation();
  const { orders, isRTL, showToast } = useApp();
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);

  // Filters based on phase 14 order statuses
  const availableOrders = orders.filter(o => o.status === 'ready_for_delivery' && !o.driverId);
  const activeOrders = orders.filter(o => o.driverId === driver.id && ['accepted', 'picked_up', 'on_the_way', 'delivering'].includes(o.status));
  const completedOrders = orders.filter(o => o.driverId === driver.id && o.status === 'delivered');

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await import('../../services/driver/service').then(m => m.driverService.acceptOrder(driver.id, orderId));
      showToast(t('str_1116'));
    } catch (error) {
      console.error(error);
      showToast(t('str_537'), 'error');
    }
  };

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    let newStatus = '';
    if (currentStatus === 'accepted') newStatus = 'picked_up';
    else if (currentStatus === 'picked_up') newStatus = 'delivering';
    else if (currentStatus === 'delivering') newStatus = 'delivered';

    if (!newStatus) return;

    try {
      const orderObj = orders.find(o => o.id === orderId);
      const fee = orderObj?.estimatedDriverEarnings ?? orderObj?.deliveryFee ?? 20;
      await import('../../services/driver/service').then(m => m.driverService.updateOrderStatus(driver.id, orderId, newStatus, fee));
      showToast(t('str_1117'));
    } catch (error) {
      console.error(error);
      showToast(t('str_537'), 'error');
    }
  };

  const getStatusLabelAr = (status: string) => {
  const {} = useTranslation();

    switch (status) {
      case 'ready_for_pickup': return 'جاهز للاستلام';
      case 'accepted': return 'في انتظار الاستلام منك';
      case 'picked_up': return 'تم الاستلام من المتجر';
      case 'delivering': return 'جاري التوصيل للعميل';
      case 'delivered': return 'تم التسليم';
      default: return status;
    }
  };

  const getStatusLabelEn = (status: string) => {
    switch (status) {
      case 'ready_for_pickup': return 'Ready for Pickup';
      case 'accepted': return 'Accepted';
      case 'picked_up': return 'Picked Up';
      case 'delivering': return 'Delivering';
      case 'delivered': return 'Delivered';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Active Orders */}
      <div>
        <h3 className="font-black text-sm mb-3 flex items-center gap-1.5 text-primary">
          <Bike size={16} />
          {t('str_584')} ({activeOrders.length})
        </h3>
        {activeOrders.length === 0 ? (
           <p className="bg-theme-card p-4 text-center border border-theme-border rounded-2xl text-xs text-theme-muted font-bold">
           {t('str_1118')}
         </p>
        ) : (
          <div className="space-y-3">
             {activeOrders.map(order => (
                <div key={order.id} className="bg-theme-card border border-primary/30 rounded-2xl p-4 space-y-4 shadow-md">
                   <div className="flex justify-between items-start border-b border-theme-border/60 pb-3">
                     <div>
                       <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                         {isRTL ? getStatusLabelAr(order.status) : getStatusLabelEn(order.status)}
                       </span>
                       <h4 className="font-black text-sm text-theme-text mt-1.5">الطلب #{order.id.substring(0, 6)}</h4>
                     </div>
                     <span className="font-black text-xs text-theme-text text-green-500">{order.deliveryFee || 20} ج.م</span>
                   </div>

                   <div className="space-y-2 text-xs font-bold text-theme-muted">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="mt-0.5" />
                      <span>{order.location?.name || 'موقع العميل'}</span>
                    </div>
                  </div>

                  {/* Chat Action */}
                  <button
                    onClick={() => setActiveChatOrderId(order.id)}
                    className="w-full bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-600 text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 theme-transition"
                  >
                    <MessageSquare size={14} />
                    <span>{isRTL ? 'محادثة الطلب' : 'Order Chat'}</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(order.id, order.status)}
                    className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-black text-sm shadow-md transition flex justify-center items-center gap-2"
                  >
                    {order.status === 'accepted' && (t('str_1119'))}
                    {order.status === 'picked_up' && (t('str_1120'))}
                    {order.status === 'on_the_way' && (t('str_1121'))}
                    <ArrowRight size={16} className={isRTL ? 'rotate-180' : ''} />
                  </button>
                </div>
             ))}
          </div>
        )}
      </div>

      {/* Available Orders */}
      <div>
        <h3 className="font-black text-sm mb-3 flex items-center gap-1.5 text-theme-text">
          <ClipboardList size={16} />
          {t('str_1122')} ({availableOrders.length})
        </h3>
        {availableOrders.length === 0 ? (
          <p className="bg-theme-card p-4 text-center border border-theme-border rounded-2xl text-xs text-theme-muted font-bold">
            {t('str_1123')}
          </p>
        ) : (
          <div className="space-y-3">
            {availableOrders.map(order => (
               <div key={order.id} className="bg-theme-card border border-theme-border rounded-2xl p-4 space-y-4 shadow-sm opacity-80 hover:opacity-100 transition">
                  <div className="flex justify-between items-start border-b border-theme-border/60 pb-3">
                     <div>
                       <h4 className="font-black text-sm text-theme-text">{order.shopName || 'متجر'}</h4>
                       <span className="text-[10px] font-bold text-theme-muted mt-0.5 block">الطلب #{order.id.substring(0, 6)}</span>
                     </div>
                     <span className="font-black text-xs text-theme-text">{order.deliveryFee || 20} ج.م</span>
                   </div>

                   <button
                    onClick={() => handleAcceptOrder(order.id)}
                    disabled={driver.availability !== 'online'}
                    className={`w-full py-2.5 rounded-xl font-black text-sm transition ${
                      driver.availability === 'online'
                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                        : 'bg-theme-border text-theme-muted cursor-not-allowed'
                    }`}
                  >
                    {t('str_202')}
                  </button>
               </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Orders */}
      <div>
        <h3 className="font-black text-sm mb-3 flex items-center gap-1.5 text-theme-text">
          <CheckCircle2 size={16} className="text-green-500" />
          {t('str_1124')} ({completedOrders.length})
        </h3>
        <div className="space-y-3">
            {completedOrders.map(order => (
               <div key={order.id} className="bg-theme-card border border-theme-border rounded-2xl p-4 flex justify-between items-center opacity-70">
                 <div>
                    <h4 className="font-black text-sm text-theme-text text-strike">الطلب #{order.id.substring(0, 6)}</h4>
                    <span className="text-[10px] font-bold text-theme-muted">{new Date(order.createdAt).toLocaleDateString()}</span>
                 </div>
                 <span className="font-black text-xs text-green-500">+{order.deliveryFee || 20} ج.م</span>
               </div>
            ))}
        </div>
      </div>

      {/* Chat Widget */}
      {activeChatOrderId && (
        <ChatWidget
          orderId={activeChatOrderId}
          isOpen={true}
          onClose={() => setActiveChatOrderId(null)}
          currentUserRole="driver"
          participants={
            [
              orders.find(o => o.id === activeChatOrderId)?.customerId, 
              orders.find(o => o.id === activeChatOrderId)?.shopId,
              driver.id
            ].filter(Boolean) as string[]
          }
          participantRoles={{
            [orders.find(o => o.id === activeChatOrderId)?.customerId as string]: 'customer',
            [orders.find(o => o.id === activeChatOrderId)?.shopId as string]: 'vendor',
            [driver.id as string]: 'driver'
          }}
        />
      )}
    </div>
  );
};
