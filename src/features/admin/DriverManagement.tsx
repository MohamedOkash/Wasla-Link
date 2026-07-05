import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { Bike, Check, X, Ban, RefreshCw, Phone, Star, ShieldAlert, Trash2, Eye, Users, Clock, Activity, Search, MapPin, AlertCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { driverRepository } from "../../services/driver/repository";
import { PremiumInput } from '../../components/premium/PremiumInput';

export const DriverManagement: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL, showToast, currentUser } = useApp();
  const [activeFilter, setActiveFilter] = useState<'approved' | 'pending_review' | 'needs_documents' | 'blocked' | 'rejected'>('pending_review');
  const [searchQuery, setSearchQuery] = useState('');
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
      showToast(t('str_534') || 'Driver approved successfully');
    } catch (error) {
      console.error(error);
      showToast(t('str_535') || 'Failed to approve driver', 'error');
    }
  };

  const handleReject = async (driverId: string) => {
    try {
      await driverRepository.update(driverId, { status: 'rejected' });
      showToast(t('str_536') || 'Driver rejected');
    } catch (error) {
      console.error(error);
      showToast(t('str_537') || 'Error', 'error');
    }
  };

  const handleRequestDocs = async (driverId: string) => {
    const requested = prompt('Enter requested documents (comma separated):', 'National ID Image,Driving License');
    const reviewNote = prompt('Enter a note for the driver:');
    
    if (requested && reviewNote) {
      try {
        await driverRepository.update(driverId, { 
          status: 'needs_documents',
          verificationRequest: {
            status: 'needs_documents',
            requestedDocuments: requested.split(',').map(s => s.trim()),
            reviewNote,
            requestedBy: currentUser?.uid,
            requestedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        });
        showToast('Requested more documents successfully');
      } catch (error) {
        console.error(error);
        showToast('Error', 'error');
      }
    }
  };

  const handleSuspend = async (driverId: string) => {
    try {
      await driverRepository.update(driverId, { 
        status: 'blocked',
        isActive: false,
        availability: 'offline'
      });
      showToast('Driver account blocked', 'success');
    } catch (error) {
      console.error(error);
      showToast(t('str_537') || 'Error', 'error');
    }
  };

  const handleReactivate = async (driverId: string) => {
    try {
      await driverRepository.update(driverId, { 
        status: 'approved',
        isActive: true,
        availability: 'online'
      });
      showToast('Driver reactivated');
    } catch (error) {
      console.error(error);
      showToast(t('str_537') || 'Error', 'error');
    }
  };

  const filteredDrivers = drivers.filter(d => {
    // Treat 'pending' (old state) as 'pending_review'
    const status = d.status === 'pending' ? 'pending_review' : d.status;
    const matchStatus = status === activeFilter;
    
    if (!matchStatus) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = d.name?.toLowerCase().includes(q);
      const matchPhone = d.phone?.includes(q);
      const matchGov = d.governorate?.toLowerCase().includes(q);
      const matchMethod = d.deliveryMethod?.toLowerCase().includes(q);
      return matchName || matchPhone || matchGov || matchMethod;
    }
    return true;
  });

  const stats = {
    total: drivers.filter(d => d.status === 'approved').length,
    online: drivers.filter(d => d.status === 'approved' && d.availability === 'online').length,
    pending: drivers.filter(d => d.status === 'pending' || d.status === 'pending_review').length,
    needsDocs: drivers.filter(d => d.status === 'needs_documents').length,
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
            <p className="text-[10px] text-theme-muted font-bold">Total Approved</p>
            <p className="font-black text-lg">{stats.total}</p>
          </div>
        </div>
        <div className="bg-theme-card p-4 rounded-2xl border border-theme-border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/10 text-green-500 flex items-center justify-center rounded-xl">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[10px] text-theme-muted font-bold">Online</p>
            <p className="font-black text-lg">{stats.online}</p>
          </div>
        </div>
        <div className="bg-theme-card p-4 rounded-2xl border border-theme-border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] text-theme-muted font-bold">Pending Review</p>
            <p className="font-black text-lg">{stats.pending}</p>
          </div>
        </div>
        <div className="bg-theme-card p-4 rounded-2xl border border-theme-border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 text-blue-500 flex items-center justify-center rounded-xl">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] text-theme-muted font-bold">Needs Docs</p>
            <p className="font-black text-lg">{stats.needsDocs}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Tabs */}
      <div className="space-y-4">
        <PremiumInput
          leftIcon={<Search size={18} />}
          placeholder="Search by name, phone, governorate, method..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />

        <div className="bg-theme-card p-1 rounded-2xl border border-theme-border shadow-sm flex gap-1 theme-transition overflow-x-auto no-scrollbar">
          {[
            { id: 'pending_review', label: 'Pending Review', count: stats.pending },
            { id: 'needs_documents', label: 'Needs Docs', count: stats.needsDocs },
            { id: 'approved', label: 'Approved', count: stats.total },
            { id: 'blocked', label: 'Blocked', count: drivers.filter(d => d.status === 'blocked').length },
            { id: 'rejected', label: 'Rejected', count: drivers.filter(d => d.status === 'rejected').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`flex-1 min-w-[100px] py-2.5 text-xs font-black rounded-xl transition ${
                activeFilter === tab.id 
                  ? 'bg-primary text-white shadow-sm font-black' 
                  : 'text-theme-muted hover:text-theme-text hover:bg-theme-border/50'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Driver List Card */}
      <div className="bg-theme-card rounded-[30px] border border-theme-border p-5 shadow-sm space-y-4 animate-fade-in theme-transition">
        <h3 className="font-black text-theme-text text-sm flex items-center gap-2 border-b border-theme-border/60 pb-2.5">
          <Bike size={18} className="text-primary" />
          Driver Applications
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
                  {driver.status === 'approved' && (
                    <div className="flex-1 text-xs font-black text-green-500 bg-green-500/10 py-2 rounded-xl text-center border border-green-500/20">
                      Approved
                    </div>
                  )}
                  {driver.status === 'rejected' && (
                    <div className="flex-1 text-xs font-black text-red-500 bg-red-500/10 py-2 rounded-xl text-center border border-red-500/20">
                      Rejected
                    </div>
                  )}
                  {driver.status === 'blocked' && (
                    <div className="flex-1 text-xs font-black text-amber-500 bg-amber-500/10 py-2 rounded-xl text-center border border-amber-500/20">
                      Blocked
                    </div>
                  )}
                  {driver.status === 'needs_documents' && (
                    <div className="flex-1 text-xs font-black text-blue-500 bg-blue-500/10 py-2 rounded-xl text-center border border-blue-500/20">
                      Waiting for Documents
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      if (driver.nationalIdImageUrl) window.open(driver.nationalIdImageUrl, '_blank');
                      else if (driver.nationalIdImage) window.open(driver.nationalIdImage, '_blank');
                      else showToast('No ID uploaded', 'warning');
                    }}
                    className="flex-1 bg-blue-500/10 text-blue-500 py-2 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition flex items-center justify-center gap-1 text-xs font-black"
                  >
                    <Eye size={14} /> ID
                  </button>
                  <button
                    onClick={() => {
                      if (driver.drivingLicenseUrl) window.open(driver.drivingLicenseUrl, '_blank');
                      else if (driver.licenseImage) window.open(driver.licenseImage, '_blank');
                      else showToast('No License uploaded', 'warning');
                    }}
                    className="flex-1 bg-blue-500/10 text-blue-500 py-2 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition flex items-center justify-center gap-1 text-xs font-black"
                  >
                    <Eye size={14} /> License
                  </button>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {(driver.status === 'pending' || driver.status === 'pending_review' || driver.status === 'needs_documents') && (
                    <>
                      <button
                        onClick={() => handleApprove(driver)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl shadow-md transition flex items-center justify-center gap-1 text-xs font-black min-w-[80px]"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleRequestDocs(driver.id)}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl shadow-md transition flex items-center justify-center gap-1 text-xs font-black min-w-[120px]"
                      >
                        <AlertCircle size={14} /> Request Docs
                      </button>
                      <button
                        onClick={() => handleReject(driver.id)}
                        className="w-10 bg-red-500/10 text-red-500 border border-red-500/20 py-2 rounded-xl hover:bg-red-500/20 transition flex items-center justify-center shrink-0"
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
                      <Ban size={14} /> Block
                    </button>
                  )}

                  {driver.status === 'blocked' && (
                    <button
                      onClick={() => handleReactivate(driver.id)}
                      className="flex-1 bg-green-500/10 border border-green-500/20 py-2 rounded-xl text-green-500 hover:bg-green-500/20 transition flex items-center justify-center gap-1 text-xs font-black"
                    >
                      <RefreshCw size={14} /> Reactivate
                    </button>
                  )}
                  
                  {(driver.status === 'rejected' || driver.status === 'blocked') && (
                     <button
                     onClick={() => handleApprove(driver)}
                     className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl shadow-md transition flex items-center justify-center gap-1 text-xs font-black"
                   >
                     <Check size={14} /> Approve
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
