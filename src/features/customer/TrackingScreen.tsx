import React, { useEffect, useState, useRef } from 'react';
import { ChevronRight, Phone, MessageSquare, MapPin, Compass, Clock, ShieldCheck, ShoppingBag, Store as StoreIcon, ExternalLink } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { trackingService, TrackingState } from '../../services/tracking.service';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Premium Rebuild Imports
import { PremiumCard } from '../../components/premium/PremiumCard';
import { PremiumBadge } from '../../components/premium/PremiumBadge';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { useStores } from '../../hooks/useStores';

interface TrackingScreenProps {
  orderId: string;
  goBack: () => void;
}

export const TrackingScreen: React.FC<TrackingScreenProps> = ({ orderId, goBack }) => {
  const { t, isRTL, location, orders } = useApp();
  const { stores } = useStores();;
  const [trackingState, setTrackingState] = useState<TrackingState | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // Marker and layer references
  const storeMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Initialize tracking subscription
  useEffect(() => {
    const customerCoords = location.coords || { lat: 30.0444, lng: 31.2357 };
    const order = orders.find(o => o.id === orderId);
    
    // Default mock store location if order doesn't have it
    const storeCoords = order?.storeLocation || { 
      lat: customerCoords.lat - 0.006, 
      lng: customerCoords.lng - 0.007 
    };

    if (!order) return;

    const unsubscribe = trackingService.subscribeToLiveTracking(
      order.driverId,
      order.status,
      storeCoords,
      customerCoords,
      (state) => {
        setTrackingState(state);
      }
    );

    return () => {
      unsubscribe();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [location.coords, orders, orderId]);

  // Handle map rendering and updates
  useEffect(() => {
    if (!trackingState || !mapContainerRef.current) return;

    const { storeLocation, customerLocation, driverLocation, route } = trackingState;

    // Custom Tailwind-styled DivIcons for Leaflet
    const storeIcon = L.divIcon({
      html: `<div class="bg-indigo-600 text-white p-2 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center w-9 h-9">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 .5-1.5V11.5a2 2 0 0 0-1-1.5l-6-4.5a2 2 0 0 0-2.5 0l-6 4.5a2 2 0 0 0-1 1.5V18.5a2 2 0 0 0 .5 1.5M3 10V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5"/></svg>
      </div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const customerIcon = L.divIcon({
      html: `<div class="bg-primary text-white p-2 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center w-9 h-9">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const driverIcon = L.divIcon({
      html: `<div class="bg-orange-500 text-white p-2 rounded-[18px] border-2 border-white shadow-xl flex items-center justify-center w-10 h-10 animate-bounce">
        <svg class="animate-pulse" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
      </div>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    // 1. Initialize Map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([storeLocation.lat, storeLocation.lng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(mapRef.current);

      // Add static/anchor markers
      storeMarkerRef.current = L.marker([storeLocation.lat, storeLocation.lng], { icon: storeIcon }).addTo(mapRef.current);
      customerMarkerRef.current = L.marker([customerLocation.lat, customerLocation.lng], { icon: customerIcon }).addTo(mapRef.current);

      // Draw polyline route
      polylineRef.current = L.polyline(route, {
        color: '#FF7A00',
        weight: 5,
        dashArray: '10, 8',
        opacity: 0.85
      }).addTo(mapRef.current);

      // Fit map bounds to show route
      const bounds = L.latLngBounds([
        [storeLocation.lat, storeLocation.lng],
        [customerLocation.lat, customerLocation.lng]
      ]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

    // 2. Update Dynamic Driver Location
    if (driverLocation) {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng]);
      } else {
        driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon }).addTo(mapRef.current);
      }

      // Pan map to follow driver smoothly
      if (mapRef.current) {
        mapRef.current.panTo([driverLocation.lat, driverLocation.lng]);
      }
    } else {
      if (driverMarkerRef.current) {
        mapRef.current?.removeLayer(driverMarkerRef.current);
        driverMarkerRef.current = null;
      }
    }

  }, [trackingState]);

  if (!trackingState) {
    return (
      <div className="bg-theme-bg h-full flex flex-col items-center justify-center p-6 text-center theme-transition">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-sm text-theme-text">{isRTL ? 'جاري الاتصال بنظام تتبع الشحنات...' : 'Connecting to Live Tracking...'}</p>
      </div>
    );
  }

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

  const order = orders.find(o => o.id === orderId);
  const currentStepNum = order ? getOrderStepNumber(order.status) : 2;
  const storeData = order ? stores.find(s => s.id === order.shopId) : null;

  return (
    <div className="bg-theme-bg h-full flex flex-col overflow-hidden animate-slide-in-right theme-transition relative">
      
      {/* Fullscreen Map Background */}
      <div className="flex-1 relative overflow-hidden bg-theme-bg z-10 h-full">
        <div 
          ref={mapContainerRef} 
          id="map-container"
          className="w-full h-full"
          style={{ minHeight: '100%' }}
        />

        {/* Floating Top Header Overlay */}
        <div className="absolute top-[calc(env(safe-area-inset-top)+0.5rem)] left-4 right-4 flex items-center gap-3 z-[1000] animate-fade-in">
          <button 
            onClick={goBack} 
            className="p-3 bg-theme-card/90 backdrop-blur-md border border-theme-border/60 shadow-md rounded-2xl text-theme-text hover:bg-theme-card transition active:scale-95 flex items-center justify-center"
          >
            <ChevronRight size={18} className={isRTL ? '' : 'rotate-180'} />
          </button>
          
          <div className="bg-theme-card/90 backdrop-blur-md px-4.5 py-2.5 rounded-2xl border border-theme-border/60 shadow-md flex-1">
            <h1 className="text-xs font-black text-theme-text truncate leading-none">
              {isRTL ? `تتبع طلبك #${orderId}` : `Track Order #${orderId}`}
            </h1>
            <span className="text-[9px] text-theme-muted font-bold block mt-1 animate-pulse text-green-500 leading-none">
              ● {isRTL ? 'تحديث حي من المندوب' : 'Live courier coordinates active'}
            </span>
          </div>
        </div>

        {/* Floating ETA panel (Mid-top overlay) */}
        <div className="absolute top-[calc(env(safe-area-inset-top)+4.75rem)] left-4 right-4 bg-theme-card/90 backdrop-blur-md p-4 rounded-2xl border border-theme-border/60 shadow-md flex items-center justify-between theme-transition z-[1000] animate-pop-in">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
              <Clock size={18} />
            </div>
            <div>
              <span className="text-[9px] text-theme-muted font-black block leading-none mb-1 uppercase tracking-wide">
                {isRTL ? 'الوقت المتوقع للوصول' : 'Estimated Arrival'}
              </span>
              <span className="text-sm font-black text-theme-text">
                {trackingState.status === 'delivered' ? (isRTL ? 'تم التسليم' : 'Delivered') : `${trackingState.eta} ${isRTL ? 'دقيقة' : 'mins'}`}
              </span>
            </div>
          </div>
          <div>
            <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider block border ${
              trackingState.status === 'delivered' 
                ? 'bg-green-500 text-white border-green-600' 
                : trackingState.status === 'on_the_way' 
                ? 'bg-blue-500 text-white border-blue-600 animate-bounce'
                : 'bg-primary text-white border-primary-hover'
            }`}>
              {trackingState.status === 'preparing' 
                ? (isRTL ? 'قيد التعبئة' : 'Preparing') 
                : trackingState.status === 'on_the_way'
                ? (isRTL ? 'على الطريق' : 'En Route')
                : trackingState.status === 'arrived'
                ? (isRTL ? 'وصل المندوب' : 'Arrived')
                : (isRTL ? 'تم التسليم' : 'Delivered')
              }
            </span>
          </div>
        </div>
      </div>

      {/* Uber Eats Style Bottom Sheet Panel (Fixed at bottom overlay, high z-index) */}
      <div className="bg-theme-card rounded-t-[32px] border-t border-theme-border shadow-[0_-12px_36px_rgba(0,0,0,0.18)] p-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] theme-transition relative z-20 max-h-[50%] overflow-y-auto no-scrollbar">
        {/* Drag handle decorator */}
        <div className="w-12 h-1 bg-theme-border/80 rounded-full mx-auto mb-4"></div>

        {/* Courier Captain Details */}
        <div className="bg-theme-bg/50 border border-theme-border/60 rounded-2xl p-3.5 flex items-center justify-between mb-4.5 theme-transition">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white font-black text-base shadow-sm font-sans">
              {isRTL ? 'ك' : 'C'}
            </div>
            <div>
              <h3 className="text-xs font-black text-theme-text">{isRTL ? 'الكابتن أحمد حسن' : 'Captain Ahmed Hassan'}</h3>
              <p className="text-[9px] text-theme-muted font-bold mt-1 font-sans">
                {isRTL ? 'سكوتر دايون أسود (ع-م-ر ٤٩٥)' : 'Black Dayun Scooter (E-M-R 495)'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <a 
              href="tel:01000000000" 
              className="p-2.5 bg-theme-card border border-theme-border text-theme-text rounded-xl hover:scale-105 active:scale-95 transition shadow-sm flex items-center justify-center"
            >
              <Phone size={14} />
            </a>
            <button 
              onClick={() => window.open('https://wa.me/201000000000')}
              className="p-2.5 bg-green-500 text-white rounded-xl hover:scale-105 active:scale-95 transition shadow-sm flex items-center justify-center"
            >
              <MessageSquare size={14} />
            </button>
          </div>
        </div>

        {/* Store & Order Details summary inside Sheet */}
        {order && (
          <div className="bg-theme-bg/40 border border-theme-border/50 rounded-2xl p-3.5 mb-5 space-y-2.5 text-xs font-semibold theme-transition">
            <div className="flex items-center gap-2 text-theme-text border-b border-theme-border/40 pb-2">
              <StoreIcon size={14} className="text-primary" />
              <span className="font-black">{order.shopName}</span>
              {storeData && (
                <span className="text-[8px] bg-theme-border/60 text-theme-muted px-1.5 py-0.5 rounded">
                  {storeData.village}
                </span>
              )}
            </div>
            
            {/* Items display */}
            <div className="space-y-1.5">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[10px] text-theme-muted">
                  <span>{item.name} <span className="font-sans font-black text-theme-text">x{item.quantity}</span></span>
                  <span className="font-sans">{item.price * item.quantity} ج.م</span>
                </div>
              ))}
            </div>

            <div className="border-t border-theme-border/40 pt-2 flex justify-between font-black text-[11px] text-theme-text">
              <span>{isRTL ? 'إجمالي الحساب:' : 'Order Total:'}</span>
              <span className="text-primary font-sans">{order.total} ج.م</span>
            </div>
          </div>
        )}

        {/* Dynamic Stepper Timeline */}
        <div className="space-y-4 pr-0.5 border-t border-theme-border/40 pt-4.5">
          <span className="text-[9px] font-black text-theme-muted uppercase tracking-wider block mb-1">
            {isRTL ? 'خطوات توصيل الطلب الحالي:' : 'Delivery Journey Progress:'}
          </span>
          {[
            { id: 1, label: isRTL ? 'إرسال الطلب' : 'Order Placed', desc: isRTL ? 'بانتظار قبول المتجر لبدء التجهيز' : 'Awaiting store confirmation' },
            { id: 2, label: isRTL ? 'قبول الطلب' : 'Order Accepted', desc: isRTL ? 'تم قبول طلبك وجاري بدء التحضير' : 'Order approved by merchant' },
            { id: 3, label: isRTL ? 'تحضير الطلب' : 'Preparing Items', desc: isRTL ? 'يقوم المتجر بتعبئة وتغليف منتجاتك' : 'Store packaging your products' },
            { id: 4, label: isRTL ? 'جاهز للتوصيل' : 'Ready for Pickup', desc: isRTL ? 'الطلب معبأ بالكامل وبانتظار المندوب' : 'Package waiting for pickup' },
            { id: 5, label: isRTL ? 'استلام المندوب' : 'Picked Up by Driver', desc: isRTL ? 'استلم المندوب شحنتك وهو يستعد للشحن' : 'Courier picked up your cargo' },
            { id: 6, label: isRTL ? 'على الطريق' : 'On the Way', desc: isRTL ? 'يقود المندوب سكوتر باتجاه عنوانك' : 'Courier en route to your coordinates' },
            { id: 7, label: isRTL ? 'تم التوصيل بنجاح' : 'Delivered successfully', desc: isRTL ? 'استلمت شحنتك وأغلقت الدورة بنجاح' : 'Shipment handed over cleanly' }
          ].map((s) => {
            const isCompleted = currentStepNum >= s.id;
            const isActive = currentStepNum === s.id;
            
            return (
              <div key={s.id} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] font-black transition-all duration-300 ${
                    isCompleted ? 'bg-primary text-white shadow-sm shadow-primary/10' : 'bg-theme-bg border border-theme-border/80 text-theme-muted'
                  }`}>
                    {isCompleted ? <ShieldCheck size={13} strokeWidth={3} /> : s.id}
                  </div>
                  {s.id !== 7 && (
                    <div className={`w-0.5 h-6.5 my-1 transition-all duration-300 ${isCompleted && currentStepNum > s.id ? 'bg-primary' : 'bg-theme-border/60'}`}></div>
                  )}
                </div>

                <div className="flex-1 pb-1.5">
                  <h4 className={`text-xs font-black leading-tight ${isActive ? 'text-primary animate-pulse' : 'text-theme-text'}`}>
                    {s.label}
                  </h4>
                  <p className="text-[10px] text-theme-muted font-bold mt-0.5">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default TrackingScreen;
