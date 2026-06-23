import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Order } from '../../types/order.types';
import { db } from '../../services/firebase';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { Bike, Clock, CheckCircle, Package, Navigation, AlertCircle } from 'lucide-react';
import etaService from '../../services/eta.service';

interface VendorDeliveryCenterProps {
  order: Order;
  storeLocation: { lat: number; lng: number };
}

export const VendorDeliveryCenter: React.FC<VendorDeliveryCenterProps> = ({ order, storeLocation }) => {
  const { isRTL } = useApp();
  const [driverLoc, setDriverLoc] = useState<{lat: number, lng: number} | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [eta, setEta] = useState<number | null>(null);

  useEffect(() => {
    if (!order.driverId && !order.assignedDriverId) return;
    const dId = order.driverId || order.assignedDriverId;
    if (!dId) return;

    const unsub = onSnapshot(doc(db, 'driverLocations', dId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDriverLoc({ lat: data.lat, lng: data.lng });
      }
    });
    return () => unsub();
  }, [order.driverId, order.assignedDriverId]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, `orderHistory/${order.id}/events`), orderBy('timestamp', 'desc')), (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [order.id]);

  useEffect(() => {
    const totalEta = etaService.calculateTotalETA(
      driverLoc, 
      storeLocation, 
      order.location?.coords || null, 
      order.status
    );
    setEta(totalEta);
  }, [driverLoc, storeLocation, order.location, order.status]);

  const steps = [
    { key: 'ready_for_delivery', label: t('str_816'), icon: Clock },
    { key: 'driver_assigned', label: t('str_817'), icon: Bike },
    { key: 'picked_up', label: t('str_137'), icon: Package },
    { key: 'on_the_way', label: t('str_818'), icon: Navigation },
    { key: 'delivered', label: t('str_139'), icon: CheckCircle },
  ];

  const getCurrentStepIndex = () => {
  const {} = useTranslation();

    const s = order.status;
    if (s === 'delivered') return 4;
    if (s === 'on_the_way') return 3;
    if (s === 'picked_up') return 2;
    if (s === 'driver_accepted' || s === 'driver_assigned') return 1;
    return 0;
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="bg-theme-bg-secondary rounded-xl border border-theme-border p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-theme-text text-lg flex items-center gap-2">
          <Navigation className="text-primary w-5 h-5" />
          {t('str_819')}
        </h3>
        {eta && eta > 0 && order.status !== 'delivered' && (
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {eta} {t('str_191')}
          </div>
        )}
      </div>

      {(order.driverName || order.assignedDriverId) && (
        <div className="bg-theme-bg border border-theme-border rounded-lg p-3 mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-theme-secondary">{t('str_820')}</p>
            <p className="font-bold text-theme-text">{order.driverName || 'Assigned Driver'}</p>
            {order.assignmentAttempts ? (
              <p className="text-xs text-orange-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                {t('str_821')}
              </p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-sm text-theme-secondary">{t('str_822')}</p>
            <p className="font-bold text-primary capitalize">{order.status.replace(/_/g, ' ')}</p>
          </div>
        </div>
      )}

      {/* Progress Tracker */}
      <div className="relative flex justify-between mb-8 mt-6">
        <div className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 bg-theme-border z-0" />
        <div 
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-primary z-0 transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx <= currentIndex;
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isActive ? 'bg-primary border-primary text-white' : 'bg-theme-bg border-theme-border text-theme-secondary'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`absolute top-10 text-[10px] whitespace-nowrap ${isActive ? 'text-primary font-bold' : 'text-theme-secondary'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Delivery History */}
      {events.length > 0 && (
        <div className="mt-8">
          <h4 className="text-sm font-bold text-theme-secondary mb-3">{t('str_823')}</h4>
          <div className="space-y-3">
            {events.map((ev, i) => (
              <div key={ev.id} className="flex gap-3 text-sm">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  {i !== events.length - 1 && <div className="w-px h-full bg-theme-border my-1" />}
                </div>
                <div>
                  <p className="text-theme-text font-medium capitalize">{ev.status.replace(/_/g, ' ')}</p>
                  <p className="text-theme-secondary text-xs">{new Date(ev.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
