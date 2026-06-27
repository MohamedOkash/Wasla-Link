import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { Clock, Check, X, ImageIcon, MapPin, Phone, Printer, ThumbsUp, ClipboardList, Package, UserCheck, Bike, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Order } from '../../types/order.types';
import { invoiceService } from '../../services/invoice.service';
import { dispatchService } from '../../services/dispatch.service';
import { VendorTracking } from './VendorTracking';
import { VendorDeliveryCenter } from './VendorDeliveryCenter';
import { useStores } from '../../hooks/useStores';

export const VendorOrders: React.FC = () => {
  const { t } = useTranslation();
  // Filter orders for Store g_1 (أسواق الخير)
  const { orders, updateOrderStatus, showToast, isRTL, currentUser } = useApp();
  const { stores } = useStores();
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
  const {} = useTranslation();

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
      if (tabId === 'new') return o.status === 'pending' && o.paymentMethod === 'cash_on_delivery';
      if (tabId === 'pendingVerification') return o.status === 'pending' && o.paymentMethod !== 'cash_on_delivery';
      if (tabId === 'preparing') return o.status === 'accepted' || o.status === 'preparing';
      if (tabId === 'outForDelivery') return o.status === 'ready_for_delivery' || o.status === 'picked_up' || o.status === 'on_the_way';
      if (tabId === 'delivered') return o.status === 'delivered';
      if (tabId === 'cancelled') return o.status === 'cancelled';
      return false;
    }).length;
  };

  const filteredOrders = vendorOrders.filter(o => {
    if (statusFilter === 'new') return o.status === 'pending' && o.paymentMethod === 'cash_on_delivery';
    if (statusFilter === 'pendingVerification') return o.status === 'pending' && o.paymentMethod !== 'cash_on_delivery';
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
    if (confirm(t('str_853'))) {
      handleUpdateStatus(
        orderId, 
        'cancelled', 
        t('str_854')
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
            <h3 className="font-black text-theme-text text-xs mb-4 text-center">{t('str_855')}</h3>
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
              <h3 className="font-black text-theme-text text-sm">{t('str_856')}</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    showToast(t('str_857'));
                    invoiceService.downloadPDF('printable-invoice-element', `invoice-${activeInvoice.id}.pdf`)
                      .then(() => showToast(t('str_858')))
                      .catch(() => showToast(t('str_859')));
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-black px-3 py-2 rounded-xl flex items-center gap-1 transition active:scale-95"
                >
                  {t('str_860')}
                </button>
                <button 
                  onClick={printInvoice}
                  className="bg-primary hover:bg-primary-hover text-white text-[10px] font-black px-3 py-2 rounded-xl flex items-center gap-1 shadow transition active:scale-95"
                >
                  <Printer size={12} /> {t('str_861')}
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
                <h2 className="text-xl font-black text-primary print:text-black">{t('str_862')}</h2>
                <p className="text-[10px] text-theme-muted font-bold mt-1 print:text-black">{t('str_863')}</p>
              </div>

              <div className="border-t border-b border-theme-border py-3 space-y-1.5 text-xs font-bold text-theme-muted print:border-black print:text-black">
                <div className="flex justify-between"><span>{t('str_864')}</span> <span className="font-black text-theme-text print:text-black">{invoiceService.generateInvoiceNumber(activeInvoice.id)}</span></div>
                <div className="flex justify-between"><span>{t('str_865')}</span> <span>{new Date(activeInvoice.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}</span></div>
                <div className="flex justify-between"><span>{t('str_866')}</span> <span className="font-black">{activeInvoice.shopName}</span></div>
                <div className="flex justify-between"><span>{t('str_122')}</span> <span>{activeInvoice.paymentMethod === 'cash_on_delivery' ? (t('str_149')) : activeInvoice.paymentMethod === 'vodafone_cash' ? 'Vodafone Cash' : 'InstaPay'}</span></div>
              </div>

              {/* Items Table */}
              <div className="space-y-2.5">
                <p className="text-[10px] font-black text-theme-muted">{t('str_867')}</p>
                <div className="space-y-2 border-b border-theme-border pb-3 print:border-black">
                  {activeInvoice.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-bold text-theme-text print:text-black">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{item.price * item.quantity} {t('currencyEGP')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 text-xs font-bold text-theme-muted print:text-black">
                <div className="flex justify-between"><span>{t('str_128')}</span> <span>{activeInvoice.subtotal} {t('currencyEGP')}</span></div>
                {activeInvoice.discount !== undefined && activeInvoice.discount > 0 && (
                  <div className="flex justify-between text-green-500"><span>{t('str_61')}</span> <span>-{activeInvoice.discount} {t('currencyEGP')}</span></div>
                )}
                <div className="flex justify-between"><span>{t('str_868')}</span> <span>{activeInvoice.deliveryFee} {t('currencyEGP')}</span></div>
                <div className="flex justify-between text-xs font-black text-theme-text border-t border-theme-border pt-2 print:border-black print:text-black">
                  <span>{t('str_869')}</span>
                  <span className="text-primary font-black print:text-black">{activeInvoice.total} {t('currencyEGP')}</span>
                </div>
              </div>

              {/* QR Code */}
              {invoiceQRCode && (
                <div className="flex flex-col items-center justify-center pt-4 border-t border-theme-border/50 print:border-black">
                  <img src={invoiceQRCode} className="w-24 h-24 border border-theme-border rounded-lg bg-white p-1" alt="Invoice QR Code" />
                  <p className="text-[8px] text-theme-muted mt-1">{t('str_870')}</p>
                </div>
              )}
            </div>

            <p className="text-[9px] text-theme-muted font-bold text-center mt-6 border-t border-theme-border pt-4 print:text-black print:border-black">
              {t('str_871')}
            </p>
          </div>
        </div>
      )}

      {/* Tabs Switcher Grid */}
      <div className="bg-theme-card p-1 rounded-2xl border border-theme-border shadow-sm flex overflow-x-auto no-scrollbar gap-1.5 theme-transition">
        {[
          { id: 'new', label: t('str_872') },
          { id: 'pendingVerification', label: t('str_873') },
          { id: 'preparing', label: t('str_874') },
          { id: 'outForDelivery', label: t('str_875') },
          { id: 'delivered', label: t('str_876') },
          { id: 'cancelled', label: t('str_877') },
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
            <p className="text-xs">{t('str_878')}</p>
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
                  <h4 className="font-black text-xs text-theme-text">{t('str_879')}</h4>
                  <p className="text-[10px] text-theme-muted font-bold mt-0.5">{t('str_880')}</p>
                </div>
                <button
                  onClick={() => setActiveInvoice(order)}
                  className="text-theme-muted hover:text-primary p-2 bg-theme-bg hover:bg-primary/10 rounded-xl transition"
                  title={t('str_881')}
                >
                  <Printer size={14} />
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2.5 text-xs font-bold text-theme-muted">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between text-theme-text">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{item.price * item.quantity} {t('currencyEGP')}</span>
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
                      { step: 1, icon: Clock, label: t('str_158') },
                      { step: 2, icon: ThumbsUp, label: t('str_159') },
                      { step: 3, icon: ClipboardList, label: t('str_160') },
                      { step: 4, icon: Package, label: t('str_161') },
                      { step: 5, icon: UserCheck, label: t('str_162') },
                      { step: 6, icon: Bike, label: t('str_163') },
                      { step: 7, icon: CheckCircle2, label: t('str_164') }
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
                  <span>{t('str_165')}{order.paymentMethod === 'cash_on_delivery' ? (t('str_595')) : order.paymentMethod === 'vodafone_cash' ? 'Vodafone Cash' : 'InstaPay'}</span>
                  {order.paymentReceipt && (
                    <button 
                      onClick={() => setActiveReceipt(order.paymentReceipt || null)}
                      className="text-primary font-black flex items-center gap-1 hover:underline"
                    >
                      <ImageIcon size={11} /> {t('str_882')}
                    </button>
                  )}
                </div>
              </div>

              {/* Actions Based on Current Status */}
              <div className="flex gap-2">
                {order.status === 'pending' && order.paymentMethod === 'cash_on_delivery' && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(
                        order.id, 
                        'preparing', 
                        t('str_883')
                      )}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow transition"
                    >
                      <Check size={14} strokeWidth={3} /> {t('str_884')}
                    </button>
                    <button 
                      onClick={() => handleRejectOrder(order.id)}
                      className="bg-red-500/10 hover:bg-red-500/15 text-red-500 font-black p-3 rounded-2xl border border-red-500/20 transition"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </>
                )}

                {order.status === 'pending' && order.paymentMethod !== 'cash_on_delivery' && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(
                        order.id, 
                        'accepted', 
                        t('str_885')
                      )}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow transition"
                    >
                      <Check size={14} strokeWidth={3} /> {t('str_886')}
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
                        t('str_887')
                      )}
                      className="flex-1 bg-primary hover:bg-primary-hover text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow transition"
                    >
                      {t('str_888')}
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
                        t('str_889')
                      )}
                      className="flex-1 bg-primary hover:bg-primary-hover text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow transition"
                    >
                      {t('str_890')}
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
                    {t('str_891')}
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
                      storeLocation={(stores.find(s => s.id === currentUser?.storeId)?.location as { lat: number, lng: number }) || { lat: 30.0444, lng: 31.2357 }} 
                    />
                    {order.status === 'on_the_way' && <VendorTracking order={order} />}
                  </div>
                )}

                {order.status === 'delivered' && (
                  <div className="flex-1 bg-green-500/10 text-green-500 font-black py-3 rounded-2xl text-xs text-center border border-green-500/20">
                    {t('str_892')}
                  </div>
                )}

                {order.status === 'cancelled' && (
                  <div className="flex-1 bg-red-500/10 text-red-500 font-black py-3 rounded-2xl text-xs text-center border border-red-500/20">
                    {t('str_893')}
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
