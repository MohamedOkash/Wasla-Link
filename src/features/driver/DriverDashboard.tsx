import React, { useState, useEffect } from 'react';
import { BarChart3, ClipboardList, User, LogOut, Bike, Star, Power, Wallet, MapPin, Navigation, Signal, AlertTriangle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { DriverOrders } from './DriverOrders';
import { DriverProfile } from './DriverProfile';
import { DriverEarnings } from './DriverEarnings';
import { geoService, GpsStatus, LocationData } from '../../services/geolocation.service';

export const DriverDashboard: React.FC = () => {
  const { goHome, currentUser, isRTL, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'summary' | 'orders' | 'earnings' | 'profile'>('summary');
  const [driver, setDriver] = useState<any>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('offline');
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'driver') return;
    
    const unsub = onSnapshot(doc(db, 'drivers', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setDriver({ id: docSnap.id, ...docSnap.data() });
      }
    });

    return () => unsub();
  }, [currentUser]);

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
        await updateDoc(doc(db, 'drivers', driver.id), {
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
      
      await updateDoc(doc(db, 'drivers', driver.id), {
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
      showToast(isRTL ? 'حدث خطأ' : 'Error', 'error');
    }
  };

  if (!driver) {
    return <div className="h-screen bg-theme-bg flex items-center justify-center animate-pulse"><Bike size={40} className="text-primary" /></div>;
  }

  // Calculate metrics based on driver object (from Phase 14A driver schema)
  const isOnline = driver.availability === 'online' || driver.availability === 'busy';
  const isBusy = driver.availability === 'busy';

  const renderGpsHealth = () => {
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
          <div className="bg-primary text-white p-2.5 rounded-xl">
            <Bike size={20} />
          </div>
          <div>
            <h1 className="text-base font-black text-theme-text truncate max-w-[150px]">{driver.name}</h1>
            <p className="text-[10px] text-theme-muted font-bold mt-0.5">
              {isRTL ? 'لوحة توصيل الطلبات' : 'Delivery Workspace'}
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
            title={isOnline ? (isRTL ? 'إنهاء الوردية' : 'End Shift') : (isRTL ? 'بدء الوردية' : 'Start Shift')}
          >
            <Power size={16} />
            <span className="text-[10px] font-black hidden md:inline">
              {isBusy ? (isRTL ? 'مشغول' : 'Busy') : isOnline ? (isRTL ? 'إنهاء الوردية' : 'End Shift') : (isRTL ? 'بدء الوردية' : 'Start Shift')}
            </span>
          </button>

          <button 
            onClick={goHome} 
            className="p-2.5 bg-theme-border/50 text-theme-muted rounded-xl hover:bg-theme-border transition flex items-center justify-center"
            title={isRTL ? 'تسجيل الخروج' : 'Log Out'}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="bg-theme-card px-3 py-2.5 border-b border-theme-border flex overflow-x-auto no-scrollbar gap-1.5 theme-transition">
        {[
          { id: 'summary', label: isRTL ? 'الرئيسية' : 'Dashboard', icon: BarChart3 },
          { id: 'orders', label: isRTL ? 'الطلبات' : 'Orders', icon: ClipboardList },
          { id: 'earnings', label: isRTL ? 'الأرباح' : 'Earnings', icon: Wallet },
          { id: 'profile', label: isRTL ? 'حسابي' : 'Account', icon: User },
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
                    {isRTL ? 'حالة التتبع (GPS)' : 'GPS Tracking Status'}
                  </h3>
                  {renderGpsHealth()}
                </div>

                {gpsStatus === 'permission_denied' && (
                  <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-xs font-bold mb-4">
                    {isRTL ? 'الرجاء السماح للتطبيق بالوصول إلى موقعك الجغرافي من إعدادات المتصفح للتمكن من استقبال الطلبات.' : 'Please allow location access from your browser settings to receive orders.'}
                  </div>
                )}
                
                {gpsStatus === 'gps_disabled' && (
                  <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-xs font-bold mb-4">
                    {isRTL ? 'الرجاء تفعيل خدمة الموقع (GPS) في هاتفك.' : 'Please enable Location Services (GPS) on your device.'}
                  </div>
                )}

                {currentLocation ? (
                  <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                    <div className="bg-theme-bg p-3 rounded-xl flex flex-col gap-1 border border-theme-border">
                      <span className="text-theme-muted">{isRTL ? 'الإحداثيات' : 'Coordinates'}</span>
                      <span className="text-theme-text font-black text-[10px] break-all">{currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</span>
                    </div>
                    <div className="bg-theme-bg p-3 rounded-xl flex flex-col gap-1 border border-theme-border">
                      <span className="text-theme-muted">{isRTL ? 'الدقة' : 'Accuracy'}</span>
                      <span className="text-theme-text font-black">{Math.round(currentLocation.accuracy)} {isRTL ? 'متر' : 'm'}</span>
                    </div>
                    <div className="bg-theme-bg p-3 rounded-xl flex flex-col gap-1 border border-theme-border col-span-2">
                      <span className="text-theme-muted">{isRTL ? 'آخر تحديث' : 'Last Sync'}</span>
                      <span className="text-theme-text font-black">{new Date(currentLocation.lastUpdated).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs font-bold text-theme-muted">{isRTL ? 'جاري تحديد الموقع...' : 'Acquiring GPS Signal...'}</p>
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
                    ? (isRTL ? 'أنت في مهمة توصيل حالياً' : 'You are currently on a delivery')
                    : isOnline 
                    ? (isRTL ? 'أنت متصل ومستعد لاستقبال الطلبات' : 'You are online and ready!')
                    : (isRTL ? 'أنت غير متصل' : 'You are offline')
                  }
                </h4>
                <p className="text-[10px] font-bold mt-0.5 opacity-80">
                  {isBusy 
                    ? (isRTL ? 'يرجى إكمال الطلب الحالي لاستلام طلبات جديدة.' : 'Complete current order to receive new ones.')
                    : isOnline 
                    ? (isRTL ? 'سيتم تنبيهك فور توفر طلبات بالقرب منك.' : 'New orders will prompt immediately.')
                    : (isRTL ? 'قم ببدء الوردية لبدء التتبع.' : 'Start your shift to begin tracking.')
                  }
                </p>
              </div>
            </div>

            {/* Stats Summary Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-theme-card border border-theme-border p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-primary">
                  <ClipboardList size={18} />
                  <span className="text-xs font-black">{isRTL ? 'الطلبات المكتملة' : 'Completed'}</span>
                </div>
                <span className="text-2xl font-black text-theme-text block">{driver.completedOrders || 0}</span>
              </div>
              <div className="bg-theme-card border border-theme-border p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-amber-500">
                  <Star size={18} className="fill-amber-500" />
                  <span className="text-xs font-black">{isRTL ? 'التقييم العام' : 'Rating'}</span>
                </div>
                <span className="text-2xl font-black text-theme-text block">{driver.rating || 5.0}</span>
              </div>
              <div className="bg-theme-card border border-theme-border p-4 rounded-2xl shadow-sm col-span-2">
                <div className="flex items-center gap-2 mb-2 text-green-500">
                  <Wallet size={18} />
                  <span className="text-xs font-black">{isRTL ? 'إجمالي الأرباح' : 'Total Earnings'}</span>
                </div>
                <span className="text-3xl font-black text-theme-text block">{driver.totalEarnings || 0} <span className="text-sm text-theme-muted">ج.م</span></span>
              </div>
            </div>

            {/* Active Order Placeholder */}
            <div className="bg-theme-card border border-theme-border rounded-[28px] p-5 shadow-sm theme-transition">
               <h3 className="font-black text-theme-text text-sm flex items-center gap-2 border-b border-theme-border/60 pb-3">
                <MapPin size={18} className="text-primary" />
                {isRTL ? 'الطلب الحالي' : 'Active Order'}
              </h3>
              {driver.currentOrderId ? (
                <div className="pt-4 text-center">
                   <p className="text-xs font-bold text-amber-500 mb-3">{isRTL ? 'لديك طلب قيد التوصيل' : 'You have an active delivery'}</p>
                   <button onClick={() => setActiveTab('orders')} className="bg-primary text-white text-xs font-black py-2.5 px-6 rounded-xl shadow-md hover:bg-primary-hover transition">
                     {isRTL ? 'عرض الطلب' : 'View Order'}
                   </button>
                </div>
              ) : (
                <div className="pt-8 pb-4 text-center opacity-60">
                   <ClipboardList size={32} className="mx-auto mb-2 text-theme-muted" />
                   <p className="text-xs font-bold text-theme-muted">{isRTL ? 'لا يوجد طلب حالي' : 'No active order'}</p>
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'orders' && <DriverOrders driver={driver} />}
        {activeTab === 'earnings' && <DriverEarnings driver={driver} />}
        {activeTab === 'profile' && <DriverProfile driver={driver} />}
      </div>
    </div>
  );
};

export default DriverDashboard;
