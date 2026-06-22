import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import { MapPin, Navigation, Compass, Package } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface VendorTrackingProps {
  order: any;
}

export const VendorTracking: React.FC<VendorTrackingProps> = ({ order }) => {
  const { isRTL, drivers } = useApp();
  const [driverLocation, setDriverLocation] = useState<{lat: number, lng: number} | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);

  const driverInfo = drivers.find(d => d.id === order?.driverId);

  useEffect(() => {
    if (!order?.driverId) return;

    const unsub = onSnapshot(doc(db, 'driverLocations', order.driverId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDriverLocation({ lat: data.lat, lng: data.lng });
      }
    });

    return () => unsub();
  }, [order?.driverId]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const storeCoords = order?.storeLocation || { lat: 30.0444, lng: 31.2357 };

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([storeCoords.lat, storeCoords.lng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(mapRef.current);

      const storeIcon = L.divIcon({
        html: `<div class="bg-indigo-600 text-white p-2 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center w-8 h-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 .5-1.5V11.5a2 2 0 0 0-1-1.5l-6-4.5a2 2 0 0 0-2.5 0l-6 4.5a2 2 0 0 0-1 1.5V18.5a2 2 0 0 0 .5 1.5M3 10V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5"/></svg>
        </div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      L.marker([storeCoords.lat, storeCoords.lng], { icon: storeIcon }).addTo(mapRef.current);
    }

    if (driverLocation) {
      const driverIcon = L.divIcon({
        html: `<div class="bg-orange-500 text-white p-2 rounded-[18px] border-2 border-white shadow-xl flex items-center justify-center w-8 h-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        </div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng]);
      } else {
        driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon }).addTo(mapRef.current);
      }

      mapRef.current.panTo([driverLocation.lat, driverLocation.lng]);
    }

    return () => {
      // Map cleanup if unmounted entirely, usually handled by react-leaflet if used, but doing it manually here:
    };
  }, [driverLocation, order]);

  if (!order?.driverId) {
    return (
      <div className="bg-theme-bg p-6 rounded-2xl text-center border border-theme-border">
        <Package size={32} className="mx-auto text-theme-muted mb-2" />
        <p className="text-xs font-bold text-theme-muted">{isRTL ? 'لم يتم تعيين مندوب بعد' : 'No driver assigned yet'}</p>
      </div>
    );
  }

  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div className="p-4 border-b border-theme-border flex justify-between items-center bg-theme-bg/50">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <Navigation size={18} />
          </div>
          <div>
            <h4 className="text-sm font-black text-theme-text">{isRTL ? 'تتبع المندوب' : 'Driver Tracking'}</h4>
            <span className="text-[10px] font-bold text-theme-muted mt-0.5 block">{driverInfo?.name || 'Mandoob'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          {isRTL ? 'مباشر' : 'Live'}
        </div>
      </div>
      <div className="h-64 relative bg-theme-bg">
        <div ref={mapContainerRef} className="w-full h-full" />
        {!driverLocation && (
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-sm z-[1000] flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-bold text-theme-text">{isRTL ? 'جاري الاتصال بـ GPS المندوب...' : 'Connecting to Driver GPS...'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
