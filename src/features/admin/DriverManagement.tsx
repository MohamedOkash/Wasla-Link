import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { Bike, Check, X, Ban, RefreshCw, Phone, Star, ShieldAlert, Eye, Users, Clock, Activity, Search, MapPin, AlertCircle, DollarSign, Plus, Award, FileDown, Edit2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { driverRepository } from "../../services/driver/repository";
import { adminService } from "../../services/admin/service";
import { PremiumInput } from '../../components/premium/PremiumInput';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { EGYPT_REGIONS } from '../auth/AuthScreen';

export const DriverManagement: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL, showToast, currentUser } = useApp();
  const [activeFilter, setActiveFilter] = useState<any>('pending_review');
  const [searchQuery, setSearchQuery] = useState('');
  const [drivers, setDrivers] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [locations, setLocations] = useState<Record<string, any>>({});
  const [driverWallets, setDriverWallets] = useState<Record<string, any>>({});

  // Invite Driver states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteGov, setInviteGov] = useState('الدقهلية');
  const [inviteCity, setInviteCity] = useState('السنبلاوين');
  const [inviteVillage, setInviteVillage] = useState('ميت غراب');
  const [inviteMethod, setInviteMethod] = useState('motorcycle');
  const [inviteResetLink, setInviteResetLink] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Bulk actions states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Inline Settings Editing states
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [editMaxDistance, setEditMaxDistance] = useState(15);
  const [editPreferredAreas, setEditPreferredAreas] = useState('');
  const [editTier, setEditTier] = useState<any>('bronze');
  const [editVehicleClass, setEditVehicleClass] = useState('motorcycle');
  const [editAdminNotes, setEditAdminNotes] = useState('');

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
      await adminService.approveDriver(driver.id, driver.deliveryMethod || 'motorcycle');
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
          } as any
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
        status: 'suspended',
        isActive: false,
        availability: 'offline'
      });
      showToast('Driver account suspended', 'success');
    } catch (error) {
      console.error(error);
      showToast('Error', 'error');
    }
  };

  const handleBlock = async (driverId: string) => {
    try {
      await driverRepository.update(driverId, { 
        status: 'blocked',
        isActive: false,
        availability: 'offline'
      });
      showToast('Driver account blocked', 'success');
    } catch (error) {
      console.error(error);
      showToast('Error', 'error');
    }
  };

  const handleReactivate = async (driverId: string) => {
    try {
      await driverRepository.update(driverId, { 
        status: 'approved',
        isActive: true,
        availability: 'offline'
      });
      showToast('Driver reactivated');
    } catch (error) {
      console.error(error);
      showToast('Error', 'error');
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName || !invitePhone) {
      showToast('Please fill email, name and phone', 'warning');
      return;
    }
    setIsInviting(true);
    try {
      const res: any = await adminService.inviteDriver({
        email: inviteEmail,
        name: inviteName,
        phone: invitePhone,
        governorate: inviteGov,
        city: inviteCity,
        village: inviteVillage,
        deliveryMethod: inviteMethod
      });
      if (res.success) {
        setInviteResetLink(res.resetLink || '');
        showToast('Driver invited successfully', 'success');
      } else {
        showToast('Failed to invite driver', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error inviting driver', 'error');
    } finally {
      setIsInviting(false);
    }
  };

  const handleSaveSettings = async (driverId: string) => {
    try {
      await driverRepository.update(driverId, {
        maxDistance: editMaxDistance,
        preferredAreas: editPreferredAreas.split(',').map(s => s.trim()).filter(Boolean),
        tier: editTier,
        deliveryMethod: editVehicleClass,
        adminNotes: editAdminNotes,
        updatedAt: new Date().toISOString()
      } as any);
      showToast('Settings saved successfully', 'success');
      setEditingDriverId(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to save settings', 'error');
    }
  };

  const startEditing = (driver: any) => {
    setEditingDriverId(driver.id);
    setEditMaxDistance(driver.maxDistance || 15);
    setEditPreferredAreas((driver.preferredAreas || []).join(', '));
    setEditTier(driver.tier || 'bronze');
    setEditVehicleClass(driver.deliveryMethod || 'motorcycle');
    setEditAdminNotes(driver.adminNotes || '');
  };

  // Bulk Actions
  const handleSelectAll = (filtered: any[]) => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(f => f.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map(async id => {
        const d = drivers.find(drv => drv.id === id);
        if (d) await adminService.approveDriver(d.id, d.deliveryMethod || 'motorcycle');
      }));
      showToast('Bulk approved successfully', 'success');
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      showToast('Bulk approval failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map(id => driverRepository.update(id, { status: 'rejected' })));
      showToast('Bulk rejected successfully', 'success');
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      showToast('Bulk rejection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkExport = () => {
    if (selectedIds.length === 0) return;
    const toExport = drivers.filter(d => selectedIds.includes(d.id));
    const headers = 'ID,Name,Phone,Email,Status,Tier,Score,Method,Governorate,City,Village\n';
    const rows = toExport.map(d => `${d.id},"${d.name}","${d.phone}","${d.email || ''}",${d.status},${d.tier},${d.score},${d.deliveryMethod},"${d.governorate}","${d.city}","${d.village}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `drivers_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAvailableCitiesInvite = () => {
    return EGYPT_REGIONS[inviteGov]?.cities ? Object.keys(EGYPT_REGIONS[inviteGov].cities) : ['أخرى'];
  };

  const getAvailableVillagesInvite = () => {
    const cityData = EGYPT_REGIONS[inviteGov]?.cities[inviteCity];
    return cityData || ['أخرى'];
  };

  const checkExpiryAlert = (expiryStr: string) => {
    if (!expiryStr) return false;
    const expiryDate = new Date(expiryStr);
    const diffTime = expiryDate.getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  const filteredDrivers = drivers.filter(d => {
    const status = d.status === 'pending' ? 'pending_review' : d.status;
    
    if (activeFilter === 'online') {
      return status === 'approved' && d.availability && d.availability !== 'offline';
    }
    if (activeFilter === 'offline') {
      return status === 'approved' && (!d.availability || d.availability === 'offline');
    }
    
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
    online: drivers.filter(d => d.status === 'approved' && d.availability && d.availability !== 'offline').length,
    offline: drivers.filter(d => d.status === 'approved' && (!d.availability || d.availability === 'offline')).length,
    pending: drivers.filter(d => d.status === 'pending' || d.status === 'pending_review').length,
    needsDocs: drivers.filter(d => d.status === 'needs_documents').length,
    suspended: drivers.filter(d => d.status === 'suspended').length,
    blocked: drivers.filter(d => d.status === 'blocked').length,
    rejected: drivers.filter(d => d.status === 'rejected').length
  };

  return (
    <div className="space-y-5 text-theme-text pb-[120px] font-sans">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-theme-card p-4 rounded-2xl border border-theme-border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center rounded-xl"><Users size={20} /></div>
          <div>
            <p className="text-[10px] text-theme-muted font-bold">Total Approved</p>
            <p className="font-black text-lg">{stats.total}</p>
          </div>
        </div>
        <div className="bg-theme-card p-4 rounded-2xl border border-theme-border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/10 text-green-500 flex items-center justify-center rounded-xl"><Activity size={20} /></div>
          <div>
            <p className="text-[10px] text-theme-muted font-bold">Online</p>
            <p className="font-black text-lg">{stats.online}</p>
          </div>
        </div>
        <div className="bg-theme-card p-4 rounded-2xl border border-theme-border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-xl"><Clock size={20} /></div>
          <div>
            <p className="text-[10px] text-theme-muted font-bold">Pending Review</p>
            <p className="font-black text-lg">{stats.pending}</p>
          </div>
        </div>
        <div className="bg-theme-card p-4 rounded-2xl border border-theme-border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 text-blue-500 flex items-center justify-center rounded-xl"><AlertCircle size={20} /></div>
          <div>
            <p className="text-[10px] text-theme-muted font-bold">Needs Docs</p>
            <p className="font-black text-lg">{stats.needsDocs}</p>
          </div>
        </div>
      </div>

      {/* Search & Invite Bar */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <PremiumInput
              leftIcon={<Search size={18} />}
              placeholder={isRTL ? "ابحث بالاسم، الهاتف، المحافظة..." : "Search by name, phone, governorate..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setShowInviteModal(true); setInviteResetLink(''); }}
            className="bg-primary hover:bg-primary-hover text-white text-xs font-black px-5 rounded-2xl transition active:scale-95 flex items-center gap-2 shadow-md shrink-0 h-12"
          >
            <Plus size={16} />
            <span>{isRTL ? 'دعوة مندوب' : 'Invite Driver'}</span>
          </button>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="bg-theme-card p-1 rounded-2xl border border-theme-border shadow-sm flex gap-1 theme-transition overflow-x-auto no-scrollbar">
          {[
            { id: 'pending_review', label: 'Pending Review', count: stats.pending },
            { id: 'needs_documents', label: 'Needs Docs', count: stats.needsDocs },
            { id: 'approved', label: 'Approved', count: stats.total },
            { id: 'online', label: 'Online Drivers', count: stats.online },
            { id: 'offline', label: 'Offline Drivers', count: stats.offline },
            { id: 'suspended', label: 'Suspended', count: stats.suspended },
            { id: 'blocked', label: 'Blocked', count: stats.blocked },
            { id: 'rejected', label: 'Rejected', count: stats.rejected },
            { id: 'monitor', label: 'Live Monitor', count: drivers.filter(d => d.availability && d.availability !== 'offline').length },
            { id: 'cash', label: 'Cash Reconcile', count: drivers.filter(d => d.status === 'approved').length },
            { id: 'fraud', label: 'Fraud Incidents', count: incidents.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveFilter(tab.id as any); setSelectedIds([]); }}
              className={`flex-1 min-w-[110px] py-2.5 text-xs font-black rounded-xl transition ${
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

      {/* Bulk actions panel when selection exists */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-center justify-between animate-fade-in">
          <span className="text-xs font-bold text-theme-text">
            {isRTL ? `تم تحديد ${selectedIds.length} مناديب` : `${selectedIds.length} drivers selected`}
          </span>
          <div className="flex gap-2">
            {(activeFilter === 'pending_review' || activeFilter === 'needs_documents') && (
              <button onClick={handleBulkApprove} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white text-xs font-black px-4 py-2 rounded-xl transition">
                {isRTL ? 'قبول المحددين' : 'Bulk Approve'}
              </button>
            )}
            <button onClick={handleBulkReject} disabled={loading} className="bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-black px-4 py-2 rounded-xl transition">
              {isRTL ? 'رفض المحددين' : 'Bulk Reject'}
            </button>
            <button onClick={handleBulkExport} className="bg-theme-card border border-theme-border text-theme-text text-xs font-black px-4 py-2 rounded-xl transition flex items-center gap-1">
              <FileDown size={14} />
              <span>{isRTL ? 'تصدير' : 'Export CSV'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Live Monitor Sub-View */}
      {activeFilter === 'monitor' && (
        <div className="bg-theme-card rounded-[30px] border border-theme-border p-5 shadow-sm space-y-4 animate-fade-in">
          <h3 className="font-black text-theme-text text-sm flex items-center gap-2 border-b border-theme-border/60 pb-2.5">
            <Activity size={18} className="text-primary" />
            Active Drivers Live Monitor
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.filter(d => d.availability && d.availability !== 'offline').map(d => {
              const loc = locations[d.id];
              return (
                <div key={d.id} className="p-4 bg-theme-bg/50 border border-theme-border/60 rounded-2xl shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <h5 className="font-black text-sm text-theme-text">{d.name}</h5>
                    <span className="text-[9px] font-black px-2.5 py-1 rounded-lg uppercase bg-green-500/10 text-green-500 border border-green-500/20">
                      {d.availability}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-theme-muted space-y-1.5">
                    <p>📍 Location: {loc ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}` : 'No GPS'}</p>
                    <p>🔋 Battery: {d.batteryLevel ? `${d.batteryLevel}%` : 'N/A'}</p>
                    <p>⚡ Tier: <span className="capitalize text-primary font-black">{d.tier || 'bronze'}</span> | Score: <span className="text-theme-text font-black">{d.score || 100}</span></p>
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

      {/* Standard Drivers List view */}
      {activeFilter !== 'monitor' && activeFilter !== 'cash' && activeFilter !== 'fraud' && (
        <div className="bg-theme-card rounded-[30px] border border-theme-border p-5 shadow-sm space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-theme-border/60 pb-2.5">
            <h3 className="font-black text-theme-text text-sm flex items-center gap-2">
              <Bike size={18} className="text-primary" />
              <span>{isRTL ? 'قائمة المناديب' : 'Driver Application Records'}</span>
            </h3>
            {filteredDrivers.length > 0 && (
              <button 
                onClick={() => handleSelectAll(filteredDrivers)}
                className="text-xs font-black text-primary hover:underline"
              >
                {selectedIds.length === filteredDrivers.length ? (isRTL ? 'إلغاء تحديد الكل' : 'Deselect All') : (isRTL ? 'تحديد الكل' : 'Select All')}
              </button>
            )}
          </div>

          {filteredDrivers.length === 0 ? (
            <div className="bg-theme-bg p-8 rounded-2xl border border-theme-border text-center text-theme-muted font-bold flex flex-col items-center">
              <div className="w-12 h-12 bg-theme-border/30 rounded-full flex items-center justify-center mb-3">
                <ShieldAlert size={20} className="text-theme-muted" />
              </div>
              <p className="text-sm">{isRTL ? 'لا يوجد مناديب يطابقون الفلترة المحددة' : 'No driver applications found.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDrivers.map(driver => {
                const isSelected = selectedIds.includes(driver.id);
                const isEditing = editingDriverId === driver.id;
                
                const hasNidAlert = checkExpiryAlert(driver.nationalIdExpiry);
                const hasLicAlert = checkExpiryAlert(driver.licenseExpiry);
                const hasVehLicAlert = checkExpiryAlert(driver.vehicleLicenseExpiry);

                return (
                  <div key={driver.id} className={`p-4 rounded-2xl border transition flex flex-col gap-3.5 relative bg-theme-bg/50 ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-theme-border/60'}`}>
                    
                    {/* Selection Checkbox */}
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => handleToggleSelect(driver.id)}
                      className="absolute top-4 right-4 w-4 h-4 accent-primary cursor-pointer z-10"
                    />

                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0 uppercase">
                        {driver.name?.charAt(0) || 'D'}
                      </div>
                      <div className="flex-1 pr-6">
                        <h4 className="font-black text-xs text-theme-text flex items-center gap-1.5 flex-wrap">
                          <span>{driver.name}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${driver.availability === 'online' ? 'bg-green-500 animate-pulse' : 'bg-theme-border'}`} />
                        </h4>
                        <p className="text-[10px] text-theme-muted font-bold mt-1 flex flex-wrap gap-x-2">
                          <span>📞 {driver.phone}</span>
                          <span>• {driver.deliveryMethod}</span>
                        </p>
                        <p className="text-[9px] text-theme-muted font-bold mt-0.5">
                          📍 {driver.governorate} / {driver.city} / {driver.village}
                        </p>
                      </div>
                    </div>

                    {/* Expiry alerts indicators */}
                    {(hasNidAlert || hasLicAlert || hasVehLicAlert) && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {hasNidAlert && <span className="bg-red-500/10 text-red-500 text-[8px] font-black px-2 py-0.5 rounded border border-red-500/20">ID Expiring Soon</span>}
                        {hasLicAlert && <span className="bg-red-500/10 text-red-500 text-[8px] font-black px-2 py-0.5 rounded border border-red-500/20">License Expiring Soon</span>}
                        {hasVehLicAlert && <span className="bg-red-500/10 text-red-500 text-[8px] font-black px-2 py-0.5 rounded border border-red-500/20">Veh Lic Expiring Soon</span>}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] font-black bg-theme-bg p-2 rounded-xl border border-theme-border/40">
                      <span className="text-theme-muted uppercase tracking-wider flex items-center gap-1"><Award size={12} className="text-amber-500 fill-amber-500" /> {driver.tier || 'bronze'}</span>
                      <span className="text-theme-text">Score: {driver.score || 100}/100</span>
                      <span className="text-amber-500 flex items-center gap-0.5"><Star size={10} className="fill-amber-500 text-amber-500" /> {driver.rating || '5.0'}</span>
                    </div>

                    {/* Documents expiry review dates */}
                    <div className="text-[8px] font-bold text-theme-muted space-y-0.5">
                      <p>National ID Expiry: <span className="font-mono text-theme-text">{driver.nationalIdExpiry || 'N/A'}</span></p>
                      <p>Driving License Expiry: <span className="font-mono text-theme-text">{driver.licenseExpiry || 'N/A'}</span></p>
                      <p>Vehicle License Expiry: <span className="font-mono text-theme-text">{driver.vehicleLicenseExpiry || 'N/A'}</span></p>
                    </div>

                    {/* Inline Settings Editing Form */}
                    {isEditing ? (
                      <div className="bg-theme-card p-3 rounded-xl border border-theme-border/60 space-y-3 animate-fade-in text-[10px] font-bold">
                        <div>
                          <label className="text-[8px] text-theme-muted block mb-0.5">Vehicle Class / Method</label>
                          <select value={editVehicleClass} onChange={e=>setEditVehicleClass(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded px-2 py-1 focus:outline-none">
                            <option value="motorcycle">Motorcycle</option>
                            <option value="car">Car</option>
                            <option value="bicycle">Bicycle</option>
                            <option value="walking">Walking</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8px] text-theme-muted block mb-0.5">Max Distance (km)</label>
                            <input type="number" value={editMaxDistance} onChange={e=>setEditMaxDistance(parseInt(e.target.value)||15)} className="w-full bg-theme-bg border border-theme-border rounded px-2 py-1 focus:outline-none" />
                          </div>
                          <div>
                            <label className="text-[8px] text-theme-muted block mb-0.5">Override Tier</label>
                            <select value={editTier} onChange={e=>setEditTier(e.target.value as any)} className="w-full bg-theme-bg border border-theme-border rounded px-2 py-1 focus:outline-none">
                              <option value="bronze">Bronze</option>
                              <option value="silver">Silver</option>
                              <option value="gold">Gold</option>
                              <option value="platinum">Platinum</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[8px] text-theme-muted block mb-0.5">Preferred Areas (Comma split)</label>
                          <input type="text" value={editPreferredAreas} onChange={e=>setEditPreferredAreas(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded px-2 py-1 focus:outline-none" placeholder="Village name, area..." />
                        </div>
                        <div>
                          <label className="text-[8px] text-theme-muted block mb-0.5">Admin Review Notes</label>
                          <input type="text" value={editAdminNotes} onChange={e=>setEditAdminNotes(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded px-2 py-1 focus:outline-none" placeholder="Notes for verification..." />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveSettings(driver.id)} className="flex-1 bg-primary text-white py-1.5 rounded font-black">Save</button>
                          <button onClick={() => setEditingDriverId(null)} className="bg-theme-bg border border-theme-border text-theme-text px-2 rounded">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => startEditing(driver)}
                          className="flex-1 bg-theme-card border border-theme-border text-theme-text py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 hover:bg-theme-border/30 transition"
                        >
                          <Edit2 size={12} />
                          <span>Configure Settings</span>
                        </button>
                      </div>
                    )}

                    {/* View uploads buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const url = driver.nationalIdImageUrl || driver.nationalIdImage;
                          if (url) window.open(url, '_blank');
                          else showToast('No ID uploaded', 'warning');
                        }}
                        className="flex-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 hover:bg-blue-500/20 transition"
                      >
                        <Eye size={12} /> ID
                      </button>
                      <button
                        onClick={() => {
                          const url = driver.drivingLicenseUrl || driver.licenseImage;
                          if (url) window.open(url, '_blank');
                          else showToast('No License uploaded', 'warning');
                        }}
                        className="flex-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 hover:bg-blue-500/20 transition"
                      >
                        <Eye size={12} /> License
                      </button>
                    </div>

                    {/* Admin Actions */}
                    <div className="flex gap-2">
                      {(driver.status === 'pending' || driver.status === 'pending_review' || driver.status === 'needs_documents') && (
                        <>
                          <button
                            onClick={() => handleApprove(driver)}
                            className="flex-[2] bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-xs font-black shadow transition flex items-center justify-center gap-1"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            onClick={() => handleRequestDocs(driver.id)}
                            className="flex-[2] bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl text-xs font-black shadow transition flex items-center justify-center gap-1"
                          >
                            <AlertCircle size={14} /> Request Docs
                          </button>
                          <button
                            onClick={() => handleReject(driver.id)}
                            className="w-10 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl flex items-center justify-center hover:bg-red-500/20 transition"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}

                      {driver.status === 'approved' && (
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => handleSuspend(driver.id)}
                            className="flex-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 py-2 rounded-xl text-xs font-black hover:bg-amber-500/20 transition"
                          >
                            Suspend
                          </button>
                          <button
                            onClick={() => handleBlock(driver.id)}
                            className="flex-1 bg-red-500/10 border border-red-500/20 text-red-500 py-2 rounded-xl text-xs font-black hover:bg-red-500/20 transition"
                          >
                            Block
                          </button>
                        </div>
                      )}

                      {(driver.status === 'suspended' || driver.status === 'blocked' || driver.status === 'rejected') && (
                        <button
                          onClick={() => handleReactivate(driver.id)}
                          className="w-full bg-green-500/10 border border-green-500/20 text-green-500 py-2 rounded-xl text-xs font-black hover:bg-green-500/20 transition flex items-center justify-center gap-1"
                        >
                          <RefreshCw size={14} /> Reactivate / Approve
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Invite Driver Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-fade-in theme-transition">
          <form 
            onSubmit={handleInviteSubmit}
            className="bg-theme-card border border-theme-border rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-slide-up theme-transition text-xs"
          >
            <div className="flex justify-between items-center pb-2 border-b border-theme-border/60">
              <h4 className="font-black text-theme-text text-sm">{isRTL ? 'إرسال دعوة انضمام مندوب' : 'Invite Representative'}</h4>
              <button type="button" onClick={() => setShowInviteModal(false)} className="text-theme-muted hover:text-theme-text"><X size={20} /></button>
            </div>

            {inviteResetLink ? (
              <div className="space-y-4 py-2">
                <p className="text-green-500 font-black text-xs">{isRTL ? 'تم إنشاء الدعوة بنجاح!' : 'Driver invited successfully!'}</p>
                <div className="bg-theme-bg p-3 rounded-xl border border-theme-border">
                  <label className="text-[10px] text-theme-muted font-bold block mb-1">{isRTL ? 'رابط إعادة ضبط كلمة المرور للمندوب' : 'Copy Password Reset Link for Driver'}</label>
                  <textarea 
                    readOnly 
                    value={inviteResetLink} 
                    onClick={(e) => { (e.target as any).select(); }}
                    className="w-full bg-theme-card border border-theme-border rounded p-2 text-[10px] font-mono text-theme-text focus:outline-none" 
                    rows={4}
                  />
                  <p className="text-[9px] text-theme-muted font-bold mt-1.5">{isRTL ? 'انسخ هذا الرابط وأرسله للمندوب ليكمل تعيين كلمة المرور ويبدأ العمل.' : 'Send this reset link to the driver to complete onboarding set password.'}</p>
                </div>
                <PremiumButton onClick={() => setShowInviteModal(false)} className="w-full">Close</PremiumButton>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'الاسم بالكامل' : 'Full Name'}</label>
                  <input type="text" value={inviteName} onChange={e=>setInviteName(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" required />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'البريد الإلكتروني' : 'Email Address'}</label>
                  <input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" required />
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'رقم الهاتف' : 'Phone Number'}</label>
                  <input type="tel" value={invitePhone} onChange={e=>setInvitePhone(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" required />
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'المحافظة' : 'Governorate'}</label>
                  <select
                    value={inviteGov}
                    onChange={(e) => {
                      setInviteGov(e.target.value);
                      const firstCity = Object.keys(EGYPT_REGIONS[e.target.value]?.cities || {})[0] || 'أخرى';
                      setInviteCity(firstCity);
                      const firstVillage = EGYPT_REGIONS[e.target.value]?.cities[firstCity]?.[0] || 'أخرى';
                      setInviteVillage(firstVillage);
                    }}
                    className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text"
                  >
                    {Object.keys(EGYPT_REGIONS).map(gov => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'المركز / المدينة' : 'City / Center'}</label>
                  <select
                    value={inviteCity}
                    onChange={(e) => {
                      setInviteCity(e.target.value);
                      const firstVillage = EGYPT_REGIONS[inviteGov]?.cities[e.target.value]?.[0] || 'أخرى';
                      setInviteVillage(firstVillage);
                    }}
                    className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text"
                  >
                    {getAvailableCitiesInvite().map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'القرية / الحي' : 'Village'}</label>
                  <select
                    value={inviteVillage}
                    onChange={(e) => setInviteVillage(e.target.value)}
                    className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text"
                  >
                    {getAvailableVillagesInvite().map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'وسيلة التوصيل' : 'Delivery Method'}</label>
                  <select
                    value={inviteMethod}
                    onChange={(e) => setInviteMethod(e.target.value)}
                    className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text"
                  >
                    <option value="motorcycle">Motorcycle</option>
                    <option value="car">Car</option>
                    <option value="bicycle">Bicycle</option>
                    <option value="walking">Walking</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-3">
                  <PremiumButton type="button" variant="outline" onClick={() => setShowInviteModal(false)} className="flex-1">Cancel</PremiumButton>
                  <PremiumButton type="submit" isLoading={isInviting} className="flex-[2]">Send Invitation</PremiumButton>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

    </div>
  );
};
export default DriverManagement;
