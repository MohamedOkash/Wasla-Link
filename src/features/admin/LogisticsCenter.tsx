import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import { MapPin, Navigation, Compass, Package, Users, Activity, Search, AlertTriangle, Clock } from 'lucide-react';
import { collection, onSnapshot, query, doc, updateDoc } from 'firebase/firestore';
import { dispatchService } from '../../services/dispatch.service';
import { db } from '../../services/firebase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const LogisticsCenter: React.FC = () => {
  const { isRTL, drivers, orders, showToast } = useApp();
  const [locations, setLocations] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'busy' | 'offline'>('all');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [assignOrderId, setAssignOrderId] = useState<string>('');
  
  const handleForceAssign = async () => {
    if (!selectedDriverId || !assignOrderId) return;
    try {
       // bypass logic and force assign
       await updateDoc(doc(db, 'orders', assignOrderId), {
          status: 'driver_assigned',
          assignedDriverId: selectedDriverId,
          assignedAt: new Date().toISOString(),
          assignmentAttempts: 1
       });
       await updateDoc(doc(db, 'users', selectedDriverId), {
          currentOrderId: assignOrderId
       });
       showToast('Force assignment successful');
    } catch(e) {
       console.error(e);
       showToast('Failed to force assign', 'error');
    }
  };

  const handleCancelAssignment = async () => {
    if (!assignOrderId) return;
    try {
       const order = orders.find(o => o.id === assignOrderId);
       if (order && order.assignedDriverId) {
         await updateDoc(doc(db, 'users', order.assignedDriverId), {
            currentOrderId: null
         });
       }
       await updateDoc(doc(db, 'orders', assignOrderId), {
          status: 'ready_for_delivery',
          assignedDriverId: null,
          assignedAt: null
       });
       showToast('Assignment cancelled');
    } catch(e) {
       console.error(e);
       showToast('Failed to cancel assignment', 'error');
    }
  };


  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    const q = query(collection(db, 'driverLocations'));
    const unsub = onSnapshot(q, (snapshot) => {
      const newLocations: Record<string, any> = {};
      snapshot.forEach(doc => {
        newLocations[doc.id] = doc.data();
      });
      setLocations(newLocations);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      // Center on Cairo by default
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([30.0444, 31.2357], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(mapRef.current);
    }

    // Update markers
    Object.keys(locations).forEach(driverId => {
      const loc = locations[driverId];
      const driverInfo = drivers.find(d => d.id === driverId);
      const isOnline = driverInfo?.availability === 'available' || driverInfo?.availability === 'busy';
      const isBusy = driverInfo?.availability === 'busy';
      const hasError = loc.status === 'gps_disabled' || loc.status === 'permission_denied';

      let markerColor = isBusy ? 'bg-amber-500' : isOnline ? 'bg-green-500' : 'bg-gray-500';
      if (hasError) markerColor = 'bg-red-500 animate-pulse';

      const iconHtml = `<div class="${markerColor} text-white p-2 rounded-full border-2 border-white shadow-lg flex items-center justify-center w-8 h-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        </div>`;

      const icon = L.divIcon({
        html: iconHtml,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      if (markersRef.current[driverId]) {
        markersRef.current[driverId].setLatLng([loc.lat, loc.lng]);
        markersRef.current[driverId].setIcon(icon);
      } else {
        const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(mapRef.current!);
        marker.bindPopup(`<b>${driverInfo?.name || driverId}</b><br>Status: ${driverInfo?.availability}`);
        markersRef.current[driverId] = marker;
      }
    });

  }, [locations, drivers]);

  const stats = {
    total: drivers.length,
    online: drivers.filter(d => d.availability === 'available').length,
    busy: drivers.filter(d => d.availability === 'busy').length,
    offline: drivers.filter(d => d.availability === 'offline' || !d.availability).length,
    errors: Object.values(locations).filter(l => l.status === 'gps_disabled' || l.status === 'permission_denied').length,
    activeOrders: orders.filter(o => ['ready_for_delivery', 'driver_assigned', 'driver_accepted', 'picked_up', 'on_the_way'].includes(o.status)).length
  };

  const filteredDrivers = drivers.filter(d => {
    if (filter !== 'all' && d.availability !== filter) return false;
    if (searchQuery) {
      return d.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
             d.phone?.includes(searchQuery);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-theme-card border border-theme-border p-4 rounded-2xl shadow-sm cursor-pointer" onClick={() => setFilter('all')}>
          <span className="text-[10px] text-theme-muted font-black block">{isRTL ? 'إجمالي المناديب' : 'Total Drivers'}</span>
          <span className="text-xl font-black text-theme-text mt-1">{stats.total}</span>
        </div>
        <div className="bg-theme-card border border-green-500/30 p-4 rounded-2xl shadow-sm cursor-pointer" onClick={() => setFilter('available')}>
          <span className="text-[10px] text-green-500 font-black block">{isRTL ? 'متاح (Online)' : 'Online'}</span>
          <span className="text-xl font-black text-theme-text mt-1">{stats.online}</span>
        </div>
        <div className="bg-theme-card border border-amber-500/30 p-4 rounded-2xl shadow-sm cursor-pointer" onClick={() => setFilter('busy')}>
          <span className="text-[10px] text-amber-500 font-black block">{isRTL ? 'مشغول بتوصيلة' : 'Busy'}</span>
          <span className="text-xl font-black text-theme-text mt-1">{stats.busy}</span>
        </div>
        <div className="bg-theme-card border border-theme-border p-4 rounded-2xl shadow-sm cursor-pointer" onClick={() => setFilter('offline')}>
          <span className="text-[10px] text-theme-muted font-black block">{isRTL ? 'مغلق (Offline)' : 'Offline'}</span>
          <span className="text-xl font-black text-theme-text mt-1">{stats.offline}</span>
        </div>
        <div className="bg-theme-card border border-red-500/30 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] text-red-500 font-black block">{isRTL ? 'أخطاء GPS' : 'GPS Errors'}</span>
          <span className="text-xl font-black text-theme-text mt-1">{stats.errors}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
        {/* Sidebar */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 bg-theme-card border border-theme-border rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-theme-border bg-theme-bg/50">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
              <input 
                type="text" 
                placeholder={isRTL ? 'بحث بالاسم أو الرقم...' : 'Search driver...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-theme-bg border border-theme-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-theme-text font-bold focus:border-primary outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredDrivers.map(d => {
              const loc = locations[d.id];
              return (
                <div key={d.id} className="p-3 bg-theme-bg rounded-xl border border-theme-border flex justify-between items-center hover:border-primary/50 transition cursor-pointer" onClick={() => {
                  if (loc && mapRef.current) {
                    mapRef.current.panTo([loc.lat, loc.lng]);
                    mapRef.current.setZoom(16);
                  }
                }}>
                  <div>
                    <h4 className="text-xs font-black text-theme-text">{d.name}</h4>
                    <p className="text-[10px] font-bold text-theme-muted mt-0.5">{d.phone}</p>
                    {loc && (
                      <p className="text-[9px] font-bold text-theme-muted mt-1 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(loc.lastUpdated).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                      d.availability === 'available' ? 'bg-green-500/10 text-green-500' :
                      d.availability === 'busy' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-theme-border text-theme-muted'
                    }`}>
                      {d.availability || 'offline'}
                    </span>
                    {loc?.status === 'gps_disabled' && <AlertTriangle size={12} className="text-red-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 bg-theme-card border border-theme-border rounded-3xl overflow-hidden shadow-sm relative">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};
