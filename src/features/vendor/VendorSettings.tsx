import React, { useState } from 'react';
import { Settings, Save, Wallet, Bike, Clock, ToggleLeft, ToggleRight, AlertTriangle, Upload, Globe, Facebook, Instagram, PhoneCall, Link } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { mediaService } from '../../services/media.service';

export const VendorSettings: React.FC = () => {
  const { stores, setStores, showToast, isRTL } = useApp();

  // Find store g_1 (أسواق الخير)
  const store = stores.find(s => s.id === 'g_1');

  const [isOpen, setIsOpen] = useState(store && store.isOpen !== undefined ? store.isOpen : true);
  const [isTemporarilyClosed, setIsTemporarilyClosed] = useState(store ? !!store.isTemporarilyClosed : false);
  const [vodafone, setVodafone] = useState(store?.paymentInfo?.vodafone || '');
  const [instapay, setInstapay] = useState(store?.paymentInfo?.instapay || '');
  
  const [logo, setLogo] = useState(store?.logoUrl || '');
  const [cover, setCover] = useState(store?.coverUrl || '');
  const [banner, setBanner] = useState(store?.promoBanner || '');
  const [facebook, setFacebook] = useState(store?.facebook || '');
  const [instagram, setInstagram] = useState(store?.instagram || '');
  const [whatsapp, setWhatsapp] = useState(store?.whatsapp || '');
  const [tiktok, setTiktok] = useState(store?.tiktok || '');
  const [website, setWebsite] = useState(store?.website || '');
  
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [minOrder, setMinOrder] = useState(store ? store.minOrder.toString() : '50');
  const [deliveryFee, setDeliveryFee] = useState(store ? store.fee.toString() : '0');
  const [deliveryTime, setDeliveryTime] = useState(store ? store.time.toString() : '15');

  const [openingHours, setOpeningHours] = useState(store?.openingHours || '08:00');
  const [closingHours, setClosingHours] = useState(store?.closingHours || '23:00');

  const [holidayMode, setHolidayMode] = useState(store ? !!store.holidayMode : false);
  const [fridayOpen, setFridayOpen] = useState(store?.fridaySchedule ? store.fridaySchedule.isOpen : true);
  const [fridayOpenTime, setFridayOpenTime] = useState(store?.fridaySchedule ? store.fridaySchedule.openTime : '13:00');
  const [fridayCloseTime, setFridayCloseTime] = useState(store?.fridaySchedule ? store.fridaySchedule.closeTime : '23:00');

  const [breaks, setBreaks] = useState<Array<{ start: string; end: string }>>(() => {
    return store?.breakTimes || [{ start: '14:00', end: '16:00' }];
  });

  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneFee, setNewZoneFee] = useState('15');
  const [newZoneEta, setNewZoneEta] = useState('20-30 دقيقة');

  // Zones state
  const [zones, setZones] = useState<any[]>(() => {
    return store?.deliveryZones || [
      { id: 'z1', name: 'ميت غراب', fee: 5, eta: '10-15 دقيقة' },
      { id: 'z2', name: 'السنبلاوين', fee: 15, eta: '20-30 دقيقة' },
      { id: 'z3', name: 'المنصورة', fee: 30, eta: '45-60 دقيقة' },
      { id: 'z4', name: 'تمي الأمديد', fee: 20, eta: '30-40 دقيقة' }
    ];
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadingLogo(true);
      try {
        const compressed = await mediaService.uploadImage(e.target.files[0], 'storeLogos');
        setLogo(compressed);
        showToast('تم تحميل شعار المتجر بنجاح');
      } catch (err: any) {
        alert(err.message);
      } finally {
        setUploadingLogo(false);
      }
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadingCover(true);
      try {
        const compressed = await mediaService.uploadImage(e.target.files[0], 'storeCovers');
        setCover(compressed);
        showToast('تم تحميل غلاف المتجر بنجاح');
      } catch (err: any) {
        alert(err.message);
      } finally {
        setUploadingCover(false);
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadingBanner(true);
      try {
        const compressed = await mediaService.uploadImage(e.target.files[0], 'storeLogos');
        setBanner(compressed);
        showToast('تم تحميل بانر المتجر بنجاح');
      } catch (err: any) {
        alert(err.message);
      } finally {
        setUploadingBanner(false);
      }
    }
  };

  const handleZoneChange = (id: string, field: 'fee' | 'eta', value: any) => {
    setZones(prev => prev.map(z => {
      if (z.id === id) {
        return {
          ...z,
          [field]: field === 'fee' ? (parseInt(value) || 0) : value
        };
      }
      return z;
    }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    
    setStores(prev => prev.map(s => {
      if (s.id === 'g_1') {
        return {
          ...s,
          isOpen,
          isTemporarilyClosed,
          minOrder: parseInt(minOrder) || 0,
          fee: parseInt(deliveryFee) || 0,
          time: parseInt(deliveryTime) || 15,
          openingHours,
          closingHours,
          deliveryZones: zones,
          coveredVillages: zones.map(z => z.name),
          deliveryFees: zones.reduce((acc, z) => ({ ...acc, [z.name]: z.fee }), {}),
          etas: zones.reduce((acc, z) => ({ ...acc, [z.name]: z.eta }), {}),
          holidayMode,
          fridaySchedule: {
            isOpen: fridayOpen,
            openTime: fridayOpenTime,
            closeTime: fridayCloseTime
          },
          breakTimes: breaks,
          logoUrl: logo,
          coverUrl: cover,
          promoBanner: banner,
          facebook,
          instagram,
          whatsapp,
          tiktok,
          website,
          paymentInfo: {
            vodafone: vodafone || undefined,
            instapay: instapay || undefined
          }
        };
      }
      return s;
    }));

    showToast('تم حفظ إعدادات المتجر بنجاح');
  };

  return (
    <form onSubmit={handleSaveSettings} className="space-y-5 animate-fade-in text-theme-text pb-24">
      {/* Store Identity (Logo & Cover) */}
      <div className="bg-theme-card rounded-[30px] border border-theme-border p-5 shadow-sm space-y-4 theme-transition">
        <h4 className="font-black text-sm text-theme-text flex items-center gap-2 border-b border-theme-border pb-2">
          <Settings size={16} className="text-primary" /> هوية المتجر البصرية
        </h4>
        <div className="space-y-4">
          {/* Cover image upload */}
          <div>
            <label className="text-[10px] font-black text-theme-muted block mb-1.5">غلاف المتجر (Cover Image)</label>
            <div className="relative border-2 border-dashed border-theme-border hover:border-primary/40 transition rounded-2xl h-36 flex flex-col items-center justify-center overflow-hidden bg-theme-bg cursor-pointer">
              {cover ? (
                <>
                  <img src={cover} className="w-full h-full object-cover" alt="Cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition text-white text-[10px] font-black gap-1.5">
                    <Upload size={14} /> تغيير صورة الغلاف
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <Upload size={24} className="text-theme-muted mx-auto mb-1.5" />
                  <p className="text-xs font-black text-theme-text">تحميل صورة الغلاف</p>
                  <p className="text-[9px] text-theme-muted mt-0.5">PNG, JPG, WEBP (max 5MB)</p>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleCoverUpload} 
                className="absolute inset-0 opacity-0 cursor-pointer" 
              />
            </div>
            {uploadingCover && <p className="text-[9px] text-primary font-bold mt-1 animate-pulse">جاري رفع وتجهيز الغلاف...</p>}
          </div>

          {/* Logo upload */}
          <div className="flex gap-4 items-center">
            <div className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-theme-border hover:border-primary/40 transition flex flex-col items-center justify-center overflow-hidden bg-theme-bg cursor-pointer shrink-0">
              {logo ? (
                <>
                  <img src={logo} className="w-full h-full object-cover" alt="Logo" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition text-white text-[8px] font-black">
                    تغيير
                  </div>
                </>
              ) : (
                <div className="text-center p-2">
                  <Upload size={16} className="text-theme-muted mx-auto mb-1" />
                  <span className="text-[9px] font-black text-theme-text">الشعار</span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleLogoUpload} 
                className="absolute inset-0 opacity-0 cursor-pointer" 
              />
            </div>
            <div className="flex-1">
              <h5 className="text-xs font-black text-theme-text">شعار المتجر (Logo)</h5>
              <p className="text-[9px] text-theme-muted font-bold mt-0.5">يظهر للعملاء في نتائج البحث وصفحة المتجر الرئيسية. يفضل أن تكون الأبعاد مربعة.</p>
              {uploadingLogo && <p className="text-[9px] text-primary font-bold mt-1 animate-pulse">جاري رفع وتجهيز الشعار...</p>}
            </div>
          </div>

          {/* Banner upload */}
          <div>
            <label className="text-[10px] font-black text-theme-muted block mb-1.5">{isRTL ? 'بانر المتجر الترويجي (Promo Banner)' : 'Store Promo Banner'}</label>
            <div className="relative border-2 border-dashed border-theme-border hover:border-primary/40 transition rounded-2xl h-24 flex flex-col items-center justify-center overflow-hidden bg-theme-bg cursor-pointer">
              {banner ? (
                <>
                  <img src={banner} className="w-full h-full object-cover" alt="Banner" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition text-white text-[10px] font-black gap-1.5">
                    <Upload size={14} /> {isRTL ? 'تغيير صورة البانر' : 'Change Banner Image'}
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <Upload size={20} className="text-theme-muted mx-auto mb-1" />
                  <p className="text-xs font-black text-theme-text">{isRTL ? 'تحميل بانر ترويجي عريض للمتجر' : 'Upload Store Promo Banner'}</p>
                  <p className="text-[9px] text-theme-muted mt-0.5">PNG, JPG, WEBP (max 5MB)</p>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleBannerUpload} 
                className="absolute inset-0 opacity-0 cursor-pointer" 
              />
            </div>
            {uploadingBanner && <p className="text-[9px] text-primary font-bold mt-1 animate-pulse">{isRTL ? 'جاري رفع وتجهيز البانر...' : 'Uploading banner...'}</p>}
          </div>
        </div>
      </div>

      {/* Social Media Links */}
      <div className="bg-theme-card rounded-[30px] border border-theme-border p-5 shadow-sm space-y-4 theme-transition">
        <h4 className="font-black text-sm text-theme-text flex items-center gap-2 border-b border-theme-border pb-2">
          <Globe size={16} className="text-primary" /> روابط التواصل الاجتماعي للمتجر
        </h4>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-black text-theme-muted block mb-1">صفحة فيسبوك (Facebook)</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-theme-muted pointer-events-none">
                <Facebook size={14} />
              </span>
              <input 
                type="text" 
                value={facebook}
                onChange={e => setFacebook(e.target.value)}
                className="w-full bg-theme-bg border border-theme-border rounded-xl py-3 pr-10 pl-3.5 text-xs font-bold outline-none focus:border-primary text-theme-text animate-pop-in" 
                placeholder="https://facebook.com/yourpage"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-theme-muted block mb-1">حساب إنستغرام (Instagram)</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-theme-muted pointer-events-none">
                <Instagram size={14} />
              </span>
              <input 
                type="text" 
                value={instagram}
                onChange={e => setInstagram(e.target.value)}
                className="w-full bg-theme-bg border border-theme-border rounded-xl py-3 pr-10 pl-3.5 text-xs font-bold outline-none focus:border-primary text-theme-text animate-pop-in" 
                placeholder="https://instagram.com/youraccount"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-theme-muted block mb-1">رقم واتساب للمتجر (WhatsApp)</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-theme-muted pointer-events-none">
                <PhoneCall size={14} />
              </span>
              <input 
                type="text" 
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                className="w-full bg-theme-bg border border-theme-border rounded-xl py-3 pr-10 pl-3.5 text-xs font-bold outline-none focus:border-primary text-theme-text animate-pop-in" 
                placeholder="مثال: 201011112222"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-theme-muted block mb-1">حساب تيك توك (TikTok)</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-theme-muted pointer-events-none">
                <Globe size={14} />
              </span>
              <input 
                type="text" 
                value={tiktok}
                onChange={e => setTiktok(e.target.value)}
                className="w-full bg-theme-bg border border-theme-border rounded-xl py-3 pr-10 pl-3.5 text-xs font-bold outline-none focus:border-primary text-theme-text animate-pop-in" 
                placeholder="https://tiktok.com/@youraccount"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-theme-muted block mb-1">الموقع الإلكتروني (Website)</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-theme-muted pointer-events-none">
                <Link size={14} />
              </span>
              <input 
                type="text" 
                value={website}
                onChange={e => setWebsite(e.target.value)}
                className="w-full bg-theme-bg border border-theme-border rounded-xl py-3 pr-10 pl-3.5 text-xs font-bold outline-none focus:border-primary text-theme-text animate-pop-in" 
                placeholder="https://yourstore.com"
              />
            </div>
          </div>
        </div>
      </div>

      
      {/* Store Availability Card */}
      <div className="bg-theme-card rounded-[30px] border border-theme-border p-5 shadow-sm space-y-4 theme-transition">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-black text-sm text-theme-text">حالة استقبال الطلبات</h4>
            <p className="text-[10px] text-theme-muted font-bold mt-1">
              {isOpen ? 'متجرك مفتوح الآن ويستقبل طلبات العملاء' : 'متجرك مغلق حالياً ولن يتمكن العملاء من الطلب'}
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`p-1 transition-colors rounded-xl ${isOpen ? 'text-green-500' : 'text-theme-muted'}`}
          >
            {isOpen ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-theme-border/60 pt-3">
          <div>
            <h4 className="font-black text-sm text-theme-text flex items-center gap-1">
              <AlertTriangle size={15} className="text-red-500" />
              إغلاق مؤقت للمتجر
            </h4>
            <p className="text-[10px] text-theme-muted font-bold mt-1">
              تعطيل البيع لظروف طارئة (سيظهر للعملاء مغلق مؤقتاً)
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setIsTemporarilyClosed(!isTemporarilyClosed)}
            className={`p-1 transition-colors rounded-xl ${isTemporarilyClosed ? 'text-red-500' : 'text-theme-muted'}`}
          >
            {isTemporarilyClosed ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
          </button>
        </div>
      </div>

      {/* Business Hours */}
      <div className="bg-theme-card rounded-[30px] border border-theme-border p-5 shadow-sm space-y-4 theme-transition">
        <h4 className="font-black text-sm text-theme-text flex items-center gap-2 border-b border-theme-border pb-2">
          <Clock size={16} className="text-primary" /> مواعيد ساعات العمل اليومية
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-theme-muted block mb-1">وقت فتح المحل</label>
            <input 
              type="text"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border rounded-xl p-3.5 text-xs outline-none focus:border-primary font-bold text-theme-text"
              placeholder="مثال: 08:00"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-theme-muted block mb-1">وقت إغلاق المحل</label>
            <input 
              type="text"
              value={closingHours}
              onChange={(e) => setClosingHours(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border rounded-xl p-3.5 text-xs outline-none focus:border-primary font-bold text-theme-text"
              placeholder="مثال: 23:00"
            />
          </div>
        </div>

        {/* Holiday Mode Toggle */}
        <div className="flex items-center justify-between border-t border-theme-border/60 pt-3 mt-3">
          <div>
            <h5 className="font-black text-xs text-theme-text">وضع العطلة الرسمية (Holiday Mode)</h5>
            <p className="text-[9px] text-theme-muted font-bold mt-0.5">
              تفعيل وضع الإجازة يغلق المتجر طوال اليوم
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setHolidayMode(!holidayMode)}
            className={`p-1 transition-colors rounded-xl ${holidayMode ? 'text-primary' : 'text-theme-muted'}`}
          >
            {holidayMode ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
          </button>
        </div>

        {/* Friday Hours Schedule */}
        <div className="border-t border-theme-border/60 pt-3 mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-black text-xs text-theme-text">العمل يوم الجمعة</h5>
              <p className="text-[9px] text-theme-muted font-bold mt-0.5">تحديد مواعيد العمل الخاصة بيوم الجمعة</p>
            </div>
            <button 
              type="button"
              onClick={() => setFridayOpen(!fridayOpen)}
              className={`p-1 transition-colors rounded-xl ${fridayOpen ? 'text-primary' : 'text-theme-muted'}`}
            >
              {fridayOpen ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
            </button>
          </div>
          {fridayOpen && (
            <div className="grid grid-cols-2 gap-4 animate-fade-in">
              <div>
                <label className="text-[9px] font-black text-theme-muted block mb-1">وقت فتح يوم الجمعة</label>
                <input 
                  type="text"
                  value={fridayOpenTime}
                  onChange={(e) => setFridayOpenTime(e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs outline-none focus:border-primary font-bold text-theme-text"
                  placeholder="مثال: 13:00"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-theme-muted block mb-1">وقت إغلاق يوم الجمعة</label>
                <input 
                  type="text"
                  value={fridayCloseTime}
                  onChange={(e) => setFridayCloseTime(e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs outline-none focus:border-primary font-bold text-theme-text"
                  placeholder="مثال: 23:00"
                />
              </div>
            </div>
          )}
        </div>

        {/* Break Intervals list */}
        <div className="border-t border-theme-border/60 pt-3 mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-black text-xs text-theme-text">فترات الراحة (Breaks)</h5>
            <button
              type="button"
              onClick={() => setBreaks(prev => [...prev, { start: '14:00', end: '16:00' }])}
              className="text-[10px] font-black text-primary hover:underline"
            >
              + إضافة فترة راحة
            </button>
          </div>
          <div className="space-y-2">
            {breaks.map((brk, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input 
                  type="text"
                  value={brk.start}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBreaks(prev => prev.map((b, i) => i === idx ? { ...b, start: val } : b));
                  }}
                  className="w-1/3 bg-theme-bg border border-theme-border rounded-xl p-2 text-xs outline-none font-bold text-theme-text text-center animate-pop-in"
                  placeholder="من: 14:00"
                />
                <span className="text-theme-muted text-xs">إلى</span>
                <input 
                  type="text"
                  value={brk.end}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBreaks(prev => prev.map((b, i) => i === idx ? { ...b, end: val } : b));
                  }}
                  className="w-1/3 bg-theme-bg border border-theme-border rounded-xl p-2 text-xs outline-none font-bold text-theme-text text-center animate-pop-in"
                  placeholder="إلى: 16:00"
                />
                <button
                  type="button"
                  onClick={() => setBreaks(prev => prev.filter((_, i) => i !== idx))}
                  className="text-red-500 hover:text-red-600 font-bold text-xs px-2"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delivery Zones */}
      <div className="bg-theme-card rounded-[30px] border border-theme-border p-5 shadow-sm space-y-4 theme-transition">
        <h4 className="font-black text-sm text-theme-text flex items-center gap-2 border-b border-theme-border pb-2">
          <Bike size={16} className="text-primary" /> تحديد تسعيرة وأوقات توصيل المناطق
        </h4>

        {/* Add Zone inline Form */}
        <div className="bg-theme-bg p-3.5 rounded-2xl border border-theme-border space-y-2.5">
          <h5 className="font-black text-xs text-theme-text">تغطية قرية جديدة:</h5>
          <div className="grid grid-cols-3 gap-2">
            <input 
              type="text" 
              placeholder="اسم القرية"
              value={newZoneName}
              onChange={e => setNewZoneName(e.target.value)}
              className="bg-theme-card border border-theme-border rounded-lg p-2 text-xs outline-none text-theme-text font-bold"
            />
            <input 
              type="number" 
              placeholder="الرسوم"
              value={newZoneFee}
              onChange={e => setNewZoneFee(e.target.value)}
              className="bg-theme-card border border-theme-border rounded-lg p-2 text-xs outline-none text-theme-text font-bold"
            />
            <input 
              type="text" 
              placeholder="وقت التوصيل"
              value={newZoneEta}
              onChange={e => setNewZoneEta(e.target.value)}
              className="bg-theme-card border border-theme-border rounded-lg p-2 text-xs outline-none text-theme-text font-bold"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (!newZoneName.trim()) {
                alert('الرجاء إدخال اسم القرية أولاً');
                return;
              }
              const newZone = {
                id: `z_${Date.now()}`,
                name: newZoneName.trim(),
                fee: parseInt(newZoneFee) || 0,
                eta: newZoneEta.trim() || '20-30 دقيقة'
              };
              setZones(prev => [...prev, newZone]);
              setNewZoneName('');
              setNewZoneFee('15');
              setNewZoneEta('20-30 دقيقة');
            }}
            className="w-full bg-primary hover:bg-primary-hover text-white text-[10px] font-black py-2 rounded-xl transition"
          >
            + إضافة هذه المنطقة لقائمة التغطية
          </button>
        </div>

        <div className="space-y-3 pt-2">
          {zones.map((zone) => (
            <div key={zone.id} className="grid grid-cols-4 gap-2 items-center border-b border-theme-border/60 pb-3 last:border-0 last:pb-0">
              <span className="text-xs font-black text-theme-text col-span-1 truncate">{zone.name}</span>
              <div>
                <label className="text-[8px] text-theme-muted block mb-0.5">الرسوم (ج.م)</label>
                <input 
                  type="number"
                  value={zone.fee}
                  onChange={(e) => handleZoneChange(zone.id, 'fee', e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border rounded-lg p-1.5 text-xs outline-none focus:border-primary font-bold text-theme-text"
                />
              </div>
              <div className="col-span-1">
                <label className="text-[8px] text-theme-muted block mb-0.5">مدة التوصيل</label>
                <input 
                  type="text"
                  value={zone.eta}
                  onChange={(e) => handleZoneChange(zone.id, 'eta', e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border rounded-lg p-1.5 text-[10px] outline-none focus:border-primary font-bold text-theme-text"
                />
              </div>
              <div className="text-left mt-3">
                <button
                  type="button"
                  onClick={() => setZones(prev => prev.filter(z => z.id !== zone.id))}
                  className="text-red-500 hover:text-red-600 font-bold text-xs"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment details */}
      <div className="bg-theme-card rounded-[30px] border border-theme-border p-5 shadow-sm space-y-4 theme-transition">
        <h4 className="font-black text-sm text-theme-text flex items-center gap-2 border-b border-theme-border pb-2">
          <Wallet size={16} className="text-primary" /> المحافظ والتحصيل الإلكتروني
        </h4>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-black text-theme-muted block mb-1">رقم فودافون كاش للمتجر</label>
            <input 
              type="text"
              value={vodafone}
              onChange={(e) => setVodafone(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs outline-none focus:border-primary font-bold text-theme-text"
              placeholder="مثال: 01011112222"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-theme-muted block mb-1">عنوان الدفع إنستاباي (InstaPay IPA)</label>
            <input 
              type="text"
              value={instapay}
              onChange={(e) => setInstapay(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs outline-none focus:border-primary font-bold font-mono text-theme-text"
              placeholder="مثال: store@instapay"
            />
          </div>
        </div>
      </div>

      {/* Delivery parameters */}
      <div className="bg-theme-card rounded-[30px] border border-theme-border p-5 shadow-sm space-y-4 theme-transition">
        <h4 className="font-black text-sm text-theme-text flex items-center gap-2 border-b border-theme-border pb-2">
          <Bike size={16} className="text-primary" /> معايير الطلب الافتراضية
        </h4>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-black text-theme-muted block mb-1">حد أدنى (ج.م)</label>
            <input 
              type="number"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs outline-none focus:border-primary font-bold text-theme-text"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-theme-muted block mb-1">الرسوم العامة</label>
            <input 
              type="number"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs outline-none focus:border-primary font-bold text-theme-text"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-theme-muted block mb-1">الوقت الافتراضي (د)</label>
            <input 
              type="number"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs outline-none focus:border-primary font-bold text-theme-text"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button 
        type="submit"
        className="w-full bg-primary hover:bg-primary-hover text-white font-black py-4 rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
      >
        <Save size={16} /> حفظ التعديلات وإعدادات المتجر
      </button>
    </form>
  );
};
export default VendorSettings;
