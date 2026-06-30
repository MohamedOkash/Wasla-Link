import { useTranslation } from '../../hooks/useTranslation';
import React, { useState } from 'react';
import { ClipboardList, Clock, CheckCircle2, MapPin, Bike, ShieldAlert, Star, ThumbsUp, Package, UserCheck, RotateCcw, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { CustomerHeader } from '../../components/common/CustomerHeader';
import { ReviewModal } from './ReviewModal';
import { db } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface CustomerOrdersProps {
  goBack?: () => void;
  navigate?: (name: string, params?: any) => void;
}

export const CustomerOrders: React.FC<CustomerOrdersProps> = ({ goBack, navigate }) => {
  const { t } = useTranslation();
  const { 
    orders,  
    isRTL, 
    setCart, 
    showToast, 
    createReturnRequest, 
    currentUser, 
    returnRequests 
  } = useApp();

  const [reviewOrder, setReviewOrder] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'returns'>('orders');

  // Return request form modal states
  const [returnOrder, setReturnOrder] = useState<any | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [returnReason, setReturnReason] = useState('');
  const [returnType, setReturnType] = useState<'refund' | 'replacement'>('refund');

  const customerReturns = returnRequests.filter(r => r.customerId === (currentUser?.id || 'customer_1'));

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من إلغاء هذا الطلب؟' : 'Are you sure you want to cancel this order?')) {
      try {
        const orderRef = doc(db, 'orders', orderId);
        await setDoc(orderRef, { status: 'cancelled' }, { merge: true });
        showToast(isRTL ? 'تم إلغاء الطلب بنجاح' : 'Order cancelled successfully');
      } catch (error) {
        showToast(isRTL ? 'حدث خطأ أثناء إلغاء الطلب' : 'Error cancelling order');
      }
    }
  };

  const handleReorder = (order: any) => {


    setCart({
      shopId: order.shopId,
      shopName: order.shopName,
      items: order.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imgUrl: item.imgUrl
      }))
    });
    showToast(t('str_132'));
    if (navigate) navigate('cart');
  };

  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          label: t('str_133'), 
          color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', 
          step: 1 
        };
      case 'accepted':
        return { 
          label: t('str_134'), 
          color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20', 
          step: 2 
        };
      case 'preparing':
        return { 
          label: t('str_135'), 
          color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', 
          step: 3 
        };
      case 'readyForPickup':
        return { 
          label: t('str_136'), 
          color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20', 
          step: 4 
        };
      case 'pickedUp':
        return { 
          label: t('str_137'), 
          color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', 
          step: 5 
        };
      case 'onTheWay':
        return { 
          label: t('str_138'), 
          color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', 
          step: 6 
        };
      case 'delivered':
        return { 
          label: t('str_139'), 
          color: 'text-green-500 bg-green-500/10 border-green-500/20', 
          step: 7 
        };
      case 'cancelled':
        return { 
          label: t('str_140'), 
          color: 'text-red-500 bg-red-500/10 border-red-500/20', 
          step: 0 
        };
      default:
        return { 
          label: t('str_141'), 
          color: 'text-theme-muted bg-theme-bg border-theme-border', 
          step: 1 
        };
    }
  };

  const getReturnStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted': return t('str_142');
      case 'reviewed': return t('str_143');
      case 'approved': return t('str_144');
      case 'rejected': return t('str_145');
      case 'refunded': return t('str_146');
      case 'replaced': return t('str_147');
      case 'completed': return t('str_148');
      default: return status;
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'cash': return t('str_149');
      case 'vodafone': return t('str_124');
      case 'instapay': return t('str_125');
      default: return method;
    }
  };

  const openReturnModal = (order: any) => {
    setReturnOrder(order);
    const initialSelected: Record<string, boolean> = {};
    order.items.forEach((item: any) => {
      initialSelected[item.id] = true;
    });
    setSelectedItems(initialSelected);
    setReturnReason('');
    setReturnType('refund');
  };

  const handleToggleItem = (itemId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleSubmitReturn = () => {
    const itemsToReturn = returnOrder.items
      .filter((item: any) => selectedItems[item.id])
      .map((item: any) => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

    if (itemsToReturn.length === 0) {
      showToast(t('str_150'));
      return;
    }
    if (!returnReason.trim()) {
      showToast(t('str_151'));
      return;
    }

    createReturnRequest({
      orderId: returnOrder.id,
      storeId: returnOrder.shopId,
      storeName: returnOrder.shopName,
      customerId: currentUser?.id || 'customer_1',
      customerName: currentUser?.name || 'أحمد علي',
      items: itemsToReturn,
      reason: returnReason,
      type: returnType
    });

    setReturnOrder(null);
    showToast(t('str_152'));
  };

  return (
    <div className="bg-theme-bg h-full flex flex-col overflow-hidden animate-fade-in theme-transition">
      <CustomerHeader title={t('str_153')} goBack={goBack} />

      {/* Tabs */}
      <div className="flex bg-theme-card p-1 rounded-2xl border-b border-theme-border mx-4 mt-3">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
            activeTab === 'orders' ? 'bg-primary text-white shadow-sm' : 'text-theme-muted hover:text-theme-text'
          }`}
        >
          {t('str_154')}
        </button>
        <button 
          onClick={() => setActiveTab('returns')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
            activeTab === 'returns' ? 'bg-primary text-white shadow-sm' : 'text-theme-muted hover:text-theme-text'
          }`}
        >
          {t('str_155')} ({customerReturns.length})
        </button>
      </div>

      {activeTab === 'orders' ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] no-scrollbar bg-theme-bg/30">
          {orders.length === 0 ? (
            <div className="text-center py-16 text-theme-muted text-xs">
              {t('str_156')}
            </div>
          ) : (
            orders.map(order => {
              const statusInfo = getStatusDetails(order.status);
              
              return (
                <div 
                  key={order.id} 
                  className="bg-theme-card rounded-[28px] border border-theme-border p-4 space-y-4 shadow-sm theme-transition animate-card-entrance"
                >
                  {/* Order Header info */}
                  <div className="flex justify-between items-start pb-3.5 border-b border-theme-border/60">
                    <div>
                      <h3 className="font-black text-sm text-theme-text">{order.shopName}</h3>
                      <p className="text-[9px] text-theme-muted font-bold mt-0.5">
                        {t('str_157', { orderId: order.invoiceId || order.id })}
                      </p>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border leading-none ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2.5 py-0.5">
                    {order.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-xs font-bold text-theme-text">
                        <div className="flex items-center gap-2">
                          <span className="bg-theme-bg text-primary text-[9px] font-black px-2 py-0.5 rounded border border-theme-border">
                            {item.quantity}x
                          </span>
                          <span className="line-clamp-1">{item.name}</span>
                        </div>
                        <span>{item.price * item.quantity} {t('currencyEGP')}</span>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Address Details */}
                  <div className="bg-theme-bg p-3 rounded-xl space-y-2 text-[10px] font-bold text-theme-muted border border-theme-border">
                    <div className="flex items-start gap-2">
                      <MapPin size={12} className="text-theme-muted flex-shrink-0 mt-0.5" />
                      <span className="leading-snug">{order.location.name}</span>
                    </div>
                  </div>

                  {/* Status Stepper Tracker */}
                  {statusInfo.step > 0 && (
                    <div className="pt-1.5 pb-2.5">
                      <div className="flex items-center justify-between relative px-1">
                        {/* Progress Line */}
                        <div className="absolute top-1/2 left-3 right-3 h-0.5 bg-theme-border -translate-y-1/2 z-0"></div>
                        <div 
                          className="absolute top-1/2 left-3 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
                          style={{ 
                            width: `${((statusInfo.step - 1) / 6) * 90}%`,
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
                          const isActive = statusInfo.step >= s.step;
                          const isCurrent = statusInfo.step === s.step;
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
                  )}

                  {/* Billing Summary */}
                  <div className="flex justify-between items-center pt-3 border-t border-theme-border/50 text-xs">
                    <span className="font-bold text-theme-muted">
                      {t('str_165')}
                      {getPaymentLabel(order.paymentMethod)}
                    </span>
                    <span className="font-black text-theme-text">
                      {t('str_166')}
                      <span className="text-primary font-black text-sm">{order.total} {t('currencyEGP')}</span>
                    </span>
                  </div>

                  {/* Live Tracking Link */}
                  {['driver_assigned', 'driver_accepted', 'picked_up', 'on_the_way'].includes(order.status) && navigate && (
                    <button
                      onClick={() => navigate('tracking', { orderId: order.id })}
                      className="w-full bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 theme-transition mt-2"
                    >
                      <Bike size={14} />
                      <span>{t('str_167')}</span>
                    </button>
                  )}

                  {/* Cancel Order Button */}
                  {(order.status === 'pending' || order.status === 'new' || order.status === 'pendingVerification') && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="w-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 theme-transition mt-2"
                    >
                      <AlertCircle size={14} />
                      <span>{isRTL ? 'إلغاء الطلب' : 'Cancel Order'}</span>
                    </button>
                  )}

                  {/* Return Request Button */}
                  {order.status === 'delivered' && (
                    <button
                      onClick={() => openReturnModal(order)}
                      className="w-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 theme-transition mt-2"
                    >
                      <RotateCcw size={14} />
                      <span>{t('str_168')}</span>
                    </button>
                  )}

                  {/* Reorder Button */}
                  {navigate && (
                    <button
                      onClick={() => handleReorder(order)}
                      className="w-full bg-theme-bg border border-theme-border hover:border-primary/20 text-theme-text text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 theme-transition mt-2"
                    >
                      <ClipboardList size={14} className="text-primary" />
                      <span>{t('str_169')}</span>
                    </button>
                  )}

                  {/* Rate Order Button */}
                  {order.status === 'delivered' && !order.ratingStore && (
                    <button
                      onClick={() => setReviewOrder(order)}
                      className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 theme-transition mt-2"
                    >
                      <Star size={14} className="fill-amber-500 text-amber-500" />
                      <span>{t('str_170')}</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Returns Tab */
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] no-scrollbar bg-theme-bg/30">
          {customerReturns.length === 0 ? (
            <div className="text-center py-16 text-theme-muted text-xs">
              {t('str_171')}
            </div>
          ) : (
            customerReturns.map(ret => (
              <div 
                key={ret.id} 
                className="bg-theme-card rounded-[28px] border border-theme-border p-4 space-y-3.5 shadow-sm theme-transition"
              >
                <div className="flex justify-between items-start pb-2 border-b border-theme-border/60">
                  <div>
                    <h3 className="font-black text-xs text-theme-text">{ret.storeName}</h3>
                    <p className="text-[8px] text-theme-muted mt-0.5">
                      {t('str_172', { requestId: ret.id })}
                    </p>
                  </div>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded border leading-none ${
                    ret.status === 'rejected' ? 'text-red-500 bg-red-500/10 border-red-500/20' :
                    ret.status === 'refunded' || ret.status === 'replaced' || ret.status === 'completed' ? 'text-green-500 bg-green-500/10 border-green-500/20' :
                    'text-amber-500 bg-amber-500/10 border-amber-500/20'
                  }`}>
                    {getReturnStatusLabel(ret.status)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-theme-muted uppercase tracking-wider block">{t('str_173')}</span>
                  {ret.items.map(item => (
                    <div key={item.productId} className="flex justify-between text-[11px] font-bold text-theme-text">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{item.price * item.quantity} {t('currencyEGP')}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-theme-bg p-2.5 rounded-lg border border-theme-border text-[9px] text-theme-muted leading-relaxed font-bold">
                  <p><span className="font-black text-theme-text">{t('str_174')}</span>{ret.reason}</p>
                  <p className="mt-1"><span className="font-black text-theme-text">{t('str_175')}</span>{ret.type === 'refund' ? (t('str_176')) : (t('str_177'))}</p>
                </div>

                {/* Timeline display */}
                <div className="pt-2 border-t border-theme-border/50">
                  <span className="text-[9px] font-black text-theme-muted uppercase tracking-wider block mb-2">{t('str_178')}</span>
                  <div className="space-y-3.5 pr-2">
                    {ret.timeline.map((event, index) => (
                      <div key={index} className="flex gap-3 relative">
                        {index < ret.timeline.length - 1 && (
                          <div className="absolute right-[5px] top-3 bottom-0 w-0.5 bg-theme-border"></div>
                        )}
                        <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1 border-2 border-theme-card"></div>
                        <div>
                          <p className="text-[10px] font-black text-theme-text">{getReturnStatusLabel(event.status)}</p>
                          <p className="text-[9px] text-theme-muted mt-0.5 leading-snug">{event.note}</p>
                          <span className="text-[7px] text-theme-muted/70 block mt-0.5">{new Date(event.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Return Request Modal */}
      {returnOrder && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-theme-card w-full max-w-md rounded-[32px] border border-theme-border p-5 space-y-4 shadow-2xl animate-scale-up text-right">
            <h3 className="font-black text-sm text-theme-text border-b border-theme-border pb-3.5 flex items-center justify-between">
              <span className="text-primary"><RotateCcw size={20} /></span>
              <span>{t('str_179')}</span>
            </h3>

            <div className="space-y-3">
              <span className="text-[10px] font-black text-theme-muted block">{t('str_180')}</span>
              <div className="max-h-40 overflow-y-auto space-y-2 bg-theme-bg/50 p-2.5 border border-theme-border rounded-xl">
                {returnOrder.items.map((item: any) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleToggleItem(item.id)}
                    className="flex justify-between items-center p-2 rounded-lg border border-theme-border bg-theme-card cursor-pointer hover:border-primary/20 text-xs font-bold text-theme-text"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedItems[item.id] ? 'bg-primary border-primary text-white' : 'border-theme-border'
                      }`}>
                        {selectedItems[item.id] && <CheckCircle2 size={10} className="text-white" />}
                      </div>
                      <span>{item.name}</span>
                    </div>
                    <span>{item.quantity}x</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setReturnType('refund')}
                className={`py-2.5 rounded-xl border text-xs font-black transition ${
                  returnType === 'refund' ? 'border-primary bg-primary/10 text-primary' : 'border-theme-border text-theme-muted'
                }`}
              >
                {t('str_181')}
              </button>
              <button 
                onClick={() => setReturnType('replacement')}
                className={`py-2.5 rounded-xl border text-xs font-black transition ${
                  returnType === 'replacement' ? 'border-primary bg-primary/10 text-primary' : 'border-theme-border text-theme-muted'
                }`}
              >
                {t('str_182')}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-theme-muted block">{t('str_183')}</label>
              <textarea 
                rows={3}
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                placeholder={t('str_184')}
                className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold text-theme-text outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setReturnOrder(null)}
                className="flex-1 bg-theme-bg border border-theme-border text-theme-muted font-bold py-3 rounded-xl text-xs transition"
              >
                {t('str_56')}
              </button>
              <button 
                onClick={handleSubmitReturn}
                className="flex-1 bg-primary hover:bg-primary-hover text-white font-black py-3 rounded-xl text-xs shadow-md transition"
              >
                {t('str_185')}
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewOrder && (
        <ReviewModal 
          order={reviewOrder} 
          onClose={() => setReviewOrder(null)} 
        />
      )}
    </div>
  );
};
export default CustomerOrders;
