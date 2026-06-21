import React, { useState, useEffect } from 'react';
import { Bike, Check, X, Ban, RefreshCw, Phone, Star, ShieldAlert, Trash2, Eye } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const DriverManagement: React.FC = () => {
  const { drivers, setDrivers, updateDriverStatus, isRTL, showToast } = useApp();
  const [activeFilter, setActiveFilter] = useState<'approved' | 'pending' | 'suspended'>('approved');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'driverRequests'), where('status', '==', 'pending'));
    const unsub = onSnapshot(q, snap => {
      setPendingRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error('Driver requests error:', err));
    return () => unsub();
  }, []);

  const handleApproveRequest = async (request: any) => {
    try {
      const batch = writeBatch(db);
      // 1. Update user role
      batch.update(doc(db, 'users', request.userId), {
        role: 'driver',
        vehicleType: request.vehicleType,
        isOnline: true,
        status: 'approved'
      });
      // 2. Mark request as approved
      batch.update(doc(db, 'driverRequests', request.id), {
        status: 'approved'
      });
      await batch.commit();
      showToast(isRTL ? 'تم تفعيل حساب المندوب بنجاح' : 'Driver account activated successfully');
    } catch (error) {
      console.error(error);
      showToast(isRTL ? 'حدث خطأ أثناء التفعيل' : 'Error activating driver', 'error');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'driverRequests', requestId), { status: 'rejected' });
      showToast(isRTL ? 'تم رفض الطلب' : 'Request rejected');
    } catch (error) {
      console.error(error);
      showToast(isRTL ? 'حدث خطأ' : 'Error', 'error');
    }
  };

  const handleDeleteDriver = (id: string) => {
    if (confirm(isRTL ? 'هل أنت متأكد من حذف هذا السائق نهائياً من النظام؟' : 'Are you sure you want to delete this driver permanently?')) {
      setDrivers(prev => prev.filter(d => d.id !== id));
      showToast(isRTL ? 'تم حذف السائق بنجاح' : 'Driver deleted successfully');
    }
  };

  return (
    <div className="space-y-5 text-theme-text">
      {/* Filter Tabs */}
      <div className="bg-theme-card p-1 rounded-2xl border border-theme-border shadow-sm flex gap-1 theme-transition">
        {[
          { id: 'approved', label: isRTL ? 'المعتمدين' : 'Approved' },
          { id: 'pending', label: isRTL ? 'قيد الانتظار' : 'Pending' },
          { id: 'suspended', label: isRTL ? 'الموقوفين' : 'Suspended' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition ${
              activeFilter === tab.id 
                ? 'bg-primary text-white shadow-sm font-black' 
                : 'text-theme-muted hover:text-theme-text'
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

        {(activeFilter === 'pending' ? pendingRequests.length === 0 : filteredDrivers.length === 0) ? (
          <div className="bg-theme-bg p-6 rounded-2xl border border-theme-border text-center text-theme-muted font-bold theme-transition">
            <ShieldAlert size={20} className="mx-auto mb-2 text-theme-muted" />
            <p className="text-xs">{isRTL ? 'لا يوجد مناديب في هذا القسم حالياً' : 'No drivers registered under this section.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-theme-border/60">
            {(activeFilter === 'pending' ? pendingRequests : filteredDrivers).map(driver => (
              <div key={driver.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black text-xs flex-shrink-0">
                    {driver.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-theme-text flex items-center gap-1.5">
                      {driver.name}
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${driver.isOnline ? 'bg-green-500 animate-pulse' : 'bg-theme-border'}`} title={driver.isOnline ? 'نشط الآن' : 'غير متصل'} />
                    </h4>
                    <p className="text-[9px] text-theme-muted font-bold mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                      <span className="flex items-center gap-0.5"><Phone size={10} /> {driver.phone}</span>
                      <span>• {driver.vehicleType}</span>
                      <span className="flex items-center gap-0.5 text-amber-500 font-sans"><Star size={10} className="fill-amber-500" /> {driver.rating}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {driver.status === 'pending' && (
                    <div className="flex gap-1.5">
                      {activeFilter === 'pending' && driver.documents && (
                        <button
                          onClick={() => window.open(driver.documents.idCardUrl, '_blank')}
                          className="bg-blue-500/10 text-blue-500 p-2 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition"
                          title={isRTL ? 'عرض المستندات' : 'View Docs'}
                        >
                          <Eye size={14} strokeWidth={3} />
                        </button>
                      )}
                      <button
                        onClick={() => handleApproveRequest(driver)}
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-xl shadow-md transition"
                        title={isRTL ? 'قبول وتفعيل' : 'Approve'}
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => handleRejectRequest(driver.id)}
                        className="bg-red-500/10 text-red-500 border border-red-500/20 p-2 rounded-xl hover:bg-red-500/20 transition"
                        title={isRTL ? 'رفض الطلب' : 'Reject'}
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    </div>
                  )}

                  {driver.status === 'approved' && (
                    <div className="flex gap-1.5 items-center">
                      <button
                        onClick={() => updateDriverStatus(driver.id, 'suspended')}
                        className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 hover:bg-amber-500/20 transition"
                        title={isRTL ? 'تعليق نشاط السائق' : 'Suspend Driver'}
                      >
                        <Ban size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteDriver(driver.id)}
                        className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 hover:bg-red-500/20 transition"
                        title={isRTL ? 'حذف نهائياً' : 'Delete Permanent'}
                      >
                        <Trash2 size={12} />
                      </button>
                      <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-lg border border-green-500/20">
                        {isRTL ? 'معتمد' : 'Approved'}
                      </span>
                    </div>
                  )}

                  {driver.status === 'suspended' && (
                    <div className="flex gap-1.5 items-center">
                      <button
                        onClick={() => updateDriverStatus(driver.id, 'approved')}
                        className="p-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 hover:bg-green-500/20 transition flex items-center gap-1 text-[10px] font-black"
                        title={isRTL ? 'تنشيط وإعادة الخدمة' : 'Reactivate Driver'}
                      >
                        <RefreshCw size={10} />
                        {isRTL ? 'تنشيط' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteDriver(driver.id)}
                        className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 hover:bg-red-500/20 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                      <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20">
                        {isRTL ? 'موقوف' : 'Suspended'}
                      </span>
                    </div>
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
