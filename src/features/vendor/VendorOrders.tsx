import React, { useState, useEffect } from 'react';
import { Clock, Check, X, ImageIcon, MapPin, Phone, Printer, ThumbsUp, ClipboardList, Package, UserCheck, Bike, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Order } from '../../types/order.types';
import { invoiceService } from '../../services/invoice.service';
import { dispatchService } from '../../services/dispatch.service';
import { VendorTracking } from './VendorTracking';
import { VendorDeliveryCenter } from './VendorDeliveryCenter';

export const VendorOrders: React.FC = () => {
  // Filter orders for Store g_1 (أسواق الخير)
  const { orders, updateOrderStatus, showToast, isRTL } = useApp();
  const [activeReceipt, setActiveReceipt] = useState<string | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<Order | null>(null);
  const [invoiceQRCode, setInvoiceQRCode] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'new' | 'pendingVerification' | 'preparing' | 'outForDelivery' | 'delivered' | 'cancelled'>('new');

  useEffect(() => {
    if (activeInvoice) {
      const qrContent = `Invoice:${invoiceService.generateInvoiceNumber(activeInvoice.id)}\nStore:${activeInvoice.shopName}\nTotal:${activeInvoice.total} EGP\nDate:${new Date(activeInvoice.createdAt).toLocaleDateString()}`;
      invoiceService.generateQRCode(qrContent).then(url => {
        setInvoiceQRCode(url);
      });
    } else {
      setInvoiceQRCode(null);
    }
  }, [activeInvoice]);

  const getOrderStepNumber = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'accepted': return 2;
      case 'preparing': return 3;
      case 'ready_for_delivery': return 4;
      case 'picked_up': return 5;
      case 'on_the_way': return 6;
      case 'delivered': return 7;
      default: return 1;
    }
  };

  // Filter orders for Store g_1 (أسواق الخير)
  const vendorOrders = orders.filter(o => o.shopId === 'g_1');

  // Helper to count orders for each tab
  const getTabOrdersCount = (tabId: string) => {
    return vendorOrders.filter(o => {
      if (tabId === 'new') return o.status === 'pending' && o.paymentMethod === 'cash';
      if (tabId === 'pendingVerification') return o.status === 'pending' && o.paymentMethod !== 'cash';
      if (tabId === 'preparing') return o.status === 'accepted' || o.status === 'preparing';
      if (tabId === 'outForDelivery') return o.status === 'ready_for_delivery' || o.status === 'picked_up' || o.status === 'on_the_way';
      if (tabId === 'delivered') return o.status === 'delivered';
      if (tabId === 'cancelled') return o.status === 'cancelled';
      return false;
    }).length;
  };

  const filteredOrders = vendorOrders.filter(o => {
    if (statusFilter === 'new') return o.status === 'pending' && o.paymentMethod === 'cash';
    if (statusFilter === 'pendingVerification') return o.status === 'pending' && o.paymentMethod !== 'cash';
    if (statusFilter === 'preparing') return o.status === 'accepted' || o.status === 'preparing';
    if (statusFilter === 'outForDelivery') return o.status === 'ready_for_delivery' || o.status === 'picked_up' || o.status === 'on_the_way';
    if (statusFilter === 'delivered') return o.status === 'delivered';
    if (statusFilter === 'cancelled') return o.status === 'cancelled';
    return false;
  });

  const handleUpdateStatus = (orderId: string, nextStatus: Order['status'], successMsg: string) => {
    updateOrderStatus(orderId, nextStatus);
    showToast(successMsg);
  };

  const handleRejectOrder = (orderId: string) => {
    if (confirm(isRTL ? 'هل أنت متأكد من رفض وإلغاء هذا الطلب؟' : 'Are you sure you want to reject and cancel this order?')) {
      handleUpdateStatus(
        orderId, 
        'cancelled', 
        isRTL ? 'تم إلغاء الطلب وتحويله لقسم الملغية' : 'Order cancelled and moved to cancelled queue'
      );
    }
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Receipt Proof Preview Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-[100] animate-fade-in">
          <div className="relative bg-theme-card border border-theme-border rounded-3xl overflow-hidden max-w-sm w-full p-5 shadow-2xl theme-transition">
            <button 
              onClick={() => setActiveReceipt(null)} 
              className="absolute top-4 left-4 bg-primary text-white p-2 rounded-full font-black shadow-md z-10 hover:scale-105 active:scale-95 transition"
            >
              <X size={16} />
            </button>
            <h3 className="font-black text-theme-text text-xs mb-4 text-center">{isRTL ? 'لقطة شاشة إيصال الدفع' : 'Payment Transfer Receipt Screenshot'}</h3>
            <img src={activeReceipt} className="w-full h-80 object-contain rounded-2xl bg-theme-bg border border-theme-border" alt="Receipt Proof" />
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {activeInvoice && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-[100] animate-fade-in print:bg-white print:p-0">
          <div className="relative bg-theme-card border border-theme-border rounded-3xl overflow-hidden max-w-md w-full p-6 shadow-2xl flex flex-col justify-between print:shadow-none print:rounded-none print:w-full print:h-full print:p-0 print:border-none theme-transition">
            {/* Close & Print buttons */}
            <div className="flex justify-between items-center mb-6 border-b border-theme-border pb-4 print:hidden">
              <h3 className="font-black text-theme-text text-sm">{isRTL ? 'تفاصيل الفاتورة' : 'Detailed Invoice Bill'}</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    showToast(isRTL ? 'جاري تحضير ملف PDF للتنزيل...' : 'Preparing PDF file for download...');
                    invoiceService.downloadPDF('printable-invoice-element', `invoice-${activeInvoice.id}.pdf`)
                      .then(() => showToast(isRTL ? 'تم التنزيل بنجاح' : 'Downloaded successfully'))
                      .catch(() => showToast(isRTL ? 'فشل التنزيل' : 'Download failed'));
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-black px-3 py-2 rounded-xl flex items-center gap-1 transition active:scale-95"
                >
                  {isRTL ? 'تنزيل PDF' : 'PDF'}
                </button>
                <button 
                  onClick={printInvoice}
                  className="bg-primary hover:bg-primary-hover text-white text-[10px] font-black px-3 py-2 rounded-xl flex items-center gap-1 shadow transition active:scale-95"
                >
                  <Printer size={12} /> {isRTL ? 'طباعة' : 'Print'}
                </button>
                <button 
                  onClick={() => setActiveInvoice(null)} 
                  className="p-2 bg-theme-bg text-theme-text hover:bg-theme-border rounded-xl transition"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Invoice Design */}
            <div id="printable-invoice-element" className="space-y-4 text-theme-text p-4 rounded-2xl bg-theme-card print:text-black">
              <div className="text-center">
                <h2 className="text-xl font-black text-primary print:text-black">{isRTL ? 'سوق البلد — SOUQ EL BALAD' : 'SOUQ EL BALAD'}</h2>
                <p className="text-[10px] text-theme-muted font-bold mt-1 print:text-black">{isRTL ? 'فاتورة بيع رسمية للمشتريات' : 'Official Customer Order Invoice'}</p>
              </div>

              <div className="border-t border-b border-theme-border py-3 space-y-1.5 text-xs font-bold text-theme-muted print:border-black print:text-black">
                <div className="flex justify-between"><span>{isRTL ? 'رقم الفاتورة:' : 'Invoice ID:'}</span> <span className="font-black text-theme-text print:text-black">{invoiceService.generateInvoiceNumber(activeInvoice.id)}</span></div>
                <div className="flex justify-between"><span>{isRTL ? 'تاريخ الطلب:' : 'Order Date:'}</span> <span>{new Date(activeInvoice.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}</span></div>
                <div className="flex justify-between"><span>{isRTL ? 'المتجر:' : 'Store Name:'}</span> <span className="font-black">{activeInvoice.shopName}</span></div>
                <div className="flex justify-between"><span>{isRTL ? 'طريقة الدفع:' : 'Payment Method:'}</span> <span>{activeInvoice.paymentMethod === 'cash' ? (isRTL ? 'نقدي عند الاستلام' : 'Cash') : activeInvoice.paymentMethod === 'vodafone' ? 'Vodafone Cash' : 'InstaPay'}</span></div>
              </div>

              {/* Items Table */}
              <div className="space-y-2.5">
                <p className="text-[10px] font-black text-theme-muted">{isRTL ? 'قائمة المشتريات:' : 'Purchased Items Catalog:'}</p>
                <div className="space-y-2 border-b border-theme-border pb-3 print:border-black">
                  {activeInvoice.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-bold text-theme-text print:text-black">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{item.price * item.quantity} ج.م</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 text-xs font-bold text-theme-muted print:text-black">
                <div className="flex justify-between"><span>{isRTL ? 'المجموع الفرعي:' : 'Subtotal:'}</span> <span>{activeInvoice.subtotal} ج.م</span></div>
                {activeInvoice.discount !== undefined && activeInvoice.discount > 0 && (
                  <div className="flex justify-between text-green-500"><span>{isRTL ? 'خصم الكوبون:' : 'Coupon Discount:'}</span> <span>-{activeInvoice.discount} ج.م</span></div>
                )}
                <div className="flex justify-between"><span>{isRTL ? 'رسوم خدمة التوصيل:' : 'Delivery fee:'}</span> <span>{activeInvoice.deliveryFee} ج.م</span></div>
                <div className="flex justify-between text-xs font-black text-theme-text border-t border-theme-border pt-2 print:border-black print:text-black">
                  <span>{isRTL ? 'الإجمالي الكلي:' : 'Grand Total:'}</span>
                  <span className="text-primary font-black print:text-black">{activeInvoice.total} ج.م</span>
                </div>
              </div>

              {/* QR Code */}
              {invoiceQRCode && (
                <div className="flex flex-col items-center justify-center pt-4 border-t border-theme-border/50 print:border-black">
                  <img src={invoiceQRCode} className="w-24 h-24 border border-theme-border rounded-lg bg-white p-1" alt="Invoice QR Code" />
                  <p className="text-[8px] text-theme-muted mt-1">{isRTL ? 'امسح الرمز للتحقق من الفاتورة عبر سوق البلد' : 'Scan code to verify invoice via Souq El Balad'}</p>
                </div>
              )}
            </div>

            <p className="text-[9px] text-theme-muted font-bold text-center mt-6 border-t border-theme-border pt-4 print:text-black print:border-black">
              {isRTL ? 'شكراً لاستخدامك منصة سوق البلد للتجارة المحلية 🔗' : 'Thank you for choosing Souq El Balad local commerce! 🔗'}
            </p>
          </div>
        </div>
      )}

      {/* Tabs Switcher Grid */}
      <div className="bg-theme-card p-1 rounded-2xl border border-theme-border shadow-sm flex overflow-x-auto no-scrollbar gap-1.5 theme-transition">
        {[
          { id: 'new', label: isRTL ? 'الجديدة' : 'New' },
          { id: 'pendingVerification', label: isRTL ? 'تأكيد الدفع' : 'Verify Pay' },
          { id: 'preparing', label: isRTL ? 'التحضير' : 'Prepare' },
          { id: 'outForDelivery', label: isRTL ? 'التوصيل' : 'Shipping' },
          { id: 'delivered', label: isRTL ? 'المسلمة' : 'Completed' },
          { id: 'cancelled', label: isRTL ? 'الملغاة' : 'Cancelled' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={`px-3 py-2 text-[10px] font-black rounded-xl whitespace-nowrap transition flex-shrink-0 ${
              statusFilter === tab.id 
                ? 'bg-primary text-white shadow-sm font-black' 
                : 'text-theme-muted hover:text-theme-text hover:bg-theme-bg'
            }`}
          >
            {tab.label} ({getTabOrdersCount(tab.id)})
          </button>
        ))}
      </div>

      {/* Orders List Content */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-theme-card rounded-[24px] p-8 border border-theme-border text-center text-theme-muted font-bold shadow-sm theme-transition">
            <Clock size={32} className="mx-auto mb-2 text-theme-muted" />
            <p className="text-xs">{isRTL ? 'لا توجد طلبات جارية في هذا القسم حالياً' : 'No incoming orders in this queue.'}</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div 
              key={order.id} 
              className="bg-theme-card rounded-[24px] p-5 border border-theme-border shadow-sm space-y-4 theme-transition animate-card-entrance"
            >
              {/* Header Info */}
              <div className="flex justify-between items-start pb-3 border-b border-theme-border/60">
                <div>
                  <h4 className="font-black text-xs text-theme-text">{isRTL ? `طلب رقم: ${order.id}` : `Order ID: ${order.id}`}</h4>
                  <p className="text-[10px] text-theme-muted font-bold mt-0.5">{isRTL ? 'العميل: أحمد محمود' : 'Client: Ahmed Mahmoud'}</p>
                </div>
                <button
                  onClick={() => setActiveInvoice(order)}
                  className="text-theme-muted hover:text-primary p-2 bg-theme-bg hover:bg-primary/10 rounded-xl transition"
                  title={isRTL ? 'طباعة الفاتورة' : 'Print Invoice'}
                >
                  <Printer size={14} />
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2.5 text-xs font-bold text-theme-muted">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between text-theme-text">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{item.price * item.quantity} ج.م</span>
                  </div>
                ))}
              </div>

              {/* Status Stepper Tracker */}
              {order.status !== 'cancelled' && (
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
              )}

              {/* Delivery Details Card */}
              <div className="bg-theme-bg p-3 rounded-xl text-[10px] font-bold text-theme-muted space-y-2 border border-theme-border">
                <div className="flex items-center gap-1.5"><MapPin size={12} className="text-theme-muted" /> <span className="truncate">{order.location.name}</span></div>
                <div className="flex items-center gap-1.5"><Phone size={12} className="text-theme-muted" /> <span>+20 101 234 5678</span></div>
                <div className="pt-2 flex items-center justify-between text-[9px] text-theme-muted font-bold border-t border-theme-border mt-1.5">
                  <span>{isRTL ? 'طريقة الدفع: ' : 'Payment: '}{order.paymentMethod === 'cash' ? (isRTL ? 'نقدي' : 'Cash') : order.paymentMethod === 'vodafone' ? 'Vodafone Cash' : 'InstaPay'}</span>
                  {order.paymentReceipt && (
                    <button 
                      onClick={() => setActiveReceipt(order.paymentReceipt || null)}
                      className="text-primary font-black flex items-center gap-1 hover:underline"
                    >
                      <ImageIcon size={11} /> {isRTL ? 'عرض إيصال الدفع' : 'View Transfer Receipt'}
                    </button>
                  )}
                </div>
              </div>

              {/* Actions Based on Current Status */}
              <div className="flex gap-2">
                {order.status === 'pending' && order.paymentMethod === 'cash' && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(
                        order.id, 
                        'preparing', 
                        isRTL ? 'تم قبول الطلب وبدء التحضير' : 'Order accepted and preparation started'
                      )}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow transition"
                    >
                      <Check size={14} strokeWidth={3} /> {isRTL ? 'قبول وتجهيز الطلب' : 'Accept & Prepare'}
                    </button>
                    <button 
                      onClick={() => handleRejectOrder(order.id)}
                      className="bg-red-500/10 hover:bg-red-500/15 text-red-500 font-black p-3 rounded-2xl border border-red-500/20 transition"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </>
                )}

                {order.status === 'pending' && order.paymentMethod !== 'cash' && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(
                        order.id, 
                        'accepted', 
                        isRTL ? 'تم تأكيد استلام المبلغ وقبول الطلب' : 'Receipt verified, order accepted'
                      )}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow transition"
                    >
                      <Check size={14} strokeWidth={3} /> {isRTL ? 'تأكيد وقبول الدفع' : 'Verify & Approve Payment'}
                    </button>
                    <button 
                      onClick={() => handleRejectOrder(order.id)}
                      className="bg-red-500/10 hover:bg-red-500/15 text-red-500 font-black p-3 rounded-2xl border border-red-500/20 transition"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </>
                )}

                {order.status === 'accepted' && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(
                        order.id, 
                        'preparing', 
                        isRTL ? 'تم بدء تحضير وتعبئة المنتجات' : 'Started preparing and packing products'
                      )}
                      className="flex-1 bg-primary hover:bg-primary-hover text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow transition"
                    >
                      {isRTL ? 'بدء تجهيز الطلب' : 'Start Preparation'}
                    </button>
                    <button 
                      onClick={() => handleRejectOrder(order.id)}
                      className="bg-red-500/10 hover:bg-red-500/15 text-red-500 font-black p-3 rounded-2xl border border-red-500/20 transition"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </>
                )}

                {order.status === 'preparing' && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(
                        order.id, 
                        'ready_for_delivery', 
                        isRTL ? 'الطلب جاهز للتسليم، في انتظار مندوب توصيل' : 'Order marked ready, waiting for driver pickup'
                      )}
                      className="flex-1 bg-primary hover:bg-primary-hover text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow transition"
                    >
                      {isRTL ? 'جاهز للتسليم (طلب مندوب)' : 'Mark Ready for Pickup'}
                    </button>
                    <button 
                      onClick={() => handleRejectOrder(order.id)}
                      className="bg-red-500/10 hover:bg-red-500/15 text-red-500 font-black p-3 rounded-2xl border border-red-500/20 transition"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </>
                )}

                {order.status === 'ready_for_delivery' && (
                  <div className="flex-1 bg-yellow-500/10 text-yellow-600 font-black py-3 rounded-2xl text-xs text-center border border-yellow-500/20">
                    {isRTL ? 'في انتظار قبول وقبول التوصيل من سائق...' : 'Waiting for a delivery driver to accept...'}
                  </div>
                )}

                {order.status === 'picked_up' && (
                  <div className="flex-1 bg-blue-500/10 text-blue-600 font-black py-3 rounded-2xl text-xs text-center border border-blue-500/20">
                    {isRTL ? `جاري التجهيز للشحن مع المندوب: ${order.driverName || ''}` : `Picked up by driver: ${order.driverName || ''}`}
                  </div>
                )}

                {(order.status === 'ready_for_delivery' || order.status === 'driver_assigned' || order.status === 'driver_accepted' || order.status === 'picked_up' || order.status === 'on_the_way') && (
                  <div className="mt-4 pt-4 border-t border-theme-border">
                    <VendorDeliveryCenter 
                      order={order} 
                      storeLocation={stores.find(s => s.id === currentUser?.storeId)?.location || { lat: 30.0444, lng: 31.2357 }} 
                    />
                    {order.status === 'on_the_way' && <VendorTracking order={order} />}
                  </div>
                )}

                {order.status === 'delivered' && (
                  <div className="flex-1 bg-green-500/10 text-green-500 font-black py-3 rounded-2xl text-xs text-center border border-green-500/20">
                    {isRTL ? `تم تسليم الطلب وتحصيل ${order.total} ج.م بنجاح` : `Delivered, collected EGP ${order.total}`}
                  </div>
                )}

                {order.status === 'cancelled' && (
                  <div className="flex-1 bg-red-500/10 text-red-500 font-black py-3 rounded-2xl text-xs text-center border border-red-500/20">
                    {isRTL ? 'طلب ملغي' : 'Cancelled Order'}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default VendorOrders;
