import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useRef } from 'react';
import { Bike, MapPin, DollarSign, Clock, ClipboardList, CheckCircle2, ArrowRight } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ChatWidget } from '../../components/chat/ChatWidget';
import { MessageSquare } from 'lucide-react';

interface SignaturePadProps {
  onSave: (url: string) => void;
  isRTL: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, isRTL }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawed, setHasDrawed] = useState(false);

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasDrawed(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawed(false);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawed) return;
    
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          const file = new File([blob], 'signature.webp', { type: 'image/webp' });
          const { mediaService } = await import('../../services/media.service');
          const url = await mediaService.uploadImage(file, 'proofs/signatures');
          onSave(url);
        } catch (err) {
          console.error(err);
        }
      }
    }, 'image/webp', 0.8);
  };

  return (
    <div className="space-y-2 mt-2 bg-theme-bg/60 p-3 rounded-2xl border border-theme-border/60">
      <canvas
        ref={canvasRef}
        width={300}
        height={120}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full h-28 bg-theme-bg border border-theme-border rounded-xl cursor-crosshair touch-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="flex-1 bg-theme-border/50 text-[10px] font-black py-2 rounded-lg text-theme-text"
        >
          {isRTL ? 'مسح التوقيع' : 'Clear'}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasDrawed}
          className="flex-1 bg-primary text-white text-[10px] font-black py-2 rounded-lg disabled:opacity-50"
        >
          {isRTL ? 'حفظ توقيع العميل' : 'Save Signature'}
        </button>
      </div>
    </div>
  );
};

interface DriverOrdersProps {
  driver: any;
}

