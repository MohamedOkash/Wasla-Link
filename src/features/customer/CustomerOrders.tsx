import React, { useState } from 'react';
import { ClipboardList, Clock, CheckCircle2, MapPin, Bike, ShieldAlert, Star, ThumbsUp, Package, UserCheck, RotateCcw, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { CustomerHeader } from '../../components/common/CustomerHeader';
import { ReviewModal } from './ReviewModal';

interface CustomerOrdersProps {
  goBack?: () => void;
  navigate?: (name: string, params?: any) => void;
}

export const CustomerOrders: React.FC<CustomerOrdersProps> = ({ goBack, navigate }) => {
  const { 
    orders, 
    t, 
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
    showToast(isRTL ? 'تمت إعادة إضافة المنتجات للسلة' : 'Items re-added to your cart');
    if (navigate) navigate('cart');
  };

  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          label: isRTL ? 'بانتظار التأكيد' : 'Pending', 
          color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', 
          step: 1 
        };
      case 'accepted':
        return { 
          label: isRTL ? 'مقبول' : 'Accepted', 
          color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20', 
          step: 2 
        };
      case 'preparing':
        return { 
          label: isRTL ? 'جاري التحضير' : 'Preparing', 
          color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', 
          step: 3 
        };
      case 'readyForPickup':
        return { 
          label: isRTL ? 'جاهز للاستلام' : 'Ready for Pickup', 
          color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20', 
          step: 4 
        };
      case 'pickedUp':
        return { 
          label: isRTL ? 'تم الاستلام' : 'Picked Up', 
          color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', 
          step: 5 
        };
      case 'onTheWay':
        return { 
          label: isRTL ? 'جاري التوصيل' : 'On the Way', 
          color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', 
          step: 6 
        };
      case 'delivered':
        return { 
          label: isRTL ? 'تم التوصيل' : 'Delivered', 
          color: 'text-green-500 bg-green-500/10 border-green-500/20', 
          step: 7 
        };
      case 'cancelled':
        return { 
          label: isRTL ? 'ملغي' : 'Cancelled', 
          color: 'text-red-500 bg-red-500/10 border-red-500/20', 
          step: 0 
        };
      default:
        return { 
          label: isRTL ? 'قيد المراجعة' : 'Reviewing', 
          color: 'text-theme-muted bg-theme-bg border-theme-border', 
          step: 1 
        };
    }
  };

  const getReturnStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted': return isRTL ? 'قيد المراجعة لدى التاجر' : 'Submitted';
      case 'reviewed': return isRTL ? 'تمت المراجعة' : 'Reviewed';
      case 'approved': return isRTL ? 'مقبول وبانتظار الدفع/التبديل' : 'Approved';
      case 'rejected': return isRTL ? 'طلب مرفوض' : 'Rejected';
      case 'refunded': return isRTL ? 'تم استرداد الأموال للرصيد' : 'Refunded';
      case 'replaced': return isRTL ? 'تم استبدال المنتج وإرسال المندوب' : 'Replaced';
      case 'completed': return isRTL ? 'مكتمل' : 'Completed';
      default: return status;
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'cash': return isRTL ? 'نقدي عند الاستلام' : 'Cash on Delivery';
      case 'vodafone': return isRTL ? 'فودافون كاش' : 'Vodafone Cash';
      case 'instapay': return isRTL ? 'إنستاباي' : 'InstaPay Transfer';
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
      showToast(isRTL ? 'الرجاء تحديد منتج واحد على الأقل لإرجاعه' : 'Please select at least one item to return');
      return;
    }
    if (!returnReason.trim()) {
      showToast(isRTL ? 'الرجاء إدخال سبب الإرجاع بالتفصيل' : 'Please enter return reason');
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
    showToast(isRTL ? 'تم إرسال طلب المرتجع بنجاح وبانتظار رد التاجر' : 'Return request submitted successfully');
  };

  return (
    <div className="bg-theme-bg h-full flex flex-col overflow-hidden animate-fade-in theme-transition">
      <CustomerHeader title={isRTL ? 'طلباتي ومتابعة التوصيل' : 'My Orders & Tracking'} goBack={goBack} />

      {/* Tabs */}
      <div className="flex bg-theme-card p-1 rounded-2xl border-b border-theme-border mx-4 mt-3">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
            activeTab === 'orders' ? 'bg-primary text-white shadow-sm' : 'text-theme-muted hover:text-theme-text'
          }`}
        >
          {isRTL ? 'الطلبات الجارية والسابقة' : 'Current & Past Orders'}
        </button>
        <button 
          onClick={() => setActiveTab('returns')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
            activeTab === 'returns' ? 'bg-primary text-white shadow-sm' : 'text-theme-muted hover:text-theme-text'
          }`}
        >
          {isRTL ? 'طلبات الإرجاع والاستبدال' : 'Returns & Refunds'} ({customerReturns.length})
        </button>
      </div>

      {activeTab === 'orders' ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] no-scrollbar bg-theme-bg/30">
          {orders.length === 0 ? (
            <div className="text-center py-16 text-theme-muted text-xs">
              {isRTL ? 'لا توجد طلبات جارية حالياً' : 'No active orders'}
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
                        {isRTL ? `رقم الفاتورة: ${order.id}` : `Invoice ID: ${order.id}`}
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
                        <span>{item.price * item.quantity} ج.م</span>
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
                          { step: 1, icon: Clock, label: isRTL ? 'إرسال' : 'Sent' },
                          { step: 2, icon: ThumbsUp, label: isRTL ? 'قبول' : 'Accept' },
                          { step: 3, icon: ClipboardList, label: isRTL ? 'تحضير' : 'Prep' },
                          { step: 4, icon: Package, label: isRTL ? 'جاهز' : 'Ready' },
                          { step: 5, icon: UserCheck, label: isRTL ? 'استلام' : 'Picked' },
                          { step: 6, icon: Bike, label: isRTL ? 'طريق' : 'Transit' },
                          { step: 7, icon: CheckCircle2, label: isRTL ? 'تم' : 'Done' }
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
                      {isRTL ? 'طريقة الدفع: ' : 'Payment: '}
                      {getPaymentLabel(order.paymentMethod)}
                    </span>
                    <span className="font-black text-theme-text">
                      {isRTL ? 'الإجمالي: ' : 'Total: '}
                      <span className="text-primary font-black text-sm">{order.total} ج.م</span>
                    </span>
                  </div>

                  {/* Live Tracking Link */}
                  {order.status !== 'cancelled' && navigate && (
                    <button
                      onClick={() => navigate('tracking', { orderId: order.id })}
                      className="w-full bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 theme-transition mt-2"
                    >
                      <Bike size={14} />
                      <span>{isRTL ? 'تتبع المندوب المباشر بالخريطة 🛵' : 'Live Tracking Map 🛵'}</span>
                    </button>
                  )}

                  {/* Return Request Button */}
                  {order.status === 'delivered' && (
                    <button
                      onClick={() => openReturnModal(order)}
                      className="w-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 theme-transition mt-2"
                    >
                      <RotateCcw size={14} />
                      <span>{isRTL ? 'طلب إرجاع أو استبدال منتجات 🔄' : 'Return / Refund Request 🔄'}</span>
                    </button>
                  )}

                  {/* Reorder Button */}
                  {navigate && (
                    <button
                      onClick={() => handleReorder(order)}
                      className="w-full bg-theme-bg border border-theme-border hover:border-primary/20 text-theme-text text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 theme-transition mt-2"
                    >
                      <ClipboardList size={14} className="text-primary" />
                      <span>{isRTL ? 'إعادة طلب هذه السلة (طلب مرة أخرى) 🔄' : 'Reorder This Cart 🔄'}</span>
                    </button>
                  )}

                  {/* Rate Order Button */}
                  {order.status === 'delivered' && !order.ratingStore && (
                    <button
                      onClick={() => setReviewOrder(order)}
                      className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 theme-transition mt-2"
                    >
                      <Star size={14} className="fill-amber-500 text-amber-500" />
                      <span>{isRTL ? 'تقييم تجربة الطلب والتوصيل ⭐' : 'Rate Order Experience ⭐'}</span>
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
              {isRTL ? 'لا توجد طلبات إرجاع حالية' : 'No return requests found'}
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
                      {isRTL ? `طلب مرتجع رقم: ${ret.id}` : `Return ID: ${ret.id}`}
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
                  <span className="text-[9px] font-black text-theme-muted uppercase tracking-wider block">{isRTL ? 'المنتجات المطلوب إرجاعها:' : 'Items to return:'}</span>
                  {ret.items.map(item => (
                    <div key={item.productId} className="flex justify-between text-[11px] font-bold text-theme-text">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{item.price * item.quantity} ج.م</span>
                    </div>
                  ))}
                </div>

                <div className="bg-theme-bg p-2.5 rounded-lg border border-theme-border text-[9px] text-theme-muted leading-relaxed font-bold">
                  <p><span className="font-black text-theme-text">{isRTL ? 'السبب: ' : 'Reason: '}</span>{ret.reason}</p>
                  <p className="mt-1"><span className="font-black text-theme-text">{isRTL ? 'النوع: ' : 'Type: '}</span>{ret.type === 'refund' ? (isRTL ? 'استرداد نقدي' : 'Refund') : (isRTL ? 'استبدال منتج' : 'Replacement')}</p>
                </div>

                {/* Timeline display */}
                <div className="pt-2 border-t border-theme-border/50">
                  <span className="text-[9px] font-black text-theme-muted uppercase tracking-wider block mb-2">{isRTL ? 'خطوات التتبع للطلب:' : 'Timeline Log:'}</span>
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
              <span>{isRTL ? 'تقديم طلب إرجاع/استبدال المنتجات' : 'Submit Return / Replacement Request'}</span>
            </h3>

            <div className="space-y-3">
              <span className="text-[10px] font-black text-theme-muted block">{isRTL ? 'اختر المنتجات المراد إرجاعها:' : 'Select items to return:'}</span>
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
                {isRTL ? 'استرداد نقدي (Refund)' : 'Cash Refund'}
              </button>
              <button 
                onClick={() => setReturnType('replacement')}
                className={`py-2.5 rounded-xl border text-xs font-black transition ${
                  returnType === 'replacement' ? 'border-primary bg-primary/10 text-primary' : 'border-theme-border text-theme-muted'
                }`}
              >
                {isRTL ? 'استبدال منتج (Replace)' : 'Replacement'}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-theme-muted block">{isRTL ? 'سبب الإرجاع بالتفصيل:' : 'Reason for return:'}</label>
              <textarea 
                rows={3}
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                placeholder={isRTL ? 'اكتب هنا سبب إرجاع المنتجات بالتفصيل (مثال: تالف أو منتهي الصلاحية عند الاستلام)...' : 'Enter detail reason...'}
                className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold text-theme-text outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setReturnOrder(null)}
                className="flex-1 bg-theme-bg border border-theme-border text-theme-muted font-bold py-3 rounded-xl text-xs transition"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                onClick={handleSubmitReturn}
                className="flex-1 bg-primary hover:bg-primary-hover text-white font-black py-3 rounded-xl text-xs shadow-md transition"
              >
                {isRTL ? 'تأكيد الإرسال' : 'Submit Return'}
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
