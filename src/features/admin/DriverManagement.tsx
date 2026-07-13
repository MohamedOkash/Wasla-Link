import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { Bike, Check, X, Ban, RefreshCw, Phone, Star, ShieldAlert, Trash2, Eye, Users, Clock, Activity, Search, MapPin, AlertCircle, DollarSign } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { driverRepository } from "../../services/driver/repository";
import { PremiumInput } from '../../components/premium/PremiumInput';

export const DriverManagement: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL, showToast, currentUser } = useApp();
  const [activeFilter, setActiveFilter] = useState<any>('pending_review');
  const [searchQuery, setSearchQuery] = useState('');
  const [drivers, setDrivers] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [locations, setLocations] = useState<Record<string, any>>({});
  const [driverWallets, setDriverWallets] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const q = query(collection(db, 'drivers'));
    const unsub = onSnapshot(q, snap => {
      setDrivers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error('Drivers error:', err));
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const q = query(collection(db, 'fraudIncidents'));
    const unsub = onSnapshot(q, snap => {
      setIncidents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error('Incidents error:', err));
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const q = query(collection(db, 'driverLocations'));
    const unsub = onSnapshot(q, snap => {
      const locs: Record<string, any> = {};
      snap.docs.forEach(d => {
        locs[d.id] = d.data();
      });
      setLocations(locs);
    }, err => console.error('Locations error:', err));
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const q = query(collection(db, 'driverWallets'));
    const unsub = onSnapshot(q, snap => {
      const w: Record<string, any> = {};
      snap.docs.forEach(d => {
        w[d.id] = d.data();
      });
      setDriverWallets(w);
    }, err => console.error('Wallets error:', err));
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
            { id: 'rejected', label: 'Rejected', count: drivers.filter(d => d.status === 'rejected').length },
            { id: 'monitor', label: 'Live Monitor', count: drivers.filter(d => d.availability && d.availability !== 'offline').length },
            { id: 'cash', label: 'Cash Reconcile', count: drivers.filter(d => d.status === 'approved').length },
            { id: 'fraud', label: 'Fraud Incidents', count: incidents.length }
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

      {/* Monitor Sub-View */}
      {activeFilter === 'monitor' && (
        <div className="bg-theme-card rounded-[30px] border border-theme-border p-5 shadow-sm space-y-4 animate-fade-in theme-transition">
          <h3 className="font-black text-theme-text text-sm flex items-center gap-2 border-b border-theme-border/60 pb-2.5">
            <Activity size={18} className="text-primary" />
            Active Drivers Monitor
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.filter(d => d.availability && d.availability !== 'offline').map(d => {
              const loc = locations[d.id];
              return (
                <div key={d.id} className="p-4 bg-theme-bg/50 border border-theme-border/60 rounded-2xl shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <h5 className="font-black text-sm text-theme-text">{d.name}</h5>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                      d.availability === 'busy' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      d.availability === 'delivering' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                      'bg-green-500/10 text-green-500 border border-green-500/20'
                    }`}>
                      {d.availability}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-theme-muted space-y-1.5">
                    <p>📍 Location: {loc ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}` : 'No GPS Signal'}</p>
                    <p>🔋 Battery Level: {d.batteryLevel ? `${d.batteryLevel}%` : 'N/A'}</p>
                    <p>⚡ Current Speed: {loc?.speed ? `${(loc.speed * 3.6).toFixed(0)} km/h` : '0 km/h'}</p>
                    <p>🕒 Last Update: {loc?.lastUpdated ? new Date(loc.lastUpdated).toLocaleTimeString() : 'N/A'}</p>
                  </div>
                  {loc && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-primary text-white text-[10px] font-black py-2.5 rounded-xl text-center block"
                    >
                      View on Google Maps
                    </a>
                  )}
                </div>
              );
            })}
            {drivers.filter(d => d.availability && d.availability !== 'offline').length === 0 && (
              <div className="col-span-full p-6 text-center text-theme-muted font-bold text-xs">No active drivers online</div>
            )}
          </div>
        </div>
      )}

      {/* Cash Reconciliation Sub-View */}
      {activeFilter === 'cash' && (
        <div className="bg-theme-card rounded-[30px] border border-theme-border p-5 shadow-sm space-y-4 animate-fade-in theme-transition">
          <h3 className="font-black text-theme-text text-sm flex items-center gap-2 border-b border-theme-border/60 pb-2.5">
            <DollarSign size={18} className="text-primary" />
            Driver Cash Handover & Reconciliation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drivers.filter(d => d.status === 'approved').map(d => {
              const dWallet = driverWallets[d.id] || {};
              const remaining = dWallet.cashRemaining || 0;
              return (
                <div key={d.id} className="p-4 bg-theme-bg/50 border border-theme-border/60 rounded-2xl shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <h5 className="font-black text-sm text-theme-text">{d.name}</h5>
                    <span className="text-xs font-black text-theme-muted">Remaining: {remaining.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      id={`recon_amt_${d.id}`}
                      defaultValue={remaining}
                      max={remaining}
                      min={1}
                      placeholder="Amount in EGP"
                      className="flex-1 bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-xs font-bold text-theme-text"
                    />
                    <button
                      onClick={async () => {
                        const input = document.getElementById(`recon_amt_${d.id}`) as HTMLInputElement;
                        const amt = parseFloat(input?.value || '0');
                        if (isNaN(amt) || amt <= 0 || amt > remaining) {
                          showToast('Enter a valid amount', 'warning');
                          return;
                        }
                        try {
                          const { functions } = await import('../../services/firebase');
                          const { httpsCallable } = await import('firebase/functions');
                          const reconcileFn = httpsCallable(functions, 'reconcileDriverCash');
                          await reconcileFn({ driverId: d.id, amount: amt });
                          showToast('Cash reconciled successfully');
                        } catch (err: any) {
                          console.error(err);
                          showToast(err.message || 'Failed to reconcile cash', 'error');
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-black px-4 py-2 rounded-xl transition"
                    >
                      Reconcile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fraud Incidents Sub-View */}
      {activeFilter === 'fraud' && (
        <div className="bg-theme-card rounded-[30px] border border-theme-border p-5 shadow-sm space-y-4 animate-fade-in theme-transition">
          <h3 className="font-black text-theme-text text-sm flex items-center gap-2 border-b border-theme-border/60 pb-2.5">
            <ShieldAlert size={18} className="text-red-500" />
            Security Fraud Incidents Log
          </h3>
          <div className="bg-theme-bg/30 border border-theme-border/50 rounded-2xl overflow-hidden shadow-sm divide-y divide-theme-border/60">
            {incidents.length === 0 ? (
              <div className="p-6 text-center text-theme-muted font-bold text-xs">No fraud incidents logged</div>
            ) : (
              incidents.map((inc) => (
                <div key={inc.id} className="p-4 flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center font-black">
                    <span className="text-red-500 uppercase tracking-wider font-mono">{inc.type}</span>
                    <span className="text-[10px] text-theme-muted">{new Date(inc.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-theme-text font-bold mt-1">Driver ID: <span className="font-mono">{inc.driverId}</span></p>
                  <p className="text-theme-muted font-bold mt-0.5">{inc.details}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Standard Driver Applications View */}
      {activeFilter !== 'monitor' && activeFilter !== 'cash' && activeFilter !== 'fraud' && (
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

                  <div className="flex flex-wrap gap-2">
                    {driver.status === 'approved' && (
                      <div className="flex-1 text-xs font-black text-green-500 bg-green-500/10 py-2 rounded-xl text-center border border-green-500/20">
                        Approved
                      </div>
                    )}
                    {driver.status === 'pending_review' && (
                      <div className="flex-1 text-xs font-black text-amber-500 bg-amber-500/10 py-2 rounded-xl text-center border border-amber-500/20">
                        Pending Review
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
      )}
    </div>
  );
};
export default DriverManagement;
