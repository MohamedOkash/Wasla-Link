import { useTranslation } from '../../hooks/useTranslation';
import React, { useState } from 'react';
import { ChevronRight, MapPin, Wallet, Check, AlertCircle, Camera, Upload, Plus, Info, Coins, Minus, ClipboardList, ArrowRight, Store, ShoppingBag } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { calculateDiscountedPrice } from '../../utils/promo';
import { Product } from '../../types/product.types';
import { couponService } from '../../services/coupon.service';
import { mediaService } from '../../services/media.service';
import { deliveryFeeService, DEFAULT_PLATFORM_SETTINGS } from '../../services/deliveryFee.service';
import { doc, writeBatch, increment, setDoc, collection } from 'firebase/firestore';
import { db, auth, sanitizeFirestoreData } from '../../services/firebase';
import { initiatePayment, PaymentMethod } from '../../services/payment.service';

// Premium Rebuild Imports
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumInput } from '../../components/premium/PremiumInput';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { PremiumBadge } from '../../components/premium/PremiumBadge';
import { getStoreStatus } from '../../utils/storeUtils';
import { useStores } from '../../hooks/useStores';
import { useProducts } from '../../hooks/useProducts';

interface CustomerCheckoutProps {
  goBack: () => void;
  placeOrder: () => void;
}

