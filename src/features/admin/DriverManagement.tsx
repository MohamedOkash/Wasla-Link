import React, { useState, useEffect } from 'react';
import { Bike, Check, X, Ban, RefreshCw, Phone, Star, ShieldAlert, Trash2, Eye, Users, Clock, Activity } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { collection, query, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const DriverManagement: React.FC = () => {
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
      const batch = writeBatch(db);
      // 1. Update user role
      batch.update(doc(db, 'users', driver.id), {
        role: 'driver',
        vehicleType: driver.vehicleType,
      });
      // 2. Mark driver as approved and active
      batch.update(doc(db, 'drivers', driver.id), {
        status: 'approved',
        isApproved: true,
        isActive: true,
        availability: 'offline' // they start offline after approval
      });
      await batch.commit();
      showToast(isRTL ? 'تم تفعيل حساب المندوب بنجاح' : 'Driver account activated successfully');
    } catch (error) {
      console.error(error);
      showToast(isRTL ? 'حدث خطأ أثناء التفعيل' : 'Error activating driver', 'error');
    }
  };

  const handleReject = async (driverId: string) => {
    try {
      await updateDoc(doc(db, 'drivers', driverId), { status: 'rejected' });
      showToast(isRTL ? 'تم رفض الطلب' : 'Request rejected');
    } catch (error) {
      console.error(error);
      showToast(isRTL ? 'حدث خطأ' : 'Error', 'error');
    }
  };

  const handleSuspend = async (driverId: string) => {
    try {
      await updateDoc(doc(db, 'drivers', driverId), { 
        status: 'suspended',
        isActive: false,
        availability: 'offline'
      });
      showToast(isRTL ? 'تم تعليق حساب المندوب' : 'Driver account suspended');
    } catch (error) {
      console.error(error);
      showToast(isRTL ? 'حدث خطأ' : 'Error', 'error');
    }
  };

  const handleReactivate = async (driverId: string) => {
    try {
      await updateDoc(doc(db, 'drivers', driverId), { 
        status: 'approved',
        isActive: true
      });
      showToast(isRTL ? 'تم إعادة تفعيل الحساب' : 'Account reactivated');
    } catch (error) {
      console.error(error);
      showToast(isRTL ? 'حدث خطأ' : 'Error', 'error');
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
            <p className="text-[10px] text-theme-muted font-bold">{isRTL ? 'إجمالي المعتمدين' : 'Total Approved'}</p>
            <p className="font-black text-lg">{stats.total}</p>
          </div>
        </div>
        <div className="bg-theme-card p-4 rounded-2xl border border-theme-border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/10 text-green-500 flex items-center justify-center rounded-xl">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[10px] text-theme-muted font-bold">{isRTL ? 'متاح أونلاين' : 'Online'}</p>
            <p className="font-black text-lg">{stats.online}</p>
          </div>
        </div>
        <div className="bg-theme-card p-4 rounded-2xl border border-theme-border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-xl">
            <Bike size={20} />
          </div>
          <div>
            <p className="text-[10px] text-theme-muted font-bold">{isRTL ? 'مشغول بتوصيلة' : 'Busy'}</p>
            <p className="font-black text-lg">{stats.busy}</p>
          </div>
        </div>
        <div className="bg-theme-card p-4 rounded-2xl border border-theme-border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 text-blue-500 flex items-center justify-center rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] text-theme-muted font-bold">{isRTL ? 'طلبات قيد الانتظار' : 'Pending Req'}</p>
            <p className="font-black text-lg">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-theme-card p-1 rounded-2xl border border-theme-border shadow-sm flex gap-1 theme-transition overflow-x-auto no-scrollbar">
        {[
          { id: 'approved', label: isRTL ? 'المعتمدين' : 'Approved' },
          { id: 'pending', label: isRTL ? 'قيد الانتظار' : 'Pending' },
          { id: 'rejected', label: isRTL ? 'المرفوضين' : 'Rejected' },
          { id: 'suspended', label: isRTL ? 'الموقوفين' : 'Suspended' }
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
          {isRTL ? 'إدارة مناديب التوصيل' : 'Delivery Drivers Management'}
        </h3>

        {filteredDrivers.length === 0 ? (
          <div className="bg-theme-bg p-6 rounded-2xl border border-theme-border text-center text-theme-muted font-bold theme-transition flex flex-col items-center">
            <div className="w-12 h-12 bg-theme-border/30 rounded-full flex items-center justify-center mb-3">
              <ShieldAlert size={20} className="text-theme-muted" />
            </div>
            <p className="text-sm">{isRTL ? 'لا توجد بيانات' : 'No data available in this section.'}</p>
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
                      <Star size={12} className="fill-amber-500" /> {driver.rating} ({driver.completedOrders} {isRTL ? 'طلب' : 'orders'})
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
                        <Eye size={14} /> الهوية
                      </button>
                      <button
                        onClick={() => window.open(driver.licenseImage, '_blank')}
                        className="flex-1 bg-blue-500/10 text-blue-500 py-2 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition flex items-center justify-center gap-1 text-xs font-black"
                      >
                        <Eye size={14} /> الرخصة
                      </button>
                    </>
                  )}
                  {driver.status === 'approved' && (
                    <div className="flex-1 text-xs font-black text-green-500 bg-green-500/10 py-2 rounded-xl text-center border border-green-500/20">
                      {isRTL ? 'معتمد' : 'Approved'}
                    </div>
                  )}
                  {driver.status === 'rejected' && (
                    <div className="flex-1 text-xs font-black text-red-500 bg-red-500/10 py-2 rounded-xl text-center border border-red-500/20">
                      {isRTL ? 'مرفوض' : 'Rejected'}
                    </div>
                  )}
                  {driver.status === 'suspended' && (
                    <div className="flex-1 text-xs font-black text-amber-500 bg-amber-500/10 py-2 rounded-xl text-center border border-amber-500/20">
                      {isRTL ? 'موقوف' : 'Suspended'}
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
                        <Check size={14} /> {isRTL ? 'قبول' : 'Approve'}
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
                      <Ban size={14} /> {isRTL ? 'إيقاف النشاط' : 'Suspend'}
                    </button>
                  )}

                  {driver.status === 'suspended' && (
                    <button
                      onClick={() => handleReactivate(driver.id)}
                      className="flex-1 bg-green-500/10 border border-green-500/20 py-2 rounded-xl text-green-500 hover:bg-green-500/20 transition flex items-center justify-center gap-1 text-xs font-black"
                    >
                      <RefreshCw size={14} /> {isRTL ? 'تنشيط وإعادة الخدمة' : 'Reactivate'}
                    </button>
                  )}
                  
                  {(driver.status === 'rejected' || driver.status === 'suspended') && (
                     <button
                     onClick={() => handleApprove(driver)}
                     className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl shadow-md transition flex items-center justify-center gap-1 text-xs font-black"
                   >
                     <Check size={14} /> {isRTL ? 'تنشيط' : 'Activate'}
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
