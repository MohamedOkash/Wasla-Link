import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { Bike, Check, X, Ban, RefreshCw, Phone, Star, ShieldAlert, Trash2, Eye, Users, Clock, Activity } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { collection, query, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { driverRepository } from "../../services/driver/repository";

export const DriverManagement: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL, showToast, currentUser } = useApp();
  const [activeFilter, setActiveFilter] = useState<'approved' | 'pending' | 'suspended' | 'rejected'>('approved');
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const q = query(collection(db, 'drivers'));
    const unsub = onSnapshot(q, snap => {
      setDrivers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error('Drivers error:', err));
    return () => unsub();
  }, [currentUser]);

  const handleApprove = async (driver: any) => {
    try {
      await import('../../services/admin/service').then(m => m.adminService.approveDriver(driver.id, driver.vehicleType));
      showToast(t('str_534'));
    } catch (error) {
      console.error(error);
      showToast(t('str_535'), 'error');
    }
  };

  const handleReject = async (driverId: string) => {
    try {
      await driverRepository.update(driverId, { status: 'rejected' });
      showToast(t('str_536'));
    } catch (error) {
      console.error(error);
      showToast(t('str_537'), 'error');
    }
  };

  const handleSuspend = async (driverId: string) => {
    try {
      await driverRepository.update(driverId, { 
        status: 'suspended',
        isActive: false,
        availability: 'offline'
      });
      showToast(t('str_538'));
    } catch (error) {
      console.error(error);
      showToast(t('str_537'), 'error');
    }
  };

  const handleReactivate = async (driverId: string) => {
    try {
      await driverRepository.update(driverId, { 
        status: 'approved',
        isActive: true
      });
      showToast(t('str_539'));
    } catch (error) {
      console.error(error);
      showToast(t('str_537'), 'error');
    }
  };

  const filteredDrivers = drivers.filter(d => d.status === activeFilter);

  const stats = {
    total: drivers.filter(d => d.status === 'approved').length,
    online: drivers.filter(d => d.status === 'approved' && d.availability === 'online').length,
    busy: drivers.filter(d => d.status === 'approved' && d.availability === 'busy').length,
    pending: drivers.filter(d => d.status === 'pending').length,
  };

  return (
    <div className="space-y-5 text-theme-text pb-[120px]">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-theme-card p-4 rounded-2xl border border-theme-border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] text-theme-muted font-bold">{t('str_540')}</p>
            <p className="font-black text-lg">{stats.total}</p>
          </div>
        </div>
        <div className="bg-theme-card p-4 rounded-2xl border border-theme-border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/10 text-green-500 flex items-center justify-center rounded-xl">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[10px] text-theme-muted font-bold">{t('str_541')}</p>
            <p className="font-black text-lg">{stats.online}</p>
          </div>
        </div>
        <div className="bg-theme-card p-4 rounded-2xl border border-theme-border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-xl">
            <Bike size={20} />
          </div>
          <div>
            <p className="text-[10px] text-theme-muted font-bold">{t('str_542')}</p>
            <p className="font-black text-lg">{stats.busy}</p>
          </div>
        </div>
        <div className="bg-theme-card p-4 rounded-2xl border border-theme-border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 text-blue-500 flex items-center justify-center rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] text-theme-muted font-bold">{t('str_543')}</p>
            <p className="font-black text-lg">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-theme-card p-1 rounded-2xl border border-theme-border shadow-sm flex gap-1 theme-transition overflow-x-auto no-scrollbar">
        {[
          { id: 'approved', label: t('str_544') },
          { id: 'pending', label: t('str_545') },
          { id: 'rejected', label: t('str_546') },
          { id: 'suspended', label: t('str_547') }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`flex-1 min-w-[80px] py-2.5 text-xs font-black rounded-xl transition ${
              activeFilter === tab.id 
                ? 'bg-primary text-white shadow-sm font-black' 
                : 'text-theme-muted hover:text-theme-text hover:bg-theme-border/50'
            }`}
          >
            {tab.label} ({drivers.filter(d => d.status === tab.id).length})
          </button>
        ))}
      </div>

      {/* Driver List Card */}
      <div className="bg-theme-card rounded-[30px] border border-theme-border p-5 shadow-sm space-y-4 animate-fade-in theme-transition">
        <h3 className="font-black text-theme-text text-sm flex items-center gap-2 border-b border-theme-border/60 pb-2.5">
          <Bike size={18} className="text-primary" />
          {t('str_548')}
        </h3>

        {filteredDrivers.length === 0 ? (
          <div className="bg-theme-bg p-6 rounded-2xl border border-theme-border text-center text-theme-muted font-bold theme-transition flex flex-col items-center">
            <div className="w-12 h-12 bg-theme-border/30 rounded-full flex items-center justify-center mb-3">
              <ShieldAlert size={20} className="text-theme-muted" />
            </div>
            <p className="text-sm">{t('str_549')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrivers.map(driver => (
              <div key={driver.id} className="p-4 rounded-2xl border border-theme-border/60 bg-theme-bg/50 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-black text-lg flex-shrink-0">
                    {driver.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-sm text-theme-text flex items-center gap-2">
                      {driver.name}
                      {driver.status === 'approved' && (
                        <span className={`w-2 h-2 rounded-full inline-block ${
                          driver.availability === 'online' ? 'bg-green-500 animate-pulse' : 
                          driver.availability === 'busy' ? 'bg-amber-500' : 'bg-theme-border'
                        }`} title={driver.availability} />
                      )}
                    </h4>
                    <p className="text-xs text-theme-muted font-bold mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1"><Phone size={12} /> {driver.phone}</span>
                      <span>• {driver.vehicleType}</span>
                    </p>
                    <p className="text-xs text-theme-muted font-bold mt-1 flex items-center gap-1 text-amber-500 font-sans">
                      <Star size={12} className="fill-amber-500" /> {driver.rating} ({driver.completedOrders} {t('str_550')})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-theme-border/60">
                  {driver.status === 'pending' && (
                    <>
                      <button
                        onClick={() => window.open(driver.nationalIdImage, '_blank')}
                        className="flex-1 bg-blue-500/10 text-blue-500 py-2 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition flex items-center justify-center gap-1 text-xs font-black"
                      >
                        <Eye size={14} />{t('str_557')}</button>
                      <button
                        onClick={() => window.open(driver.licenseImage, '_blank')}
                        className="flex-1 bg-blue-500/10 text-blue-500 py-2 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition flex items-center justify-center gap-1 text-xs font-black"
                      >
                        <Eye size={14} />{t('str_558')}</button>
                    </>
                  )}
                  {driver.status === 'approved' && (
                    <div className="flex-1 text-xs font-black text-green-500 bg-green-500/10 py-2 rounded-xl text-center border border-green-500/20">
                      {t('str_551')}
                    </div>
                  )}
                  {driver.status === 'rejected' && (
                    <div className="flex-1 text-xs font-black text-red-500 bg-red-500/10 py-2 rounded-xl text-center border border-red-500/20">
                      {t('str_552')}
                    </div>
                  )}
                  {driver.status === 'suspended' && (
                    <div className="flex-1 text-xs font-black text-amber-500 bg-amber-500/10 py-2 rounded-xl text-center border border-amber-500/20">
                      {t('str_553')}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {driver.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(driver)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl shadow-md transition flex items-center justify-center gap-1 text-xs font-black"
                      >
                        <Check size={14} /> {t('str_159')}
                      </button>
                      <button
                        onClick={() => handleReject(driver.id)}
                        className="flex-[0.5] bg-red-500/10 text-red-500 border border-red-500/20 py-2 rounded-xl hover:bg-red-500/20 transition flex items-center justify-center"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}

                  {driver.status === 'approved' && (
                    <button
                      onClick={() => handleSuspend(driver.id)}
                      className="flex-1 bg-amber-500/10 border border-amber-500/20 py-2 rounded-xl text-amber-500 hover:bg-amber-500/20 transition flex items-center justify-center gap-1 text-xs font-black"
                    >
                      <Ban size={14} /> {t('str_554')}
                    </button>
                  )}

                  {driver.status === 'suspended' && (
                    <button
                      onClick={() => handleReactivate(driver.id)}
                      className="flex-1 bg-green-500/10 border border-green-500/20 py-2 rounded-xl text-green-500 hover:bg-green-500/20 transition flex items-center justify-center gap-1 text-xs font-black"
                    >
                      <RefreshCw size={14} /> {t('str_555')}
                    </button>
                  )}
                  
                  {(driver.status === 'rejected' || driver.status === 'suspended') && (
                     <button
                     onClick={() => handleApprove(driver)}
                     className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl shadow-md transition flex items-center justify-center gap-1 text-xs font-black"
                   >
                     <Check size={14} /> {t('str_556')}
                   </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default DriverManagement;