export const CustomerCheckout: React.FC<CustomerCheckoutProps> = ({ goBack, placeOrder }) => {
  const { t } = useTranslation();
  const { cart, setCart, location, showToast,  isRTL, activeCoupon, setActiveCoupon, savedAddresses, addAddress, currentUser, platformSettings } = useApp();
  const { stores } = useStores();
  const { products } = useProducts();;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
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
  const currentSettings = platformSettings || DEFAULT_PLATFORM_SETTINGS;
  const { fee: deliveryFee, eta: deliveryETA } = store && activeAddress && isCovered
    ? deliveryFeeService.calculateFeeAndEta(
        store.village || store.coveredVillages?.[0] || '',
        activeAddress.village || '',
        store.fee,
        `${store.time} دقيقة`,
        currentSettings
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
        showToast(t('str_64'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmOrder = async () => {
    if (loading) return;

    if (!isCovered) {
      showToast(t('str_65'));
      return;
    }
    if (paymentMethod !== 'cash_on_delivery' && !receiptImage) {
      showToast(t('str_66'));
      return;
    }

    setLoading(true);
    try {
      const orderRef = doc(collection(db, 'orders'));
      const orderId = orderRef.id;
      let paymentReceiptUrl = '';

      if (paymentMethod !== 'cash_on_delivery' && receiptFile) {
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

      const customerId = auth.currentUser?.uid || currentUser?.uid;
      
      // Checkout Validation (Task 3)
      if (!customerId) {
        showToast(t('str_67'));
        setLoading(false);
        return;
      }
      
      if (!cart.shopId || cart.items.length === 0) {
        showToast(t('str_68'));
        setLoading(false);
        return;
      }

      if (!activeAddress && selectedAddressId !== 'new') {
        showToast(t('str_69'));
        setLoading(false);
        return;
      }

      const newOrder: any = {
        id: orderId,
        shopId: cart.shopId || '',
        shopName: cart.shopName,
        scheduledOrder: isStoreClosed,
        scheduledFor: isStoreClosed ? 'next_open' : undefined,
        customerId: auth.currentUser?.uid || currentUser?.uid || 'guest',
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
        paymentReceipt: paymentReceiptUrl ?? null,
        location: {
          name: addressDetails,
          coords: location.coords,
          isVerified: true
        },
        status: 'new', // Real status will be updated if it's pendingVerification
        createdAt: new Date().toISOString()
      };

      if (paymentMethod === 'instapay') {
        newOrder.status = 'pendingVerification';
      }

      const cleanedOrder = sanitizeFirestoreData(newOrder);

      console.log("ORDER_PAYLOAD", cleanedOrder);
      console.log("AUTH_UID", auth.currentUser?.uid);
      console.log("CUSTOMER_ID", cleanedOrder.customerId);

      try {
        await import('../../services/orders/service').then(module => {
          return module.orderService.placeOrder({
            orderData: cleanedOrder,
            pointsToRedeem: pointsToRedeem,
            currentUserUid: currentUser?.uid,
            activeCouponId: activeCoupon?.id
          });
        });

        // 6. Cleanup Cart
        setCart({ shopId: null, shopName: '', items: [] });
      } catch (err: any) {
        console.error("EXACT_FIRESTORE_ERROR", err.code, err.message, err);
        throw err; // throw to be caught by outer catch block
      }

      setCart({ shopId: null, shopName: '', items: [] });
      setActiveCoupon(null);
      showToast(paymentMethod === 'cash_on_delivery' ? 'تم تأكيد طلبك بنجاح وجاري التحضير' : 'تم استلام الطلب بنجاح');
      placeOrder();
    } catch (err: any) {
      console.error("ORDER_CREATE_ERROR", err);
      showToast(err instanceof Error ? err.message : JSON.stringify(err));
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
        <h2 className="text-xl font-black text-theme-text">{t('str_70')}</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-[180px] pb-[calc(env(safe-area-inset-bottom)+180px)]">
        {/* Scheduled Order Warning */}
        {isStoreClosed && (
          <div className="mx-5 mt-5 bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
            <Info size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-500 text-sm mb-1">{t('str_71')}</h3>
              <p className="text-xs text-theme-muted">{t('str_72')}</p>
            </div>
          </div>
        )}

        {/* Main Form Body */}
        <div className="p-5 space-y-5 bg-theme-bg/30 no-scrollbar">
        
        {/* Delivery Information Section */}
        <PremiumCard hoverable={false} className="space-y-4">
          <h3 className="font-black text-theme-text text-xs flex items-center gap-1.5 border-b border-theme-border pb-2.5 uppercase tracking-wide">
            <MapPin size={15} className="text-primary" />
            {t('str_73')}
          </h3>

          <div className="bg-theme-bg/50 p-3 rounded-xl border border-theme-border/50 space-y-2 mb-4">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-theme-muted">{t('str_74')}</span>
              <span className="text-theme-text">{currentUser?.name || ''}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-theme-muted">{t('str_75')}</span>
              <span className="text-theme-text" dir="ltr">{currentUser?.phone || ''}</span>
            </div>
          </div>

          {savedAddresses.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-black text-theme-muted uppercase tracking-wider block">
                {t('str_76')}
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
                              {t('str_77')}
                            </PremiumBadge>
                          )}
                          {!covered && (
                            <PremiumBadge variant="danger" pill={true}>
                              {t('str_78')}
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
                  <span>{t('str_79')}</span>
                </div>
              </div>
            </div>
          )}

          {/* New Address Structured Form */}
          {selectedAddressId === 'new' && (
            <div className="space-y-4.5 pt-2 border-t border-theme-border/50 animate-fade-in">
              <span className="text-[10px] font-black text-theme-muted uppercase tracking-wider block">
                {t('str_80')}
              </span>
              
              <div className="grid grid-cols-2 gap-3">
                <PremiumInput 
                  label={t('str_81')}
                  type="text" 
                  value={newGov} 
                  onChange={e => setNewGov(e.target.value)} 
                />
                <PremiumInput 
                  label={t('str_82')}
                  type="text" 
                  value={newCenter} 
                  onChange={e => setNewCenter(e.target.value)} 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-theme-muted uppercase tracking-wider">
                  {t('str_83')}
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
                      <option value={t('str_1')}>{t('str_1')}</option>
                      <option value={t('str_2')}>{t('str_2')}</option>
                      <option value={t('str_3')}>{t('str_3')}</option>
                      <option value={t('str_4')}>{t('str_4')}</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <PremiumInput 
                  label={t('str_84')}
                  placeholder={t('str_85')}
                  type="text" 
                  value={newStreet} 
                  onChange={e => setNewStreet(e.target.value)} 
                />
                <PremiumInput 
                  label={t('str_86')}
                  placeholder={t('str_87')}
                  type="text" 
                  value={newBuilding} 
                  onChange={e => setNewBuilding(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <PremiumInput 
                  label={t('str_88')}
                  placeholder="2"
                  type="text" 
                  value={newFloor} 
                  onChange={e => setNewFloor(e.target.value)} 
                />
                <PremiumInput 
                  label={t('str_89')}
                  placeholder="4"
                  type="text" 
                  value={newApartment} 
                  onChange={e => setNewApartment(e.target.value)} 
                />
                <PremiumInput 
                  label={t('str_90')}
                  placeholder={t('str_91')}
                  type="text" 
                  value={newLandmark} 
                  onChange={e => setNewLandmark(e.target.value)} 
                />
              </div>

              <PremiumInput 
                label={t('str_92')}
                placeholder={t('str_93')}
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
                  {t('str_94')}
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
                  {t('str_95', { deliveryFee, deliveryETA })}
                </span>
              ) : (
                <span>
                  {t('str_96')}
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
              { id: 'cash_on_delivery', title: t('cash') || 'الدفع عند الاستلام', desc: t('str_97') },
              { id: 'vodafone_cash', title: t('str_124') || 'فودافون كاش', desc: t('str_98') },
              { id: 'instapay', title: t('str_125') || 'إنستاباي', desc: t('str_99') }
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

        {/* Instapay Transfer Instructions Panel */}
        {paymentMethod === 'instapay' && store && (
          <div className="bg-theme-card p-4 rounded-[24px] border border-primary/20 shadow-sm space-y-4 animate-fade-in theme-transition">
            <div className="bg-primary/5 p-3.5 rounded-xl flex gap-3 border border-primary/10">
              <AlertCircle className="text-primary flex-shrink-0" size={16} />
              <div className="text-[11px] font-bold text-theme-muted leading-relaxed">
                  <>
                    <p className="font-black text-theme-text mb-0.5">{t('str_103')}</p>
                    <p>{t('str_104')}<span className="text-primary font-black">{total} ج.م</span> {t('str_105')}</p>
                    <p className="text-sm font-black text-primary mt-1 tracking-wide">
                      {store.paymentInfo?.instapay || `${store.id}@instapay`}
                    </p>
                  </>
                <p className="text-[9.5px] text-primary mt-1.5 font-black">{t('str_106')}</p>
              </div>
            </div>

            {/* Premium Screenshot Upload Box */}
            <div className="relative border-2 border-dashed border-theme-border hover:border-primary/45 transition rounded-xl h-36 flex flex-col items-center justify-center overflow-hidden bg-theme-bg cursor-pointer">
              {receiptImage ? (
                <>
                  <img src={receiptImage} className="w-full h-full object-cover animate-fade-in" alt="Receipt Proof" />
                  <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 hover:opacity-100 transition text-white text-[10px] font-black gap-1.5">
                    <Camera size={14} /> 
                    <span>{t('str_107')}</span>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <Upload size={24} className="text-theme-muted mx-auto mb-2" />
                  <p className="text-xs font-black text-theme-text">{t('str_108')}</p>
                  <p className="text-[9px] text-theme-muted mt-0.5 font-bold">{t('str_1250')}</p>
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
              {t('str_109')}
            </h3>
            
            <div className="flex justify-between items-center text-xs flex-wrap gap-2">
              <div>
                <p className="font-black text-theme-text">{t('str_110', { points: currentUser?.points || 0 })}</p>
                <p className="text-[9px] text-theme-muted font-bold mt-0.5">{t('str_111')}</p>
              </div>
              <span className="bg-primary/10 text-primary font-black text-[10px] px-2.5 py-1 rounded-xl border border-primary/15">
                {t('str_112', { available: Math.floor((currentUser?.points || 0) / 100) * 5 })}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-theme-border/50 pt-3">
              <span className="text-[10px] font-black text-theme-text">{t('str_113')}</span>
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
                {t('str_114', { pointsDiscount: (pointsToRedeem / 100) * 5, pointsToRedeem })}
              </p>
            )}
          </PremiumCard>
        )}
      </div>
        {/* Order Information Block */}
        <PremiumCard hoverable={false} className="space-y-3">
          <h3 className="font-black text-theme-text text-xs flex items-center gap-1.5 border-b border-theme-border pb-2.5 uppercase tracking-wide">
            <ClipboardList size={15} className="text-primary" />
            {t('str_115')}
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-theme-muted">{t('str_116')}</span>
              <span className="font-black text-theme-text">{currentUser?.name || ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{t('str_75')}</span>
              <span className="font-black text-theme-text" dir="ltr">{currentUser?.phone || ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{t('str_117')}</span>
              <span className="font-black text-theme-text text-left" style={{maxWidth: '60%'}}>
                {activeAddress ? getAddressTextStr(activeAddress) : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{t('str_118')}</span>
              <span className="font-black text-theme-text">{activeAddress?.village || ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{t('str_119')}</span>
              <span className="font-black text-theme-text">
                {isStoreClosed ? (t('str_120')) : (t('str_121'))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{t('str_122')}</span>
              <span className="font-black text-theme-text">
                {paymentMethod === 'cash_on_delivery' ? (t('str_123')) : paymentMethod === 'vodafone_cash' ? (t('str_124')) : (t('str_125'))}
              </span>
            </div>
          </div>
        </PremiumCard>

      </div>

      {/* Checkout Totals & Place Order Panel */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[400px] mx-auto w-full bg-theme-card border-t border-theme-border p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] rounded-t-[32px] shadow-[0_-12px_28px_rgba(0,0,0,0.06)] z-30 theme-transition space-y-4">
        <h3 className="font-black text-sm text-theme-text">{t('str_59')}</h3>
        <div className="space-y-2.5 text-xs bg-theme-bg/50 p-3.5 rounded-2xl border border-theme-border/50">
          


          <div className="flex justify-between text-theme-muted font-semibold">
            <span>{t('str_60')}</span>
            <span className="font-sans">{cart.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
          <div className="flex justify-between text-theme-muted font-semibold">
            <span>{t('str_128')}</span>
            <span className="font-sans font-bold text-theme-text">{subtotal} ج.م</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-500 font-bold animate-fade-in bg-green-500/10 p-2 rounded-lg mt-1">
              <span>{t('str_61')}</span>
              <span className="font-sans">-{discountAmount} ج.م</span>
            </div>
          )}
          {pointsDiscount > 0 && (
            <div className="flex justify-between text-green-500 font-bold animate-fade-in bg-green-500/10 p-2 rounded-lg mt-1">
              <span>{t('str_129')}</span>
              <span className="font-sans">-{pointsDiscount} ج.م</span>
            </div>
          )}
          <div className="flex justify-between text-theme-muted font-semibold">
            <span>{t('str_130')}</span>
            <span className="font-sans font-bold text-theme-text">{deliveryFee === 0 ? (t('str_131')) : `${deliveryFee} ج.م`}</span>
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
