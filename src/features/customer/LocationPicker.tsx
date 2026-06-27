import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Crosshair, Map as MapIcon, ChevronRight, Trash2, Plus, ShieldAlert } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { openSourceMapsService } from '../../services/openSourceMaps.service';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
    isRTL 
  } = useApp();

  const { location } = useApp();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressInput, setAddressInput] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [activeTab, setActiveTab] = useState<'picker' | 'saved'>('picker');
  
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // Picker states
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 30.0444, lng: 31.2357 });
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [showConfirmManual, setShowConfirmManual] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

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

  // Clean debounce timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Initialize and load Leaflet map only when Tab is 'picker'
  useEffect(() => {
    if (activeTab !== 'picker' || !mapContainerRef.current) return;

    const initialLat = location.coords?.lat ?? coords.lat;
    const initialLng = location.coords?.lng ?? coords.lng;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([initialLat, initialLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    const customMarkerIcon = L.divIcon({
      html: `<div class="text-primary flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" class="animate-bounce"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 36]
    });

    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: customMarkerIcon
    }).addTo(map);

    mapRef.current = map;
    markerRef.current = marker;

    // Fetch initial address
    handleCoordsChange(initialLat, initialLng);

    // Map click moves marker
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      handleCoordsChange(lat, lng, 0); // Manual click has 0 accuracy
      setShowConfirmManual(false); // Manually placed means confirmed
    });

    // Marker drag updates coords
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      handleCoordsChange(pos.lat, pos.lng, 0); // Manual drag has 0 accuracy
      setShowConfirmManual(false); // Manually adjusted means confirmed
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [activeTab]);

  const handleCoordsChange = async (lat: number, lng: number, accuracy?: number) => {
    setCoords({ lat, lng });
    if (accuracy !== undefined) {
      setGpsAccuracy(accuracy);
    }
    
    setLoading(true);
    try {
      const data = await openSourceMapsService.reverseGeocode(lat, lng);
      setAddressInput(data.formattedAddress);
    } catch (e) {
      console.error('Reverse geocode failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressInputChange = (val: string) => {
    setAddressInput(val);
    
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 3) {
      debounceTimerRef.current = window.setTimeout(async () => {
        try {
          const results = await openSourceMapsService.getAutocompleteSuggestions(val);
          setSuggestions(results);
        } catch (e) {
          console.error(e);
        }
      }, 600); // 600ms debounce
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (sug: any) => {
    setAddressInput(sug.description);
    setSuggestions([]);
    setCoords({ lat: sug.lat, lng: sug.lng });
    setGpsAccuracy(null);
    setShowConfirmManual(false);

    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([sug.lat, sug.lng], 16);
      markerRef.current.setLatLng([sug.lat, sug.lng]);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError(isRTL ? 'تحديد الموقع غير مدعوم في هذا المتصفح' : 'Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsAccuracy(accuracy);
        
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
        }
        
        await handleCoordsChange(latitude, longitude, accuracy);
        
        if (accuracy > 10) {
          setShowConfirmManual(true);
        } else {
          setShowConfirmManual(false);
        }
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        setError(isRTL ? 'فشل في تحديد الموقع الجغرافي' : 'Failed to retrieve location');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSaveManualLocation = () => {
    if (!addressInput.trim()) {
      showToast(isRTL ? 'الرجاء إدخال عنوان صالح' : 'Please enter a valid address');
      return;
    }
    if (showConfirmManual) {
      showToast(isRTL ? 'يرجى تأكيد دقة الموقع يدوياً أولاً' : 'Please confirm GPS accuracy manually first');
      return;
    }

    setLocation({
      name: addressInput,
      coords: { 
        lat: coords.lat, 
        lng: coords.lng, 
        accuracy: gpsAccuracy ?? undefined
      },
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
      gpsCoords: { latitude: coords.lat, longitude: coords.lng, accuracy: gpsAccuracy ?? undefined }
    });
    setNewLabel('');
    showToast(isRTL ? 'تمت إضافة العنوان للمفضلة' : 'Address added to favorites');
  };

  return (
    <div className="absolute inset-0 bg-theme-bg z-[70] flex flex-col animate-slide-up theme-transition">
      {/* Map container */}
      <div className="relative h-[40vh] bg-gray-200">
        {activeTab === 'picker' ? (
          <div ref={mapContainerRef} className="w-full h-full z-10" />
        ) : (
          <img 
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80" 
            className="w-full h-full object-cover opacity-80" 
            alt="Map Background" 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 to-transparent pointer-events-none"></div>
        <button 
          onClick={closeMap} 
          className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-4 bg-theme-card/95 backdrop-blur shadow-md p-2.5 rounded-full text-theme-text z-[1000] hover:bg-theme-card transition"
        >
          <ChevronRight size={22} className={isRTL ? '' : 'rotate-180'} />
        </button>
      </div>
      
      {/* Location Picker Panel */}
      <div className="flex-1 bg-theme-card -mt-8 rounded-t-[32px] relative z-20 p-5 flex flex-col shadow-[0_-15px_30px_rgba(0,0,0,0.1)] border-t border-theme-border/50 theme-transition overflow-y-auto no-scrollbar">
        
        {/* Toggle Tabs */}
        <div className="flex bg-theme-bg p-1 rounded-2xl mb-5 border border-theme-border flex-shrink-0">
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
              type="button"
              onClick={detectLocation} 
              disabled={loading} 
              className="w-full bg-primary/10 border border-primary/20 text-primary font-black py-3 rounded-2xl mb-4 flex items-center justify-center gap-2 hover:bg-primary/15 transition active:scale-98 disabled:opacity-50 flex-shrink-0"
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
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] p-2.5 rounded-xl mb-4 flex items-center gap-2 font-bold flex-shrink-0">
                <ShieldAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* GPS Accuracy Indicator */}
            {gpsAccuracy !== null && (
              <div className="flex justify-between items-center bg-theme-bg p-3 rounded-xl border border-theme-border text-xs mb-3 flex-shrink-0">
                <span className="text-theme-muted font-bold">{isRTL ? 'دقة تحديد الموقع (GPS)' : 'GPS Accuracy'}</span>
                <span className={`font-black ${gpsAccuracy > 10 ? 'text-amber-500' : 'text-green-500'}`}>
                  {gpsAccuracy.toFixed(1)} {isRTL ? 'متر' : 'meters'}
                </span>
              </div>
            )}

            {/* Low Accuracy Manual Warning */}
            {showConfirmManual && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs p-3.5 rounded-2xl mb-4 space-y-2 flex-shrink-0">
                <p className="font-black leading-relaxed">
                  {isRTL 
                    ? '⚠️ إشارة الـ GPS غير دقيقة حالياً (أكبر من 10 أمتار). يرجى التأكد من موقع العلامة على الخريطة وسحبها لموقعك الدقيق.'
                    : '⚠️ GPS accuracy is low (greater than 10 meters). Please adjust the marker position manually by dragging it on the map.'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowConfirmManual(false)}
                  className="bg-amber-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm hover:bg-amber-600 transition"
                >
                  {isRTL ? 'تأكيد الموقع يدوياً' : 'Confirm Manually'}
                </button>
              </div>
            )}

            {/* Address search autocomplete */}
            <div className="relative mb-3 flex-shrink-0 z-30">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <MapIcon size={16} className="text-theme-muted" />
              </div>
              <input 
                type="text" 
                value={addressInput} 
                onChange={e => handleAddressInputChange(e.target.value)} 
                className="w-full bg-theme-bg border border-theme-border rounded-xl py-3 pr-11 pl-4 text-xs focus:border-primary outline-none font-bold text-theme-text shadow-inner" 
                placeholder={isRTL ? 'أدخل العنوان بالتفصيل للبحث...' : 'Enter address to search...'} 
              />
              
              {/* Autocomplete suggestions dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-theme-card border border-theme-border rounded-xl shadow-lg max-h-48 overflow-y-auto z-[2000] divide-y divide-theme-border/60">
                  {suggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectSuggestion(sug)}
                      className="p-3 text-xs font-bold text-theme-text hover:bg-primary/5 cursor-pointer transition text-right"
                    >
                      {sug.description}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save to Favorites Form */}
            <form onSubmit={handleAddNewSavedAddress} className="bg-theme-bg p-3.5 border border-theme-border rounded-2xl space-y-2 mb-4 flex-shrink-0">
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
              type="button"
              onClick={handleSaveManualLocation} 
              disabled={showConfirmManual}
              className="mt-auto w-full bg-primary hover:bg-primary-hover text-white font-black py-3.5 rounded-2xl shadow-lg transition mb-1 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
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
                <div className="text-center py-8 text-theme-muted text-xs font-bold">
                  {isRTL ? 'ليس لديك أي عناوين محفوظة حالياً.' : 'No saved addresses yet.'}
                </div>
              ) : (
                savedAddresses.map(addr => (
                  <div 
                    key={addr.id}
                    onClick={() => setDefaultAddress(addr.id || '')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex justify-between items-center ${
                      addr.isDefault 
                        ? 'bg-primary/5 border-primary/30 shadow-sm' 
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
                      type="button"
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
              type="button"
              onClick={closeMap} 
              className="mt-auto w-full bg-primary hover:bg-primary-hover text-white font-black py-3.5 rounded-2xl shadow-lg transition mb-1"
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
