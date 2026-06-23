import { useTranslation } from '../../hooks/useTranslation';
import React, { useState } from 'react';
import { User, Phone, Bike, Star, DollarSign, LogOut, ShieldAlert } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useReviews } from '../../hooks/useReviews';

export const DriverProfile: React.FC = () => {
  const { currentUser, setCurrentUser, setRole, goHome, orders, lang, isRTL } = useApp();
  const { reviews } = useReviews();;
  const [phone, setPhone] = useState(currentUser?.phone || '01022334455');
  const [vehicle, setVehicle] = useState(currentUser?.vehicleType || 'سكوتر دايون');

  const driverId = currentUser?.email || 'd1';

  // Calculations
  const driverOrders = orders.filter(o => o.driverId === driverId && o.status === 'delivered');
  const totalEarnings = driverOrders.reduce((sum, o) => sum + o.deliveryFee, 0);

  const driverReviews = reviews.filter(r => r.driverId === 'd1' || r.driverId === driverId);
  const avgDriverRating = driverReviews.length > 0
    ? (driverReviews.reduce((sum, r) => sum + r.ratingDriver, 0) / driverReviews.length).toFixed(1)
    : '4.8';

  const handleSave = (e: React.FormEvent) => {
  const {} = useTranslation();

    e.preventDefault();
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        phone,
        vehicleType: vehicle
      });
      alert(t('str_219'));
    }
  };

  const handleLogout = () => {
    goHome();
  };

  return (
    <div className="space-y-6 text-theme-text pb-24">
      {/* Driver Badge Card */}
      <div className="bg-theme-card border border-theme-border rounded-[28px] p-6 shadow-sm flex items-center gap-4 theme-transition animate-card-entrance">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
          <User size={36} />
        </div>
        <div>
          <h3 className="font-black text-base text-theme-text">{currentUser?.name || 'كابتن محمود رضا'}</h3>
          <p className="text-[10px] text-theme-muted font-bold mt-1">ID: {driverId}</p>
          <div className="flex items-center gap-1 mt-2 text-amber-500 font-bold text-xs">
            <Star size={14} fill="currentColor" />
            <span>{avgDriverRating}</span>
            <span className="text-[10px] text-theme-muted font-bold">({driverOrders.length} {t('str_1125')})</span>
          </div>
        </div>
      </div>

      {/* Finance Stats widget */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-theme-card border border-theme-border p-4 rounded-[24px] theme-transition shadow-sm">
          <span className="text-[10px] text-theme-muted font-black block uppercase tracking-wider">{t('str_1113')}</span>
          <p className="text-lg font-black text-theme-text mt-2">{totalEarnings} ج.م</p>
          <span className="text-[8px] text-green-500 font-bold block mt-1">{t('str_1126')}</span>
        </div>
        <div className="bg-theme-card border border-theme-border p-4 rounded-[24px] theme-transition shadow-sm">
          <span className="text-[10px] text-theme-muted font-black block uppercase tracking-wider">{t('str_1127')}</span>
          <p className="text-lg font-black text-theme-text mt-2">{totalEarnings + 145} ج.م</p>
          <span className="text-[8px] text-primary font-bold block mt-1">{t('str_1128')}</span>
        </div>
      </div>

      {/* Info Form */}
      <div className="bg-theme-card border border-theme-border rounded-[30px] p-5 space-y-4 shadow-sm theme-transition">
        <h4 className="font-black text-theme-text text-sm border-b border-theme-border/60 pb-3">
          {t('str_1129')}
        </h4>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-[10px] text-theme-muted font-bold block mb-1.5">{t('str_1130')}</label>
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border p-3.5 rounded-xl text-xs font-bold focus:border-primary outline-none text-theme-text transition"
            />
          </div>
          <div>
            <label className="text-[10px] text-theme-muted font-bold block mb-1.5">{t('str_1131')}</label>
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
            {t('str_413')}
          </button>
        </form>
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-500/10 border border-red-500/20 text-red-500 font-black py-4 rounded-2xl flex items-center justify-center gap-1.5 hover:bg-red-500/15 transition active:scale-95 shadow-sm"
      >
        <LogOut size={16} />
        <span>{t('str_1132')}</span>
      </button>
    </div>
  );
};

export default DriverProfile;
