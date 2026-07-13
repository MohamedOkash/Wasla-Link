import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, ClipboardList, User, LogOut, Bike, Star, Power, Wallet, MapPin, Navigation, Signal, AlertTriangle, Ban, ArrowRight } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { DriverOrders } from './DriverOrders';
import { DriverProfile } from './DriverProfile';
import { DriverEarnings } from './DriverEarnings';
import { geoService, GpsStatus, LocationData } from '../../services/geolocation.service';
import { driverRepository } from "../../services/driver/repository";
import { DriverVerificationRequired } from './DriverVerificationRequired';

export const DriverDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { goHome, currentUser, isRTL, showToast, registerBackHandler } = useApp();
  const [activeTab, setActiveTab] = useState<'summary' | 'orders' | 'earnings' | 'profile'>('summary');

  useEffect(() => {
    const handleBack = () => {
      if (activeTab !== 'summary') {
        setActiveTab('summary');
        return true;
      }
      return false;
    };
    return registerBackHandler(handleBack);
  }, [activeTab, registerBackHandler]);

  const [driver, setDriver] = useState<any>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('offline');
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const { orders, updateOrderStatus } = useApp();
  const [incomingOrder, setIncomingOrder] = useState<any>(null);
  const [assignmentTimer, setAssignmentTimer] = useState<number>(30);
  const [wallet, setWallet] = useState<any>(null);
  const [maxQueueSize, setMaxQueueSize] = useState<number>(3);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = onSnapshot(doc(db, 'driverWallets', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setWallet(docSnap.data());
      }
    });
    return () => unsub();
  }, [currentUser?.uid]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'adminSettings', 'driver'), (snap) => {
      if (snap.exists()) {
        setMaxQueueSize(snap.data().maxQueueSize || 3);
      }
    });
    return () => unsub();
  }, []);

  // Sync active driver profile from 'drivers' collection in real-time
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsub = onSnapshot(doc(db, 'drivers', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDriver({ id: docSnap.id, ...data });
        geoService.setTrackingIntervalForStatus(data.availability || 'offline');
      } else {
        // Fallback profile if drivers document is not created yet
        setDriver({
          id: currentUser.uid,
          name: currentUser.name || 'سائق وصلة لينك',
          availability: 'offline',
          completedOrders: 0,
          rating: 5.0,
          totalEarnings: 0
        });
      }
    }, (err) => {
      console.error("Failed to sync driver profile:", err);
    });

    return () => unsub();
  }, [currentUser?.uid]);
  
  // Listen for assigned orders
  useEffect(() => {
    if (!driver) return;
    const validStates = ['available', 'online', 'busy', 'delivering'];
    if (!validStates.includes(driver.availability || 'offline')) return;

    const activeOrders = orders.filter(o => o.driverId === driver.id && ['accepted', 'picked_up', 'on_the_way', 'delivering'].includes(o.status));
    if (activeOrders.length >= maxQueueSize) return;

    const assignedOrder = orders.find(o => o.status === 'driver_assigned' && o.assignedDriverId === driver.id);
    
    if (assignedOrder && !incomingOrder) {
      setIncomingOrder(assignedOrder);
      setAssignmentTimer(30);
    } else if (!assignedOrder && incomingOrder) {
      setIncomingOrder(null);
    }
  }, [orders, driver, incomingOrder, maxQueueSize]);

  // Handle Assignment Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (incomingOrder) {
      interval = setInterval(() => {
        setAssignmentTimer((prev) => {
          if (prev <= 1) {
            // Auto reject
            handleRejectOrder(incomingOrder.id);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [incomingOrder]);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'driver_accepted', driver.id, driver.name);
      setIncomingOrder(null);
      showToast(t('str_1075'));
    } catch(e) {
      console.error(e);
      showToast(t('str_537'), 'error');
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      // Revert status to ready_for_delivery, dispatch service will pick it up or we can call handleDriverRejection directly
      // Note: we just call updateOrderStatus with 'failed_assignment' locally to trigger next step in AppContext or let a firebase function handle it.
      // But since we have dispatchService, let's just trigger updateOrderStatus as 'ready_for_delivery' with rejected status.
      // For now, let's just use updateOrderStatus to clear our assignment.
      await import('../../services/driver/service').then(m => m.driverService.rejectOrder(driver.id, orderId));

      setIncomingOrder(null);
      showToast(t('str_536'));
    } catch(e) {
      console.error(e);
    }
  };

  // Sync battery level and app version periodically
  useEffect(() => {
    if (!driver || driver.availability === 'offline') return;
    
    const interval = setInterval(async () => {
      try {
        let batteryLevel = 100;
        if ('getBattery' in navigator) {
          const battery: any = await (navigator as any).getBattery();
          batteryLevel = Math.round(battery.level * 100);
        }
        await driverRepository.update(driver.id, {
                  lastSeen: serverTimestamp(),
                  batteryLevel,
                  appVersion: '1.0.0'
                });
      } catch (e) {
        // ignore
      }
    }, 60000); // every minute

    return () => clearInterval(interval);
  }, [driver?.availability]);

  // Clean up GPS on unmount
  useEffect(() => {
    return () => {
      geoService.stopTracking();
    };
  }, []);

  const toggleAvailability = async () => {
    if (!driver) return;
    try {
      const isCurrentlyOnline = driver.availability === 'online' || driver.availability === 'busy';
      const newStatus = isCurrentlyOnline ? 'offline' : 'online';
      
      await driverRepository.update(driver.id, {
        availability: newStatus,
        online: newStatus !== 'offline',
        lastSeen: serverTimestamp()
      });

      if (newStatus === 'online') {
        // Start Shift
        geoService.startTracking(driver.id, (status) => {
          setGpsStatus(status);
        }, (loc) => {
          setCurrentLocation(loc);
        });
      } else {
        // End Shift
        geoService.stopTracking();
        setGpsStatus('offline');
        setCurrentLocation(null);
      }

      showToast(
        isRTL 
          ? `أنت الآن ${newStatus === 'online' ? 'متصل' : 'غير متصل'}` 
          : `You are now ${newStatus}`
      );
    } catch (error) {
      console.error(error);
      showToast(t('str_537'), 'error');
    }
  };

  if (!driver) {
    return <div className="h-screen bg-theme-bg flex items-center justify-center animate-pulse"><Bike size={40} className="text-primary" /></div>;
  }

  if (driver.status === 'pending_review') {
    return (
      <div className="h-screen bg-theme-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-6">
          <ClipboardList size={40} />
        </div>
        <h2 className="text-xl font-black mb-2 text-theme-text">Your Application is Under Review</h2>
        <p className="text-theme-muted text-sm font-bold">Please wait while our team reviews your documents.</p>
        <button onClick={() => { goHome(); window.location.reload(); }} className="mt-8 px-6 py-3 bg-theme-card border border-theme-border rounded-xl text-theme-text text-sm font-black">Refresh</button>
      </div>
    );
  }

  if (driver.status === 'rejected') {
    return (
      <div className="h-screen bg-theme-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle size={40} />
        </div>
        <h2 className="text-xl font-black mb-2 text-theme-text">Application Rejected</h2>
        <p className="text-theme-muted text-sm font-bold">Unfortunately, your application was not approved.</p>
      </div>
    );
  }

  if (driver.status === 'blocked' || driver.status === 'suspended') {
    return (
      <div className="h-screen bg-theme-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
          <Ban size={40} />
        </div>
        <h2 className="text-xl font-black mb-2 text-theme-text">{isRTL ? 'حسابك معطل مؤقتاً' : 'Account Suspended'}</h2>
        <p className="text-theme-muted text-sm font-bold">
          {isRTL ? 'تم إيقاف حسابك مؤقتاً من قبل الإدارة. يرجى التواصل مع الدعم.' : 'Your driver account has been suspended by administration. Please contact support.'}
        </p>
        <button onClick={() => { goHome(); window.location.reload(); }} className="mt-8 px-6 py-3 bg-theme-card border border-theme-border rounded-xl text-theme-text text-sm font-black">
          {isRTL ? 'تحديث' : 'Refresh'}
        </button>
      </div>
    );
  }

  if (driver.status === 'needs_documents') {
    // We need a sub-component or state for uploading requested documents.
    // For now, I'll redirect them to a special state or component.
    return <DriverVerificationRequired driver={driver} />;
  }

  // Calculate metrics based on driver object (from Phase 14A driver schema)
  const isOnline = driver.availability === 'online' || driver.availability === 'busy' || driver.availability === 'available' || driver.availability === 'delivering';
  const isBusy = driver.availability === 'busy' || driver.availability === 'delivering';

  const { completedToday, completedThisWeek, completedThisMonth, acceptanceRate, completionRate } = useMemo(() => {
    const driverOrders = orders.filter(o => o.driverId === currentUser?.uid);
    const completed = driverOrders.filter(o => o.status === 'delivered');
    const cancelled = driverOrders.filter(o => o.status === 'cancelled');
    const rejectedByList = orders.filter(o => o.rejectedBy && o.rejectedBy.includes(currentUser?.uid || ''));

    const todayStr = new Date().toDateString();
    const completedToday = completed.filter(o => {
      const d = o.createdAt ? new Date(o.createdAt) : new Date();
      return d.toDateString() === todayStr;
    }).length;

    const completedThisWeek = completed.filter(o => {
      const d = o.createdAt ? new Date(o.createdAt) : new Date();
      return (Date.now() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    const completedThisMonth = completed.filter(o => {
      const d = o.createdAt ? new Date(o.createdAt) : new Date();
      return (Date.now() - d.getTime()) <= 30 * 24 * 60 * 60 * 1000;
    }).length;

    const totalAttempts = completed.length + rejectedByList.length;
    const acceptanceRate = totalAttempts > 0 ? ((completed.length / totalAttempts) * 100).toFixed(0) : '100';
    const totalTerminated = completed.length + cancelled.length;
    const completionRate = totalTerminated > 0 ? ((completed.length / totalTerminated) * 100).toFixed(0) : '100';

    return {
      completedToday,
      completedThisWeek,
      completedThisMonth,
      acceptanceRate,
      completionRate
    };
  }, [orders, currentUser?.uid]);

  const renderGpsHealth = () => {
  const {} = useTranslation();

    if (!isOnline) return null;

    let icon = <Signal size={16} />;
    let textAr = 'غير متصل';
    let textEn = 'Offline';
    let colorClass = 'text-theme-muted bg-theme-border/20';

    switch (gpsStatus) {
      case 'online':
        icon = <Signal size={16} />;
        textAr = 'إشارة ممتازة';
        textEn = 'Excellent Signal';
        colorClass = 'text-green-500 bg-green-500/10';
        break;
      case 'weak_signal':
        icon = <Signal size={16} />;
        textAr = 'إشارة ضعيفة';
        textEn = 'Weak Signal';
        colorClass = 'text-amber-500 bg-amber-500/10';
        break;
      case 'gps_disabled':
        icon = <AlertTriangle size={16} />;
        textAr = 'موقعك مغلق';
        textEn = 'GPS Disabled';
        colorClass = 'text-red-500 bg-red-500/10';
        break;
      case 'permission_denied':
        icon = <AlertTriangle size={16} />;
        textAr = 'تم رفض الصلاحية';
        textEn = 'Permission Denied';
        colorClass = 'text-red-500 bg-red-500/10';
        break;
      case 'offline':
        icon = <Signal size={16} />;
        textAr = 'غير متصل بالإنترنت';
        textEn = 'No Internet';
        colorClass = 'text-red-500 bg-red-500/10';
        break;
    }

    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black ${colorClass}`}>
        {icon}
        <span>{isRTL ? textAr : textEn}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-theme-bg theme-transition pb-20 text-theme-text">
      {/* Top Header */}
      <div className="bg-theme-card px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 shadow-sm border-b border-theme-border flex justify-between items-center sticky top-0 z-30 theme-transition">
        <div className="flex items-center gap-2">
          {activeTab !== 'summary' && (
            <button
              onClick={() => setActiveTab('summary')}
              className="bg-theme-bg text-theme-muted hover:text-theme-text p-2 rounded-xl border border-theme-border mr-1 active:scale-95 transition flex items-center justify-center"
              title={t('back') || 'Back'}
            >
              <ArrowRight size={16} className={isRTL ? '' : 'rotate-180'} />
            </button>
          )}
          <div className="bg-primary text-white p-2.5 rounded-xl">
            <Bike size={20} />
          </div>
          <div>
            <h1 className="text-base font-black text-theme-text truncate max-w-[150px]">{driver.name}</h1>
            <p className="text-[10px] text-theme-muted font-bold mt-0.5">
              {t('str_1076')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Online/Offline Toggle (Start/End Shift) */}
          <button
            onClick={toggleAvailability}
            disabled={isBusy}
            className={`p-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              isBusy ? 'bg-amber-500/10 text-amber-500 opacity-50 cursor-not-allowed' :
              isOnline 
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/15' 
                : 'bg-green-500/10 text-green-500 hover:bg-green-500/15'
            }`}
            title={isOnline ? (t('str_1077')) : (t('str_1078'))}
          >
            <Power size={16} />
            <span className="text-[10px] font-black hidden md:inline">
              {isBusy ? (t('str_1079')) : isOnline ? (t('str_1077')) : (t('str_1078'))}
            </span>
          </button>

          <button 
            onClick={goHome} 
            className="p-2.5 bg-theme-border/50 text-theme-muted rounded-xl hover:bg-theme-border transition flex items-center justify-center"
            title={t('str_1080')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="bg-theme-card px-3 py-2.5 border-b border-theme-border flex overflow-x-auto no-scrollbar gap-1.5 theme-transition">
        {[
          { id: 'summary', label: t('str_360'), icon: BarChart3 },
          { id: 'orders', label: t('str_365'), icon: ClipboardList },
          { id: 'earnings', label: t('str_1081'), icon: Wallet },
          { id: 'profile', label: t('str_1082'), icon: User },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition flex-shrink-0 ${
              activeTab === tab.id 
                ? 'bg-primary text-white font-black shadow-sm' 
                : 'text-theme-muted font-bold hover:text-theme-text hover:bg-theme-bg'
            }`}
          >
            <tab.icon size={15} />
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="p-5 flex-1 max-w-[1200px] w-full mx-auto pb-[120px]">
        {activeTab === 'summary' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* GPS Health & Coordinates */}
            {isOnline && (
              <div className="bg-theme-card border border-theme-border rounded-[28px] p-5 shadow-sm theme-transition">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-sm flex items-center gap-2 text-theme-text">
                    <Navigation size={18} className="text-primary" />
                    {t('str_1083')}
                  </h3>
                  {renderGpsHealth()}
                </div>

                {gpsStatus === 'permission_denied' && (
                  <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-xs font-bold mb-4">
                    {t('str_1084')}
                  </div>
                )}
                
                {gpsStatus === 'gps_disabled' && (
                  <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-xs font-bold mb-4">
                    {t('str_1085')}
                  </div>
                )}

                {currentLocation ? (
                  <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                    <div className="bg-theme-bg p-3 rounded-xl flex flex-col gap-1 border border-theme-border">
                      <span className="text-theme-muted">{t('str_1086')}</span>
                      <span className="text-theme-text font-black text-[10px] break-all">{currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</span>
                    </div>
                    <div className="bg-theme-bg p-3 rounded-xl flex flex-col gap-1 border border-theme-border">
                      <span className="text-theme-muted">{t('str_1087')}</span>
                      <span className="text-theme-text font-black">{Math.round(currentLocation.accuracy)} {t('str_1088')}</span>
                    </div>
                    <div className="bg-theme-bg p-3 rounded-xl flex flex-col gap-1 border border-theme-border col-span-2">
                      <span className="text-theme-muted">{t('str_1089')}</span>
                      <span className="text-theme-text font-black">{new Date(currentLocation.lastUpdated).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs font-bold text-theme-muted">{t('str_1090')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Driver Guidelines / Status alert */}
            <div className={`p-4 rounded-2xl border flex gap-3 items-center ${
              isBusy ? 'bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-300' :
              isOnline 
                ? 'bg-green-500/10 border-green-500/20 text-green-900 dark:text-green-300' 
                : 'bg-theme-border/30 border-theme-border/50 text-theme-muted'
            }`}>
              <div className={`p-2.5 rounded-xl ${isBusy ? 'bg-amber-500/20 text-amber-500' : isOnline ? 'bg-green-500/20 text-green-500' : 'bg-theme-border text-theme-text'}`}>
                <Bike size={18} />
              </div>
              <div>
                <h4 className="text-sm font-black">
                  {isBusy 
                    ? (t('str_1091'))
                    : isOnline 
                    ? (t('str_1092'))
                    : (t('str_1093'))
                  }
                </h4>
                <p className="text-[10px] font-bold mt-0.5 opacity-80">
                  {isBusy 
                    ? (t('str_1094'))
                    : isOnline 
                    ? (t('str_1095'))
                    : (t('str_1096'))
                  }
                </p>
              </div>
            </div>

            {/* COD Cash Tracker Widget */}
            {wallet && (
              <div className="bg-theme-card border border-theme-border p-4.5 rounded-[24px] shadow-sm space-y-3">
                <h4 className="text-xs font-black text-theme-text border-b border-theme-border/60 pb-2 flex justify-between items-center">
                  <span>{isRTL ? 'إدارة المبالغ النقدية (COD)' : 'COD Cash Management'}</span>
                  <span className="text-[10px] font-bold text-primary">{isRTL ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-theme-bg p-3 rounded-xl border border-theme-border">
                    <span className="text-[9px] text-theme-muted font-bold block">{isRTL ? 'النقدية المحصلة' : 'Cash Collected'}</span>
                    <span className="text-sm font-black text-theme-text mt-1 block">{(wallet.cashCollected || 0).toFixed(2)} ج.م</span>
                  </div>
                  <div className="bg-theme-bg p-3 rounded-xl border border-theme-border">
                    <span className="text-[9px] text-theme-muted font-bold block">{isRTL ? 'النقدية في يدك' : 'Cash Remaining'}</span>
                    <span className="text-sm font-black text-amber-500 mt-1 block">{(wallet.cashRemaining || 0).toFixed(2)} ج.م</span>
                  </div>
                  <div className="bg-theme-bg p-3 rounded-xl border border-theme-border">
                    <span className="text-[9px] text-theme-muted font-bold block">{isRTL ? 'نقدية قيد التوصيل' : 'Cash Pending'}</span>
                    <span className="text-sm font-black text-blue-500 mt-1 block">{(wallet.cashPending || 0).toFixed(2)} ج.م</span>
                  </div>
                  <div className="bg-theme-bg p-3 rounded-xl border border-theme-border">
                    <span className="text-[9px] text-theme-muted font-bold block">{isRTL ? 'النقدية الموردة للإدارة' : 'Cash Delivered'}</span>
                    <span className="text-sm font-black text-green-500 mt-1 block">{(wallet.cashDelivered || 0).toFixed(2)} ج.م</span>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Statistics Grid */}
            <div className="bg-theme-card border border-theme-border p-4.5 rounded-[24px] shadow-sm space-y-3.5">
              <h4 className="text-xs font-black text-theme-text border-b border-theme-border/60 pb-2">
                {isRTL ? 'إحصائيات الأداء الحالية' : 'Performance Statistics'}
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-theme-bg p-2 rounded-xl border border-theme-border">
                  <span className="text-[8px] text-theme-muted font-bold block">{isRTL ? 'طلبات اليوم' : 'Today'}</span>
                  <span className="text-sm font-black text-theme-text mt-0.5 block">{completedToday}</span>
                </div>
                <div className="bg-theme-bg p-2 rounded-xl border border-theme-border">
                  <span className="text-[8px] text-theme-muted font-bold block">{isRTL ? 'طلبات الأسبوع' : 'Weekly'}</span>
                  <span className="text-sm font-black text-theme-text mt-0.5 block">{completedThisWeek}</span>
                </div>
                <div className="bg-theme-bg p-2 rounded-xl border border-theme-border">
                  <span className="text-[8px] text-theme-muted font-bold block">{isRTL ? 'طلبات الشهر' : 'Monthly'}</span>
                  <span className="text-sm font-black text-theme-text mt-0.5 block">{completedThisMonth}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-theme-bg p-2.5 rounded-xl border border-theme-border">
                  <span className="text-[8px] text-theme-muted font-bold block">{isRTL ? 'معدل قبول الطلبات' : 'Acceptance Rate'}</span>
                  <span className="text-xs font-black text-green-500 mt-0.5 block">{acceptanceRate}%</span>
                </div>
                <div className="bg-theme-bg p-2.5 rounded-xl border border-theme-border">
                  <span className="text-[8px] text-theme-muted font-bold block">{isRTL ? 'معدل إكمال الطلبات' : 'Completion Rate'}</span>
                  <span className="text-xs font-black text-primary mt-0.5 block">{completionRate}%</span>
                </div>
              </div>
            </div>

            {/* Active Order Placeholder */}
            <div className="bg-theme-card border border-theme-border rounded-[28px] p-5 shadow-sm theme-transition">
               <h3 className="font-black text-theme-text text-sm flex items-center gap-2 border-b border-theme-border/60 pb-3">
                <MapPin size={18} className="text-primary" />
                {t('str_1100')}
              </h3>
              {driver.currentOrderId ? (
                <div className="pt-4 text-center">
                   <p className="text-xs font-bold text-amber-500 mb-3">{t('str_1101')}</p>
                   <button onClick={() => setActiveTab('orders')} className="bg-primary text-white text-xs font-black py-2.5 px-6 rounded-xl shadow-md hover:bg-primary-hover transition">
                     {t('str_1102')}
                   </button>
                </div>
              ) : (
                <div className="pt-8 pb-4 text-center opacity-60">
                   <ClipboardList size={32} className="mx-auto mb-2 text-theme-muted" />
                   <p className="text-xs font-bold text-theme-muted">{t('str_1103')}</p>
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'orders' && <DriverOrders driver={driver} />}
        {activeTab === 'earnings' && <DriverEarnings driver={driver} />}
        {activeTab === 'profile' && <DriverProfile />}
        {/* Incoming Order Modal */}
        {incomingOrder && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-theme-bg border border-theme-border rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Bike className="text-primary w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-theme-text mb-2">
                  {t('str_1104')}
                </h3>
                <p className="text-theme-secondary text-sm">
                  {incomingOrder.shopName}
                </p>
              </div>
              
              <div className="flex justify-between items-center mb-6 p-4 bg-theme-bg-secondary rounded-lg border border-theme-border">
                <div className="text-center">
                  <span className="block text-theme-secondary text-xs">{t('str_1105')}</span>
                  <span className="font-bold text-theme-text">{incomingOrder.assignmentDistance?.toFixed(1) || 5} km</span>
                </div>
                <div className="h-8 w-px bg-theme-border" />
                <div className="text-center">
                  <span className="block text-theme-secondary text-xs">{isRTL ? 'الأرباح المقدرة' : 'Estimated Earnings'}</span>
                  <span className="font-bold text-green-500">
                    {incomingOrder.estimatedEarnings ?? incomingOrder.driverEarnings ?? Math.round(15 + (incomingOrder.assignmentDistance || 5) * 3)} {t('currencyEGP') || 'ج.م'}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2 text-theme-text">
                  <span>{t('str_1108')}</span>
                  <span className={`font-bold ${assignmentTimer <= 10 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                    {assignmentTimer}s
                  </span>
                </div>
                <div className="w-full h-2 bg-theme-bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${assignmentTimer <= 10 ? 'bg-red-500' : 'bg-primary'}`}
                    style={{ width: `${(assignmentTimer / 30) * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleRejectOrder(incomingOrder.id)}
                  className="btn-secondary w-full"
                >
                  {t('str_1109')}
                </button>
                <button
                  onClick={() => handleAcceptOrder(incomingOrder.id)}
                  className="btn-primary w-full shadow-lg shadow-primary/25"
                >
                  {t('str_159')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
