import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Crosshair, Map as MapIcon, ChevronRight, Check, Trash2, Plus, ShieldAlert } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface LocationPickerProps {
  closeMap: () => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ closeMap }) => {
  const { 
    setLocation, 
    savedAddresses, 
    addAddress, 
    deleteAddress, 
    setDefaultAddress, 
    showToast, 
    t, 
    isRTL 
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressInput, setAddressInput] = useState('شارع التحرير، وسط البلد، القاهرة');
  const [newLabel, setNewLabel] = useState('');
  const [activeTab, setActiveTab] = useState<'picker' | 'saved'>('picker');
  
  const watchIdRef = useRef<number | null>(null);

  // Helper to format Egypt addresses beautifully
  const formatEgyptAddress = (addr: any, fallback: string): string => {
    if (!addr) return fallback;
    const village = addr.village || addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || addr.subdivision || '';
    const center = addr.city || addr.town || addr.county || addr.municipality || '';
    const governorate = addr.state || addr.region || '';
    const country = addr.country || '';

    const parts = [village, center, governorate, country].map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return fallback;
    
    return parts.join(isRTL ? ' ← ' : ' → ');
  };

  const parseAddressText = (text: string) => {
    const parts = (text || '').split(/[،,]/).map(p => p.trim());
    return {
      governorate: parts[0] || 'الدقهلية',
      center: parts[1] || 'السنبلاوين',
      village: parts[2] || 'ميت غراب',
      street: parts[3] || 'شارع رئيسي',
      building: parts[4] || 'عمارة 1',
      floor: parts[5] || '',
      apartment: parts[6] || '',
      landmark: parts[7] || '',
      notes: parts[8] || '',
    };
  };

  const getAddressDetails = (addr: any) => {
    return `${addr.governorate || 'الدقهلية'}، ${addr.center || 'السنبلاوين'}، ${addr.village || 'ميت غراب'}، ${addr.street || ''}، ${addr.building || ''}${addr.floor ? `، ${addr.floor}` : ''}${addr.apartment ? `، ${addr.apartment}` : ''}${addr.landmark ? `، ${addr.landmark}` : ''}${addr.notes ? `، ${addr.notes}` : ''}`;
  };

  // Clear watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Continuous position watch using watchPosition
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError(isRTL ? 'تحديد الموقع غير مدعوم في هذا المتصفح' : 'Geolocation is not supported by this browser');
      showToast(isRTL ? 'المتصفح لا يدعم تحديد الموقع' : 'Browser does not support geolocation');
      return;
    }

    setLoading(true);
    setError(null);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${isRTL ? 'ar' : 'en'}`)
          .then(res => res.json())
          .then(data => {
            const resolvedAddress = formatEgyptAddress(data.address, data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            setAddressInput(resolvedAddress);
            setLocation({
              name: resolvedAddress,
              coords: { lat: latitude, lng: longitude },
              isVerified: true
            });
            showToast(isRTL ? 'تم تحديث موقعك التلقائي بنجاح' : 'Location updated successfully');
            setLoading(false);
          })
          .catch(() => {
            const fallbackStr = isRTL 
              ? `إحداثيات (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` 
              : `Coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
            setAddressInput(fallbackStr);
            setLocation({
              name: fallbackStr,
              coords: { lat: latitude, lng: longitude },
              isVerified: true
            });
            showToast(isRTL ? 'تم حفظ الإحداثيات' : 'Coordinates saved');
            setLoading(false);
          });
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError(isRTL ? 'تم رفض إذن الوصول للموقع الجغرافي' : 'Location permission denied');
          showToast(isRTL ? 'تم رفض إذن الموقع الجغرافي' : 'Location permission denied');
        } else {
          setError(isRTL ? 'فشل في تحديد الموقع الجغرافي' : 'Failed to retrieve location');
          showToast(isRTL ? 'فشل في تحديد الموقع الجغرافي' : 'Failed to retrieve location');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleSaveManualLocation = () => {
    if (!addressInput.trim()) {
      showToast(isRTL ? 'الرجاء إدخال عنوان صالح' : 'Please enter a valid address');
      return;
    }
    setLocation({
      name: addressInput,
      coords: null,
      isVerified: true
    });
    showToast(isRTL ? 'تم تعيين موقع التوصيل بنجاح' : 'Delivery location set successfully');
    closeMap();
  };

  const handleAddNewSavedAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput.trim() || !newLabel.trim()) {
      showToast(isRTL ? 'أدخل العنوان واسم اللافتة (مثل: المنزل)' : 'Enter address and label (e.g. Home)');
      return;
    }

    const parsed = parseAddressText(addressInput);
    addAddress({
      label: newLabel,
      ...parsed,
      isDefault: savedAddresses.length === 0,
      gpsCoords: null
    });
    setNewLabel('');
    showToast(isRTL ? 'تمت إضافة العنوان للمفضلة' : 'Address added to favorites');
  };

  return (
    <div className="absolute inset-0 bg-theme-bg z-[70] flex flex-col animate-slide-up theme-transition">
      {/* Map simulation header */}
      <div className="relative h-[40vh] bg-gray-200">
        <img 
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80" 
          className="w-full h-full object-cover opacity-80" 
          alt="Map Background" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 to-transparent"></div>
        <button 
          onClick={closeMap} 
          className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-4 bg-theme-card/95 backdrop-blur shadow-md p-2.5 rounded-full text-theme-text z-10 hover:bg-theme-card transition"
        >
          <ChevronRight size={22} className={isRTL ? '' : 'rotate-180'} />
        </button>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full text-primary animate-bounce">
          <MapPin size={40} fill="currentColor" stroke="white" strokeWidth={2} />
        </div>
      </div>
      
      {/* Location Picker Panel */}
      <div className="flex-1 bg-theme-card -mt-8 rounded-t-[32px] relative z-20 p-5 flex flex-col shadow-[0_-15px_30px_rgba(0,0,0,0.1)] border-t border-theme-border/50 theme-transition">
        
        {/* Toggle Tabs */}
        <div className="flex bg-theme-bg p-1 rounded-2xl mb-5 border border-theme-border">
          <button
            onClick={() => setActiveTab('picker')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
              activeTab === 'picker' 
                ? 'bg-theme-card text-theme-text shadow-sm' 
                : 'text-theme-muted hover:text-theme-text'
            }`}
          >
            {isRTL ? 'تحديد موقع جديد' : 'New Location'}
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
              activeTab === 'saved' 
                ? 'bg-theme-card text-theme-text shadow-sm' 
                : 'text-theme-muted hover:text-theme-text'
            }`}
          >
            {isRTL ? 'العناوين المحفوظة' : 'Saved Addresses'} ({savedAddresses.length})
          </button>
        </div>

        {activeTab === 'picker' ? (
          <div className="flex-1 flex flex-col">
            <h2 className="text-base font-black text-theme-text mb-1">{isRTL ? 'تحديد عنوان التوصيل' : 'Delivery Address'}</h2>
            <p className="text-theme-muted text-[11px] mb-4 font-bold">
              {isRTL ? 'استخدم الـ GPS لتحديد موقعك الحالي أو أدخل العنوان بالأسفل يدوياً.' : 'Use GPS to resolve location or enter address below.'}
            </p>
            
            {/* GPS Trigger */}
            <button 
              onClick={detectLocation} 
              disabled={loading} 
              className="w-full bg-primary/10 border border-primary/20 text-primary font-black py-3 rounded-2xl mb-4 flex items-center justify-center gap-2 hover:bg-primary/15 transition active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Crosshair size={18} />
              )}
              {loading ? (isRTL ? 'جاري تحديد إحداثياتك...' : 'Locating...') : (isRTL ? 'تحديد موقعي التلقائي (GPS)' : 'Locate Me (GPS)')}
            </button>

            {/* Error display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] p-2.5 rounded-xl mb-4 flex items-center gap-2 font-bold">
                <ShieldAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Address input */}
            <div className="relative mb-3">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <MapIcon size={16} className="text-theme-muted" />
              </div>
              <input 
                type="text" 
                value={addressInput} 
                onChange={e => setAddressInput(e.target.value)} 
                className="w-full bg-theme-bg border border-theme-border rounded-xl py-3 pr-11 pl-4 text-xs focus:border-primary outline-none font-bold text-theme-text shadow-inner" 
                placeholder={isRTL ? 'أدخل العنوان بالتفصيل...' : 'Enter full address details...'} 
              />
            </div>

            {/* Save to Favorites Form */}
            <form onSubmit={handleAddNewSavedAddress} className="bg-theme-bg p-3.5 border border-theme-border rounded-2xl space-y-2 mb-4">
              <span className="text-[10px] text-theme-muted font-black uppercase tracking-wider block">
                {isRTL ? 'حفظ العنوان لاستخدامه لاحقاً' : 'Save address for later'}
              </span>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  className="bg-theme-card border border-theme-border text-xs rounded-xl px-3 py-2 flex-1 focus:border-primary outline-none font-bold text-theme-text"
                  placeholder={isRTL ? 'اسم اللافتة (مثال: المنزل 🏠)' : 'Label (e.g. Home 🏠)'}
                />
                <button 
                  type="submit" 
                  className="bg-primary hover:bg-primary-hover text-white px-3 py-2 rounded-xl text-xs font-black shadow transition flex items-center gap-1"
                >
                  <Plus size={14} strokeWidth={3} /> {isRTL ? 'حفظ' : 'Save'}
                </button>
              </div>
            </form>

            <button 
              onClick={handleSaveManualLocation} 
              className="mt-auto w-full bg-primary hover:bg-primary-hover text-white font-black py-3.5 rounded-2xl shadow-lg transition mb-[calc(env(safe-area-inset-bottom)+0.25rem)]"
            >
              {isRTL ? 'تأكيد موقع التوصيل الحالى' : 'Confirm Current Location'}
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-y-auto">
            <h2 className="text-base font-black text-theme-text mb-1">{isRTL ? 'مواقع التوصيل المحفوظة' : 'Saved Delivery Locations'}</h2>
            <p className="text-theme-muted text-[11px] mb-4 font-bold">
              {isRTL ? 'اختر أحد عناوينك المحفوظة ليتم التوصيل إليه مباشرة.' : 'Select a saved location for direct delivery shipping.'}
            </p>

            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[35vh] pr-1">
              {savedAddresses.length === 0 ? (
                <div className="text-center py-8 text-theme-muted text-xs">
                  {isRTL ? 'ليس لديك أي عناوين محفوظة حالياً.' : 'No saved addresses yet.'}
                </div>
              ) : (
                savedAddresses.map(addr => (
                  <div 
                    key={addr.id}
                    onClick={() => setDefaultAddress(addr.id || '')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex justify-between items-center ${
                      addr.isDefault 
                        ? 'bg-primary/5 border-primary/30 shadow-sm shadow-primary/5' 
                        : 'bg-theme-bg border-theme-border hover:border-primary/20'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 pr-1">
                      <div className={`p-2 rounded-lg ${addr.isDefault ? 'bg-primary/20 text-primary' : 'bg-theme-card text-theme-muted border border-theme-border'}`}>
                        <MapPin size={16} fill={addr.isDefault ? 'currentColor' : 'none'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-theme-text leading-tight">{addr.label || addr.village}</span>
                          {addr.isDefault && (
                            <span className="bg-primary text-white text-[8px] font-black px-1.5 py-0.2 rounded-md uppercase">
                              {isRTL ? 'افتراضي' : 'Default'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-theme-muted font-bold mt-1 leading-normal pr-1">{getAddressDetails(addr)}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAddress(addr.id || '');
                      }}
                      className="p-2 text-theme-muted hover:text-red-500 rounded-lg hover:bg-theme-bg transition"
                      title={isRTL ? 'حذف العنوان' : 'Delete Address'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={closeMap} 
              className="mt-auto w-full bg-primary hover:bg-primary-hover text-white font-black py-3.5 rounded-2xl shadow-lg transition mb-[calc(env(safe-area-inset-bottom)+0.25rem)]"
            >
              {isRTL ? 'إغلاق ومتابعة التسوق' : 'Close and Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default LocationPicker;