export const DriverOrders: React.FC<DriverOrdersProps> = ({ driver }) => {
  const { t } = useTranslation();
  const { orders, isRTL, showToast } = useApp();
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);
  const [enteredOtps, setEnteredOtps] = useState<Record<string, string>>({});
  const [signatureUrls, setSignatureUrls] = useState<Record<string, string>>({});
  const [deliveryPhotoUrls, setDeliveryPhotoUrls] = useState<Record<string, string>>({});
  const [damagePhotoUrls, setDamagePhotoUrls] = useState<Record<string, string>>({});

  const handlePhotoUpload = async (orderId: string, file: File, type: 'delivery' | 'damage') => {
    try {
      const { mediaService } = await import('../../services/media.service');
      const url = await mediaService.uploadImage(file, `proofs/${type}`);
      if (type === 'delivery') {
        setDeliveryPhotoUrls(prev => ({ ...prev, [orderId]: url }));
      } else {
        setDamagePhotoUrls(prev => ({ ...prev, [orderId]: url }));
      }
      showToast(t('str_219') || 'Uploaded successfully');
    } catch (err) {
      console.error(err);
      showToast(t('str_537') || 'Upload failed', 'error');
    }
  };

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

    let otpParam: string | undefined;
    let signatureUrl: string | undefined;
    let deliveryPhotoUrl: string | undefined;
    let damagePhotoUrl: string | undefined;

    if (currentStatus === 'delivering') {
      const enteredOtp = enteredOtps[orderId] || '';
      if (enteredOtp.length !== 6) {
        showToast(isRTL ? 'يرجى إدخال رمز التحقق المكون من 6 أرقام للتسليم' : 'Please enter the 6-digit verification OTP to complete delivery', 'warning');
        return;
      }
      otpParam = enteredOtp;

      signatureUrl = signatureUrls[orderId];
      deliveryPhotoUrl = deliveryPhotoUrls[orderId];
      damagePhotoUrl = damagePhotoUrls[orderId];

      if (!signatureUrl) {
        showToast(isRTL ? 'يرجى حفظ توقيع العميل أولاً' : 'Please save customer signature first', 'warning');
        return;
      }
      if (!deliveryPhotoUrl) {
        showToast(isRTL ? 'يرجى رفع صورة التوصيل أولاً' : 'Please upload delivery photo first', 'warning');
        return;
      }
    }

    try {
      const orderObj = orders.find(o => o.id === orderId);
      const fee = orderObj?.estimatedDriverEarnings ?? orderObj?.deliveryFee ?? 20;
      await import('../../services/driver/service').then(m => m.driverService.updateOrderStatus(
        driver.id,
        orderId,
        newStatus,
        fee,
        otpParam,
        signatureUrl,
        deliveryPhotoUrl,
        damagePhotoUrl
      ));
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

                  {/* Navigation Links */}
                  <div className="flex gap-1.5 w-full flex-wrap">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${order.location?.coords?.lat || 30.0444},${order.location?.coords?.lng || 31.2357}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[70px] bg-theme-bg border border-theme-border text-[9px] font-black text-theme-text py-2 rounded-lg text-center flex items-center justify-center hover:bg-theme-border/20 transition"
                    >
                      Google
                    </a>
                    <a
                      href={`https://waze.com/ul?ll=${order.location?.coords?.lat || 30.0444},${order.location?.coords?.lng || 31.2357}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[70px] bg-theme-bg border border-theme-border text-[9px] font-black text-blue-500 py-2 rounded-lg text-center flex items-center justify-center hover:bg-theme-border/20 transition"
                    >
                      Waze
                    </a>
                    <a
                      href={`maps://?daddr=${order.location?.coords?.lat || 30.0444},${order.location?.coords?.lng || 31.2357}&dirflg=d`}
                      className="flex-1 min-w-[70px] bg-theme-bg border border-theme-border text-[9px] font-black text-emerald-600 py-2 rounded-lg text-center flex items-center justify-center hover:bg-theme-border/20 transition"
                    >
                      Apple
                    </a>
                  </div>

                  {/* Proof of Delivery V2 Panel */}
                  {(order.status as string) === 'delivering' && (
                    <div className="space-y-3.5 border-t border-theme-border/40 pt-3">
                      {/* OTP Code */}
                      <div>
                        <label className="text-[10px] text-theme-muted font-black block mb-1">
                          {isRTL ? 'رمز التحقق (OTP) من العميل' : 'Customer Verification OTP'}
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 123456"
                          value={enteredOtps[order.id] || ''}
                          onChange={(e) => setEnteredOtps(prev => ({ ...prev, [order.id]: e.target.value }))}
                          className="w-full bg-theme-bg border border-theme-border px-3 py-2 rounded-xl text-center font-mono font-black text-sm tracking-widest text-theme-text"
                        />
                      </div>

                      {/* Delivery Photo */}
                      <div>
                        <label className="text-[10px] text-theme-muted font-black block mb-1">
                          {isRTL ? 'صورة إثبات التوصيل (مطلوب)' : 'Delivery Proof Photo (Required)'}
                        </label>
                        {deliveryPhotoUrls[order.id] ? (
                          <div className="flex items-center gap-2 bg-green-500/10 p-2.5 rounded-xl border border-green-500/20">
                            <span className="text-[10px] font-bold text-green-600 truncate flex-1">{deliveryPhotoUrls[order.id]}</span>
                            <button
                              type="button"
                              onClick={() => setDeliveryPhotoUrls(prev => ({ ...prev, [order.id]: '' }))}
                              className="text-[9px] font-black text-red-500 hover:underline"
                            >
                              {isRTL ? 'إزالة' : 'Remove'}
                            </button>
                          </div>
                        ) : (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePhotoUpload(order.id, file, 'delivery');
                            }}
                            className="w-full text-xs text-theme-text file:bg-primary file:text-white file:border-0 file:py-1.5 file:px-3 file:rounded-lg file:font-black file:text-[10px] file:mr-2"
                          />
                        )}
                      </div>

                      {/* Damage Photo */}
                      <div>
                        <label className="text-[10px] text-theme-muted font-black block mb-1">
                          {isRTL ? 'صورة التلف/الأضرار إن وجدت (اختياري)' : 'Damage Photo (Optional)'}
                        </label>
                        {damagePhotoUrls[order.id] ? (
                          <div className="flex items-center gap-2 bg-yellow-500/10 p-2.5 rounded-xl border border-yellow-500/20">
                            <span className="text-[10px] font-bold text-yellow-600 truncate flex-1">{damagePhotoUrls[order.id]}</span>
                            <button
                              type="button"
                              onClick={() => setDamagePhotoUrls(prev => ({ ...prev, [order.id]: '' }))}
                              className="text-[9px] font-black text-red-500 hover:underline"
                            >
                              {isRTL ? 'إزالة' : 'Remove'}
                            </button>
                          </div>
                        ) : (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePhotoUpload(order.id, file, 'damage');
                            }}
                            className="w-full text-xs text-theme-text file:bg-theme-border file:text-theme-text file:border-0 file:py-1.5 file:px-3 file:rounded-lg file:font-black file:text-[10px] file:mr-2"
                          />
                        )}
                      </div>

                      {/* Customer Signature Pad */}
                      <div>
                        <label className="text-[10px] text-theme-muted font-black block">
                          {isRTL ? 'توقيع العميل (مطلوب)' : 'Customer Signature (Required)'}
                        </label>
                        {signatureUrls[order.id] ? (
                          <div className="flex items-center gap-2 bg-green-500/10 p-2.5 rounded-xl border border-green-500/20 mt-1">
                            <span className="text-[10px] font-bold text-green-600 truncate flex-1">{signatureUrls[order.id]}</span>
                            <button
                              type="button"
                              onClick={() => setSignatureUrls(prev => ({ ...prev, [order.id]: '' }))}
                              className="text-[9px] font-black text-red-500 hover:underline"
                            >
                              {isRTL ? 'إعادة التوقيع' : 'Re-sign'}
                            </button>
                          </div>
                        ) : (
                          <SignaturePad
                            onSave={(url) => setSignatureUrls(prev => ({ ...prev, [order.id]: url }))}
                            isRTL={isRTL}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleUpdateStatus(order.id, order.status)}
                    className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-black text-sm shadow-md transition flex justify-center items-center gap-2"
                  >
                    {order.status === 'accepted' && (t('str_1119'))}
                    {order.status === 'picked_up' && (t('str_1120'))}
                    {(order.status as string) === 'delivering' && (isRTL ? 'توصيل الطلب والتحقق' : 'Complete Delivery & Verify')}
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
