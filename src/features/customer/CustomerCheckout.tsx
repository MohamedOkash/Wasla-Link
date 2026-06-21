import React, { useState } from 'react';
import { ChevronRight, MapPin, Wallet, Check, AlertCircle, Camera, Upload, Plus, Info, Coins, Minus, ClipboardList } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { calculateDiscountedPrice } from '../../utils/promo';
import { Product } from '../../types/product.types';
import { couponService } from '../../services/coupon.service';
import { mediaService } from '../../services/media.service';
import { deliveryFeeService } from '../../services/deliveryFee.service';
import { doc, writeBatch, increment } from 'firebase/firestore';
import { db } from '../../services/firebase';

// Premium Rebuild Imports
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumInput } from '../../components/premium/PremiumInput';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { PremiumBadge } from '../../components/premium/PremiumBadge';
import { getStoreStatus } from '../../utils/storeUtils';

interface CustomerCheckoutProps {
  goBack: () => void;
  placeOrder: () => void;
}

export const CustomerCheckout: React.FC<CustomerCheckoutProps> = ({ goBack, placeOrder }) => {
  const { 
    cart, 
    setCart, 
    location, 
    stores, 
    showToast, 
    t, 
    isRTL, 
    products, 
    activeCoupon, 
    setActiveCoupon, 
    savedAddresses, 
    addAddress, 
    currentUser,
    deliveryFeeConfig
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'vodafone' | 'instapay'>('cash');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  // Address picking states
  const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string>(defaultAddr?.id || 'new');

  // Form states for new address
  const [newGov, setNewGov] = useState('الدقهلية');
  const [newCenter, setNewCenter] = useState('السنبلاوين');
  const [newVillage, setNewVillage] = useState('ميت غراب');
  const [newStreet, setNewStreet] = useState('');
  const [newBuilding, setNewBuilding] = useState('');
  const [newFloor, setNewFloor] = useState('');
  const [newApartment, setNewApartment] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [saveToBook, setSaveToBook] = useState(true);

  // Find store to check coverage
  const store = stores.find(s => s.id === cart.shopId);
  const storeStatusObj = store ? getStoreStatus(store, isRTL) : { status: 'open' };
  const isStoreClosed = storeStatusObj.status === 'closed';

  // Resolve current address object being used
  const activeAddress = selectedAddressId === 'new' 
    ? {
        governorate: newGov,
        center: newCenter,
        village: newVillage,
        street: newStreet,
        building: newBuilding,
        floor: newFloor,
        apartment: newApartment,
        landmark: newLandmark,
        notes: newNotes
      }
    : savedAddresses.find(a => a.id === selectedAddressId);

  // Coverage validation
  const isCovered = store && activeAddress 
    ? (store.coveredVillages ? store.coveredVillages.includes(activeAddress.village) : true)
    : false;

  const { fee: deliveryFee, eta: deliveryETA } = store && activeAddress && isCovered && deliveryFeeConfig
    ? deliveryFeeService.calculateFeeAndEta(
        store.village || store.coveredVillages?.[0] || '',
        activeAddress.village || '',
        store.fee,
        `${store.time} دقيقة`,
        deliveryFeeConfig
      )
    : {
        fee: store && activeAddress && isCovered
          ? (store.deliveryFees && store.deliveryFees[activeAddress.village] !== undefined 
              ? store.deliveryFees[activeAddress.village] 
              : store.fee)
          : (store ? store.fee : 0),
        eta: store && activeAddress && isCovered
          ? (store.etas && store.etas[activeAddress.village] !== undefined 
              ? store.etas[activeAddress.village] 
              : `${store.time} دقيقة`)
          : (store ? `${store.time} دقيقة` : '')
      };

  const subtotal = cart.items.reduce((sum, item) => {
    const prod = (products.find(p => p.id === item.id) || { ...item, price: item.price }) as Product;
    return sum + calculateDiscountedPrice(prod, item.quantity);
  }, 0);

  const discountAmount = activeCoupon ? couponService.calculateDiscount(activeCoupon, subtotal, deliveryFee, cart.items.map(i => ({ id: i.id, quantity: i.quantity, price: i.price }))) : 0;
  const pointsDiscount = (pointsToRedeem / 100) * 5;
  const total = Math.max(0, subtotal - discountAmount - pointsDiscount) + deliveryFee;

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptImage(reader.result as string);
        showToast(isRTL ? 'تم تحميل صورة الإيصال بنجاح' : 'Receipt proof uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmOrder = async () => {
    if (!isCovered) {
      showToast(isRTL ? 'عذراً، هذا المتجر لا يغطي منطقة التوصيل المحددة.' : 'Sorry, this store does not deliver to the selected region.');
      return;
    }
    if (paymentMethod !== 'cash' && !receiptImage) {
      showToast(isRTL ? 'الرجاء إرفاق صورة إيصال التحويل لإتمام الطلب الإلكتروني' : 'Please upload transfer receipt screenshot to place online order');
      return;
    }

    setLoading(true);
    try {
      const orderId = `ord_${Math.floor(100000 + Math.random() * 900000)}`;
      let paymentReceiptUrl = '';

      if (paymentMethod !== 'cash' && receiptFile) {
        paymentReceiptUrl = await mediaService.uploadImage(receiptFile, `receipts/${orderId}`);
      }

      if (selectedAddressId === 'new' && saveToBook) {
        addAddress({
          label: newNotes.trim() ? newNotes.slice(0, 10) : `${newVillage} - ${newStreet}`,
          governorate: newGov,
          center: newCenter,
          village: newVillage,
          street: newStreet,
          building: newBuilding,
          floor: newFloor,
          apartment: newApartment,
          landmark: newLandmark,
          notes: newNotes,
          isDefault: savedAddresses.length === 0,
          gpsCoords: null
        });
      }

      const addressDetails = activeAddress
        ? `${activeAddress.governorate}، ${activeAddress.center}، ${activeAddress.village}، ${activeAddress.street}، عمارة ${activeAddress.building}${activeAddress.floor ? `، دور ${activeAddress.floor}` : ''}${activeAddress.apartment ? `، شقة ${activeAddress.apartment}` : ''}`
        : 'العنوان المحدد';

      const newOrder: any = {
        id: orderId,
        shopId: cart.shopId || '',
        shopName: cart.shopName,
        scheduledOrder: isStoreClosed,
        scheduledFor: isStoreClosed ? 'next_open' : undefined,
        customerId: currentUser?.uid || 'guest',
        customerName: currentUser?.name || 'عميل تجريبي',
        items: cart.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imgUrl: item.imgUrl
        })),
        subtotal,
        deliveryFee,
        discount: discountAmount + pointsDiscount,
        pointsRedeemed: pointsToRedeem,
        pointsDiscount: pointsDiscount,
        total,
        paymentMethod,
        paymentReceipt: paymentReceiptUrl || undefined,
        location: {
          name: addressDetails,
          coords: location.coords,
          isVerified: true
        },
        status: paymentMethod === 'cash' ? 'new' : 'pendingVerification',
        createdAt: new Date().toISOString()
      };

      const batch = writeBatch(db);
      batch.set(doc(db, 'orders', orderId), newOrder);

      if (pointsToRedeem > 0 && currentUser) {
        batch.update(doc(db, 'users', currentUser.uid), {
          points: increment(-pointsToRedeem)
        });

        const pointsHistoryId = `${orderId}_${currentUser.uid}_redeem`;
        batch.set(doc(db, 'pointsHistory', pointsHistoryId), {
          id: pointsHistoryId,
          userId: currentUser.uid,
          orderId: orderId,
          points: pointsToRedeem,
          type: 'redeem',
          createdAt: new Date().toISOString()
        });
      }

      if (activeCoupon) {
        batch.update(doc(db, 'coupons', activeCoupon.id), {
          usedCount: increment(1)
        });
      }

      await batch.commit();

      setCart({ shopId: null, shopName: '', items: [] });
      setActiveCoupon(null);
      showToast(paymentMethod === 'cash' ? 'تم تأكيد طلبك بنجاح وجاري التحضير' : 'تم إرسال إيصال الدفع وجاري تأكيده');
      placeOrder();
    } catch (err) {
      console.error('Error placing order:', err);
      showToast(isRTL ? 'حدث خطأ أثناء إتمام الطلب' : 'Error occurred while finalizing order');
    } finally {
      setLoading(false);
    }
  };

  const getAddressTextStr = (addr: any) => {
    return `${addr.governorate}، ${addr.center}، ${addr.village}، ${addr.street}، عمارة ${addr.building}`;
  };

  return (
    <div className="bg-theme-bg h-full flex flex-col overflow-hidden animate-slide-in-right theme-transition pb-0">
      
      {/* Header */}
      <div className="bg-theme-card px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 shadow-sm border-b border-theme-border/60 flex items-center gap-3.5 z-20 theme-transition">
        <button 
          onClick={goBack} 
          className="p-2.5 text-theme-text bg-theme-bg hover:bg-theme-border/50 rounded-full transition flex items-center justify-center border border-theme-border/30"
        >
          <ChevronRight size={20} className={isRTL ? '' : 'rotate-180'} />
        </button>
        <h2 className="text-xl font-black text-theme-text">{isRTL ? 'إتمام الطلب' : 'Checkout'}</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-[180px] pb-[calc(env(safe-area-inset-bottom)+180px)]">
        {/* Scheduled Order Warning */}
        {isStoreClosed && (
          <div className="mx-5 mt-5 bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
            <Info size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-500 text-sm mb-1">{isRTL ? 'المتجر مغلق حالياً' : 'Store is Closed'}</h3>
              <p className="text-xs text-theme-muted">{isRTL ? 'سيتم حفظ طلبك وإرساله للمتجر فور افتتاحه ليتم تنفيذه.' : 'Your order will be saved and processed as soon as the store opens.'}</p>
            </div>
          </div>
        )}

        {/* Main Form Body */}
        <div className="p-5 space-y-5 bg-theme-bg/30 no-scrollbar">
        
        {/* Delivery Information Section */}
        <PremiumCard hoverable={false} className="space-y-4">
          <h3 className="font-black text-theme-text text-xs flex items-center gap-1.5 border-b border-theme-border pb-2.5 uppercase tracking-wide">
            <MapPin size={15} className="text-primary" />
            {isRTL ? 'معلومات التوصيل والشحن' : 'Delivery Information'}
          </h3>

          <div className="bg-theme-bg/50 p-3 rounded-xl border border-theme-border/50 space-y-2 mb-4">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-theme-muted">{isRTL ? 'الاسم:' : 'Name:'}</span>
              <span className="text-theme-text">{currentUser?.name || ''}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-theme-muted">{isRTL ? 'رقم الهاتف:' : 'Phone:'}</span>
              <span className="text-theme-text" dir="ltr">{currentUser?.phone || ''}</span>
            </div>
          </div>

          {savedAddresses.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-black text-theme-muted uppercase tracking-wider block">
                {isRTL ? 'اختر من العناوين المحفوظة:' : 'Select from saved addresses:'}
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {savedAddresses.map(addr => {
                  const covered = store?.coveredVillages?.includes(addr.village) ?? true;
                  const isSelected = selectedAddressId === addr.id;
                  
                  return (
                    <div 
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id || '')}
                      className={`p-3.5 rounded-2xl border text-right cursor-pointer transition-all duration-200 flex items-center justify-between ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-theme-border hover:border-primary/20 bg-theme-card'
                      }`}
                    >
                      <div className="flex-1 pl-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-xs text-theme-text">{addr.label || addr.village}</span>
                          {addr.isDefault && (
                            <PremiumBadge variant="primary" pill={true}>
                              {isRTL ? 'افتراضي' : 'Default'}
                            </PremiumBadge>
                          )}
                          {!covered && (
                            <PremiumBadge variant="danger" pill={true}>
                              {isRTL ? 'غير مغطى للتوصيل' : 'Not Covered'}
                            </PremiumBadge>
                          )}
                        </div>
                        <p className="text-[10px] text-theme-muted mt-1 leading-normal font-medium">{getAddressTextStr(addr)}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-primary bg-primary text-white' : 'border-theme-border'
                      }`}>
                        {isSelected && <Check size={8} strokeWidth={4} />}
                      </div>
                    </div>
                  );
                })}
                
                <div 
                  onClick={() => setSelectedAddressId('new')}
                  className={`p-3.5 rounded-2xl border border-dashed text-center cursor-pointer transition-all text-xs font-black flex items-center justify-center gap-1.5 ${
                    selectedAddressId === 'new' 
                      ? 'border-primary text-primary bg-primary/5' 
                      : 'border-theme-border text-theme-muted hover:text-theme-text bg-theme-card/30'
                  }`}
                >
                  <Plus size={14} />
                  <span>{isRTL ? 'إدخال عنوان شحن جديد' : 'Enter New Address'}</span>
                </div>
              </div>
            </div>
          )}

          {/* New Address Structured Form */}
          {selectedAddressId === 'new' && (
            <div className="space-y-4.5 pt-2 border-t border-theme-border/50 animate-fade-in">
              <span className="text-[10px] font-black text-theme-muted uppercase tracking-wider block">
                {isRTL ? 'تفاصيل العنوان المصري الجديد:' : 'New Egyptian Address Details:'}
              </span>
              
              <div className="grid grid-cols-2 gap-3">
                <PremiumInput 
                  label={isRTL ? 'المحافظة' : 'Governorate'}
                  type="text" 
                  value={newGov} 
                  onChange={e => setNewGov(e.target.value)} 
                />
                <PremiumInput 
                  label={isRTL ? 'المركز/المدينة' : 'Center/City'}
                  type="text" 
                  value={newCenter} 
                  onChange={e => setNewCenter(e.target.value)} 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-theme-muted uppercase tracking-wider">
                  {isRTL ? 'القرية/المنطقة (تخضع للتغطية)' : 'Village/Area (Coverage Zone)'}
                </label>
                <select 
                  value={newVillage} 
                  onChange={e => setNewVillage(e.target.value)}
                  className="w-full bg-theme-card border border-theme-border rounded-xl p-3 text-xs font-black text-theme-text outline-none focus:border-primary theme-transition"
                >
                  {store?.coveredVillages?.map(v => (
                    <option key={v} value={v}>{v}</option>
                  )) || (
                    <>
                      <option value="ميت غراب">ميت غراب</option>
                      <option value="السنبلاوين">السنبلاوين</option>
                      <option value="المنصورة">المنصورة</option>
                      <option value="تمي الأمديد">تمي الأمديد</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <PremiumInput 
                  label={isRTL ? 'الشارع' : 'Street'}
                  placeholder={isRTL ? 'اسم الشارع' : 'Street Name'}
                  type="text" 
                  value={newStreet} 
                  onChange={e => setNewStreet(e.target.value)} 
                />
                <PremiumInput 
                  label={isRTL ? 'رقم العمارة/المنزل' : 'Building/House'}
                  placeholder={isRTL ? 'مثال: منزل 14' : 'e.g. House 14'}
                  type="text" 
                  value={newBuilding} 
                  onChange={e => setNewBuilding(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <PremiumInput 
                  label={isRTL ? 'الدور' : 'Floor'}
                  placeholder="2"
                  type="text" 
                  value={newFloor} 
                  onChange={e => setNewFloor(e.target.value)} 
                />
                <PremiumInput 
                  label={isRTL ? 'الشقة' : 'Apartment'}
                  placeholder="4"
                  type="text" 
                  value={newApartment} 
                  onChange={e => setNewApartment(e.target.value)} 
                />
                <PremiumInput 
                  label={isRTL ? 'علامة مميزة' : 'Landmark'}
                  placeholder={isRTL ? 'بجوار المسجد' : 'Near Mosque'}
                  type="text" 
                  value={newLandmark} 
                  onChange={e => setNewLandmark(e.target.value)} 
                />
              </div>

              <PremiumInput 
                label={isRTL ? 'ملاحظات إضافية' : 'Additional Delivery Notes'}
                placeholder={isRTL ? 'ملاحظات إضافية للتوصيل' : 'Delivery details'}
                type="text" 
                value={newNotes} 
                onChange={e => setNewNotes(e.target.value)} 
              />

              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="saveToBook" 
                  checked={saveToBook}
                  onChange={e => setSaveToBook(e.target.checked)}
                  className="w-4.5 h-4.5 rounded text-primary focus:ring-primary border-theme-border bg-theme-bg"
                />
                <label htmlFor="saveToBook" className="text-[10px] font-black text-theme-text cursor-pointer select-none">
                  {isRTL ? 'حفظ العنوان في دفتر العناوين المحفوظة' : 'Save this address for later use'}
                </label>
              </div>
            </div>
          )}

          {/* Delivery Zone Classification Card */}
          <div className={`p-3.5 rounded-2xl flex gap-3 border items-center animate-fade-in ${
            isCovered 
              ? 'bg-green-500/10 border-green-500/20 text-green-600' 
              : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            <Info size={16} className="flex-shrink-0" />
            <div className="text-[10px] font-black leading-relaxed">
              {isCovered ? (
                <span>
                  {isRTL 
                    ? `منطقة التوصيل مغطاة! رسوم الشحن: ${deliveryFee} ج.م • وقت التوصيل المتوقع: ${deliveryETA}` 
                    : `Zone Covered! Shipping Fee: EGP ${deliveryFee} • Delivery ETA: ${deliveryETA}`}
                </span>
              ) : (
                <span>
                  {isRTL 
                    ? 'عذراً، هذا المتجر لا يغطي منطقة التوصيل المحددة حالياً.' 
                    : 'Sorry, this store does not cover the selected zone currently.'}
                </span>
              )}
            </div>
          </div>
        </PremiumCard>

        {/* Payment Method Cards */}
        <PremiumCard hoverable={false} className="space-y-4">
          <h3 className="font-black text-theme-text text-xs flex items-center gap-1.5 border-b border-theme-border pb-2.5 uppercase tracking-wide">
            <Wallet size={15} className="text-primary" />
            {t('paymentMethod')}
          </h3>
          
          <div className="space-y-2.5">
            {[
              { id: 'cash', title: t('cash'), desc: isRTL ? 'الدفع نقداً للمندوب عند استلام الطلب' : 'Pay in cash directly to delivery rider' },
              { id: 'vodafone', title: t('vodafone'), desc: isRTL ? 'تحويل للمحفظة الإلكترونية للمتجر مباشرة' : 'Direct transfer to store digital wallet' },
              { id: 'instapay', title: t('instapay'), desc: isRTL ? 'تحويل بنكي فوري عبر تطبيق إنستاباي' : 'Direct bank transfer via InstaPay App' }
            ].map(method => {
              const isSelected = paymentMethod === method.id;
              return (
                <div 
                  key={method.id} 
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start justify-between ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-theme-border hover:border-primary/20 bg-theme-card'
                  }`}
                >
                  <div className="pl-3">
                    <h4 className="font-black text-xs text-theme-text">{method.title}</h4>
                    <p className="text-[10px] text-theme-muted font-bold mt-1 leading-snug">{method.desc}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isSelected ? 'border-primary bg-primary text-white' : 'border-theme-border'
                  }`}>
                    {isSelected && <Check size={8} strokeWidth={4} />}
                  </div>
                </div>
              );
            })}
          </div>
        </PremiumCard>

        {/* Vodafone / Instapay Transfer Instructions Panel */}
        {paymentMethod !== 'cash' && store && (
          <div className="bg-theme-card p-4 rounded-[24px] border border-primary/20 shadow-sm space-y-4 animate-fade-in theme-transition">
            <div className="bg-primary/5 p-3.5 rounded-xl flex gap-3 border border-primary/10">
              <AlertCircle className="text-primary flex-shrink-0" size={16} />
              <div className="text-[11px] font-bold text-theme-muted leading-relaxed">
                {paymentMethod === 'vodafone' ? (
                  <>
                    <p className="font-black text-theme-text mb-0.5">{isRTL ? 'تعليمات تحويل فودافون كاش:' : 'Vodafone Cash Instructions:'}</p>
                    <p>{isRTL ? 'قم بتحويل مبلغ ' : 'Please transfer '}<span className="text-primary font-black">{total} ج.م</span> {isRTL ? 'إلى رقم المتجر:' : 'to store wallet number:'}</p>
                    <p className="text-sm font-black text-primary mt-1 tracking-wide">
                      {store.paymentInfo?.vodafone || '01011112222'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-black text-theme-text mb-0.5">{isRTL ? 'تعليمات تحويل إنستاباي:' : 'InstaPay Transfer Instructions:'}</p>
                    <p>{isRTL ? 'أرسل مبلغ ' : 'Please send '}<span className="text-primary font-black">{total} ج.م</span> {isRTL ? 'إلى عنوان الدفع (IPA):' : 'to payment address (IPA):'}</p>
                    <p className="text-sm font-black text-primary mt-1 tracking-wide">
                      {store.paymentInfo?.instapay || `${store.id}@instapay`}
                    </p>
                  </>
                )}
                <p className="text-[9.5px] text-primary mt-1.5 font-black">{isRTL ? 'يرجى إرفاق لقطة شاشة لإثبات التحويل بالأسفل لتأكيد الطلب.' : 'Upload screenshot proof below to verify transfer.'}</p>
              </div>
            </div>

            {/* Premium Screenshot Upload Box */}
            <div className="relative border-2 border-dashed border-theme-border hover:border-primary/45 transition rounded-xl h-36 flex flex-col items-center justify-center overflow-hidden bg-theme-bg cursor-pointer">
              {receiptImage ? (
                <>
                  <img src={receiptImage} className="w-full h-full object-cover animate-fade-in" alt="Receipt Proof" />
                  <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 hover:opacity-100 transition text-white text-[10px] font-black gap-1.5">
                    <Camera size={14} /> 
                    <span>{isRTL ? 'تغيير صورة الإيصال' : 'Change Receipt Proof'}</span>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <Upload size={24} className="text-theme-muted mx-auto mb-2" />
                  <p className="text-xs font-black text-theme-text">{isRTL ? 'إرفاق إيصال التحويل' : 'Upload Screenshot'}</p>
                  <p className="text-[9px] text-theme-muted mt-0.5 font-bold">PNG, JPG (max 5MB)</p>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleReceiptUpload} 
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                id="receiptUpload"
              />
            </div>
          </div>
        )}

        {/* Loyalty Points Redemption Card */}
        {currentUser && (currentUser.points || 0) >= 100 && (
          <PremiumCard hoverable={false} className="space-y-4">
            <h3 className="font-black text-theme-text text-xs flex items-center gap-1.5 border-b border-theme-border pb-2.5 uppercase tracking-wide">
              <Coins size={15} className="text-primary" />
              {isRTL ? 'استبدال نقاط الولاء والمكافآت' : 'Redeem Loyalty Points'}
            </h3>
            
            <div className="flex justify-between items-center text-xs flex-wrap gap-2">
              <div>
                <p className="font-black text-theme-text">{isRTL ? `رصيدك الحالي: ${currentUser.points || 0} نقطة` : `Your balance: ${currentUser.points || 0} pts`}</p>
                <p className="text-[9px] text-theme-muted font-bold mt-0.5">{isRTL ? 'كل 100 نقطة تعادل خصم 5 ج.م' : 'Every 100 pts equivalent to 5 EGP'}</p>
              </div>
              <span className="bg-primary/10 text-primary font-black text-[10px] px-2.5 py-1 rounded-xl border border-primary/15">
                {isRTL ? `${Math.floor((currentUser.points || 0) / 100) * 5} ج.م متاحة` : `${Math.floor((currentUser.points || 0) / 100) * 5} EGP available`}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-theme-border/50 pt-3">
              <span className="text-[10px] font-black text-theme-text">{isRTL ? 'النقاط التي سيتم استبدالها:' : 'Points to redeem:'}</span>
              <div className="flex items-center bg-theme-bg border border-theme-border rounded-xl overflow-hidden p-0.5 shadow-inner">
                <button 
                  type="button"
                  onClick={() => setPointsToRedeem(prev => Math.max(0, prev - 100))}
                  disabled={pointsToRedeem === 0}
                  className="p-2 bg-theme-card text-theme-text rounded-lg shadow-sm hover:bg-theme-bg transition disabled:opacity-40"
                >
                  <Minus size={12} strokeWidth={3} />
                </button>
                <span className="text-xs font-black text-theme-text px-4 font-sans">{pointsToRedeem}</span>
                <button 
                  type="button"
                  onClick={() => setPointsToRedeem(prev => {
                    const maxRedeem = Math.min(
                      Math.floor((currentUser.points || 0) / 100) * 100,
                      Math.floor((subtotal - discountAmount) / 5) * 100
                    );
                    return Math.min(maxRedeem, prev + 100);
                  })}
                  disabled={pointsToRedeem >= Math.floor((currentUser.points || 0) / 100) * 100 || pointsToRedeem >= Math.floor((subtotal - discountAmount) / 5) * 100}
                  className="p-2 bg-theme-card text-theme-text rounded-lg shadow-sm hover:bg-theme-bg transition disabled:opacity-40"
                >
                  <Plus size={12} strokeWidth={3} />
                </button>
              </div>
            </div>

            {pointsToRedeem > 0 && (
              <p className="text-[9.5px] font-black text-green-600 text-center bg-green-500/5 py-2 rounded-xl animate-pop-in">
                {isRTL 
                  ? `✓ سيتم تطبيق خصم بقيمة ${pointsDiscount} ج.م مقابل ${pointsToRedeem} نقطة` 
                  : `✓ ${pointsDiscount} EGP discount applied for ${pointsToRedeem} pts`}
              </p>
            )}
          </PremiumCard>
        )}
      </div>
        {/* Order Information Block */}
        <PremiumCard hoverable={false} className="space-y-3">
          <h3 className="font-black text-theme-text text-xs flex items-center gap-1.5 border-b border-theme-border pb-2.5 uppercase tracking-wide">
            <ClipboardList size={15} className="text-primary" />
            {isRTL ? 'معلومات الطلب' : 'Order Information'}
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-theme-muted">{isRTL ? 'اسم العميل:' : 'Customer Name:'}</span>
              <span className="font-black text-theme-text">{currentUser?.name || ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{isRTL ? 'رقم الهاتف:' : 'Phone Number:'}</span>
              <span className="font-black text-theme-text" dir="ltr">{currentUser?.phone || ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{isRTL ? 'عنوان التوصيل:' : 'Delivery Address:'}</span>
              <span className="font-black text-theme-text text-left" style={{maxWidth: '60%'}}>
                {activeAddress ? getAddressTextStr(activeAddress) : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{isRTL ? 'المنطقة:' : 'Area:'}</span>
              <span className="font-black text-theme-text">{activeAddress?.village || ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{isRTL ? 'وقت التوصيل:' : 'Delivery Time:'}</span>
              <span className="font-black text-theme-text">
                {isStoreClosed ? (isRTL ? 'عند افتتاح المتجر' : 'When store opens') : (isRTL ? 'في أسرع وقت' : 'ASAP')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{isRTL ? 'طريقة الدفع:' : 'Payment Method:'}</span>
              <span className="font-black text-theme-text">
                {paymentMethod === 'cash' ? (isRTL ? 'الدفع عند الاستلام' : 'Cash on Delivery') : paymentMethod === 'vodafone' ? (isRTL ? 'فودافون كاش' : 'Vodafone Cash') : (isRTL ? 'إنستاباي' : 'InstaPay')}
              </span>
            </div>
          </div>
        </PremiumCard>

      </div>

      {/* Checkout Totals & Place Order Panel */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[400px] mx-auto w-full bg-theme-card border-t border-theme-border p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] rounded-t-[32px] shadow-[0_-12px_28px_rgba(0,0,0,0.06)] z-30 theme-transition space-y-4">
        <h3 className="font-black text-sm text-theme-text">{isRTL ? 'ملخص الطلب' : 'Order Summary'}</h3>
        <div className="space-y-2.5 text-xs bg-theme-bg/50 p-3.5 rounded-2xl border border-theme-border/50">
          <div className="flex justify-between text-theme-muted font-semibold">
            <span>{isRTL ? 'عدد المنتجات' : 'Product Count'}</span>
            <span className="font-sans">{cart.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
          <div className="flex justify-between text-theme-muted font-semibold">
            <span>{isRTL ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
            <span className="font-sans font-bold text-theme-text">{subtotal} ج.م</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-500 font-bold animate-fade-in bg-green-500/10 p-2 rounded-lg mt-1">
              <span>{isRTL ? 'خصم الكوبون:' : 'Coupon Discount:'}</span>
              <span className="font-sans">-{discountAmount} ج.م</span>
            </div>
          )}
          {pointsDiscount > 0 && (
            <div className="flex justify-between text-green-500 font-bold animate-fade-in bg-green-500/10 p-2 rounded-lg mt-1">
              <span>{isRTL ? 'خصم نقاط الولاء:' : 'Loyalty Points Discount:'}</span>
              <span className="font-sans">-{pointsDiscount} ج.م</span>
            </div>
          )}
          <div className="flex justify-between text-theme-muted font-semibold">
            <span>{isRTL ? 'رسوم التوصيل:' : 'Delivery fee:'}</span>
            <span className="font-sans font-bold text-theme-text">{deliveryFee === 0 ? (isRTL ? 'مجاني' : 'Free') : `${deliveryFee} ج.م`}</span>
          </div>
          <div className="border-t border-theme-border/80 my-2 pt-3 flex justify-between items-center text-theme-text font-black">
            <span className="text-sm">{t('total')}</span>
            <span className="text-primary font-sans font-black text-lg">{total} ج.م</span>
          </div>
        </div>

        <PremiumButton 
          onClick={handleConfirmOrder}
          disabled={loading || !isCovered}
          isLoading={loading}
          variant="primary"
          size="lg"
          className="w-full shadow-lg shadow-primary/20 rounded-2xl font-black text-xs h-12"
        >
          {t('confirmOrder')}
        </PremiumButton>
      </div>

    </div>
  );
};

export default CustomerCheckout;
