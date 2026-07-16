import { useTranslation } from '../../hooks/useTranslation';
import React, { useState } from 'react';
import { User, Phone, Bike, Star, DollarSign, LogOut, ShieldAlert } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { driverRepository } from '../../services/driver/repository';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';

interface DriverProfileProps {
  driver?: any;
}

export const DriverProfile: React.FC<DriverProfileProps> = ({ driver }) => {
  const { t } = useTranslation();
  const { currentUser, setCurrentUser, lang, isRTL } = useApp();
  
  const [phone, setPhone] = useState(driver?.phone || currentUser?.phone || '');
  const [vehicle, setVehicle] = useState(driver?.vehicles?.[0]?.brand || driver?.deliveryMethod || 'سكوتر دايون');

  const driverId = currentUser?.uid || '';
  const totalEarnings = driver?.totalEarnings || 0;
  const avgDriverRating = driver?.rating || 5.0;
  const completedCount = driver?.completedOrders || 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !vehicle) return;
    try {
      await driverRepository.update(driverId, {
        phone,
        deliveryMethod: vehicle
      });
      await updateDoc(doc(db, 'users', driverId), {
        phone
      });
      alert(isRTL ? 'تم حفظ التغييرات بنجاح!' : 'Changes saved successfully!');
    } catch (err) {
      console.error(err);
      alert(isRTL ? 'حدث خطأ أثناء الحفظ' : 'Error saving profile');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  return (
    <div className="space-y-6 text-theme-text pb-24 font-sans">
      {/* Driver Badge Card */}
      <div className="bg-theme-card border border-theme-border rounded-[28px] p-6 shadow-sm flex items-center gap-4 theme-transition">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
          <User size={36} />
        </div>
        <div>
          <h3 className="font-black text-base text-theme-text">{driver?.name || currentUser?.name || 'كابتن'}</h3>
          <p className="text-[10px] text-theme-muted font-bold mt-1">ID: {driverId}</p>
          <div className="flex items-center gap-1 mt-2 text-amber-500 font-bold text-xs">
            <Star size={14} fill="currentColor" />
            <span>{avgDriverRating}</span>
            <span className="text-[10px] text-theme-muted font-bold">({completedCount} {t('str_1125') || 'Deliveries'})</span>
          </div>
        </div>
      </div>

      {/* Finance Stats widget */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-theme-card border border-theme-border p-4 rounded-[24px] theme-transition shadow-sm">
          <span className="text-[10px] text-theme-muted font-black block uppercase tracking-wider">{t('str_1113') || 'Today Earnings'}</span>
          <p className="text-lg font-black text-theme-text mt-2">{Math.round(totalEarnings * 0.1)} {t('currencyEGP') || 'ج.م'}</p>
          <span className="text-[8px] text-green-500 font-bold block mt-1">{t('str_1126') || 'Daily Target Reached'}</span>
        </div>
        <div className="bg-theme-card border border-theme-border p-4 rounded-[24px] theme-transition shadow-sm">
          <span className="text-[10px] text-theme-muted font-black block uppercase tracking-wider">{t('str_1127') || 'Total Balance'}</span>
          <p className="text-lg font-black text-theme-text mt-2">{totalEarnings} {t('currencyEGP') || 'ج.م'}</p>
          <span className="text-[8px] text-primary font-bold block mt-1">{t('str_1128') || 'Total Wallet Cash'}</span>
        </div>
      </div>

      {/* Info Form */}
      <div className="bg-theme-card border border-theme-border rounded-[30px] p-5 space-y-4 shadow-sm theme-transition">
        <h4 className="font-black text-theme-text text-sm border-b border-theme-border/60 pb-3">
          {t('str_1129') || 'Edit Driver Profile'}
        </h4>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-[10px] text-theme-muted font-bold block mb-1.5">{t('str_1130') || 'Phone'}</label>
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border p-3.5 rounded-xl text-xs font-bold focus:border-primary outline-none text-theme-text transition"
            />
          </div>
          <div>
            <label className="text-[10px] text-theme-muted font-bold block mb-1.5">{t('str_1131') || 'Vehicle / Scooter'}</label>
            <input 
              type="text" 
              value={vehicle} 
              onChange={(e) => setVehicle(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border p-3.5 rounded-xl text-xs font-bold focus:border-primary outline-none text-theme-text transition"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-hover text-white font-black py-3.5 rounded-xl text-xs shadow-md transition"
          >
            {t('str_413') || 'Save'}
          </button>
        </form>
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-500/10 border border-red-500/20 text-red-500 font-black py-4 rounded-2xl flex items-center justify-center gap-1.5 hover:bg-red-500/15 transition active:scale-95 shadow-sm"
      >
        <LogOut size={16} />
        <span>{t('str_1132') || 'Log Out'}</span>
      </button>
    </div>
  );
};

export default DriverProfile;
