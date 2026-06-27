import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Save, Settings, ShieldAlert, Sparkles, MapPin, DollarSign, CloudRain, Percent } from 'lucide-react';

export const DeliveryConfig: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL, platformSettings, updatePlatformSettings, showToast } = useApp();

  const [baseFee, setBaseFee] = useState(10);
  const [pricePerKm, setPricePerKm] = useState(3);
  const [minFee, setMinFee] = useState(10);
  const [maxFee, setMaxFee] = useState(100);
  const [peakMultiplier, setPeakMultiplier] = useState(1.0);
  const [nightMultiplier, setNightMultiplier] = useState(1.0);
  const [holidayMultiplier, setHolidayMultiplier] = useState(1.0);
  const [rainMultiplier, setRainMultiplier] = useState(1.0);
  const [remoteMultiplier, setRemoteMultiplier] = useState(1.0);
  const [freeThreshold, setFreeThreshold] = useState(250);
  const [commission, setCommission] = useState(10);
  const [driverBonus, setDriverBonus] = useState(0);
  const [roadFactor, setRoadFactor] = useState(1.35);
  const [averageSpeed, setAverageSpeed] = useState(30);

  useEffect(() => {
    if (platformSettings) {
      setBaseFee(platformSettings.baseDeliveryFee ?? 10);
      setPricePerKm(platformSettings.pricePerKm ?? 3);
      setMinFee(platformSettings.minimumDeliveryFee ?? 10);
      setMaxFee(platformSettings.maximumDeliveryFee ?? 100);
      setPeakMultiplier(platformSettings.peakHourMultiplier ?? 1.0);
      setNightMultiplier(platformSettings.nightMultiplier ?? 1.0);
      setHolidayMultiplier(platformSettings.holidayMultiplier ?? 1.0);
      setRainMultiplier(platformSettings.rainMultiplier ?? 1.0);
      setRemoteMultiplier(platformSettings.remoteAreaMultiplier ?? 1.0);
      setFreeThreshold(platformSettings.freeDeliveryThreshold ?? 250);
      setCommission(platformSettings.commissionPercent ?? 10);
      setDriverBonus(platformSettings.driverBonusPercent ?? 0);
      setRoadFactor(platformSettings.roadFactor ?? 1.35);
      setAverageSpeed(platformSettings.averageSpeed ?? 30);
    }
  }, [platformSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformSettings) return;

    const updated = {
      ...platformSettings,
      baseDeliveryFee: Number(baseFee),
      pricePerKm: Number(pricePerKm),
      minimumDeliveryFee: Number(minFee),
      maximumDeliveryFee: Number(maxFee),
      peakHourMultiplier: Number(peakMultiplier),
      nightMultiplier: Number(nightMultiplier),
      holidayMultiplier: Number(holidayMultiplier),
      rainMultiplier: Number(rainMultiplier),
      remoteAreaMultiplier: Number(remoteMultiplier),
      freeDeliveryThreshold: Number(freeThreshold),
      commissionPercent: Number(commission),
      driverBonusPercent: Number(driverBonus),
      roadFactor: Number(roadFactor),
      averageSpeed: Number(averageSpeed)
    };

    await updatePlatformSettings(updated);
    showToast(t('str_515'));
  };

  return (
    <div className="space-y-6 text-theme-text animate-fade-in pb-10">
      <div className="bg-theme-card p-5 rounded-[28px] border border-theme-border shadow-sm theme-transition">
        <h3 className="font-black text-theme-text text-sm mb-1 flex items-center gap-2">
          <Settings className="text-primary w-5 h-5" />
          {isRTL ? 'مركز تسعير التوصيل الذكي (مفتوح المصدر)' : 'Smart Delivery Pricing Center (Open Source)'}
        </h3>
        <p className="text-[10px] text-theme-muted font-bold mb-6">
          {isRTL 
            ? 'تحديد معايير تسعير التوصيل التلقائي وعمولة المنصة وبونص السائق باستخدام الخرائط الحرة وحسابات المسافة.' 
            : 'Configure automated delivery pricing parameters, platform commission, and driver bonuses powered by open maps and routing calculations.'}
        </p>

        <form onSubmit={handleSave} className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Core Pricing Section */}
            <div className="p-4 bg-theme-bg/30 border border-theme-border/60 rounded-2xl space-y-4">
              <h4 className="font-black text-xs text-green-500 flex items-center gap-1.5">
                <DollarSign size={14} />
                {isRTL ? 'إعدادات التسعير الأساسية' : 'Core Tariff Settings'}
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black text-theme-muted block mb-1">
                    {isRTL ? 'الرسوم الأساسية (ج.م)' : 'Base Delivery Fee (EGP)'}
                  </label>
                  <input
                    type="number"
                    value={baseFee}
                    onChange={(e) => setBaseFee(Number(e.target.value))}
                    className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-theme-muted block mb-1">
                    {isRTL ? 'السعر لكل كيلومتر (ج.م)' : 'Price Per KM (EGP)'}
                  </label>
                  <input
                    type="number"
                    value={pricePerKm}
                    onChange={(e) => setPricePerKm(Number(e.target.value))}
                    className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-theme-muted block mb-1">
                    {isRTL ? 'الحد الأدنى لرسوم التوصيل' : 'Minimum Delivery Fee'}
                  </label>
                  <input
                    type="number"
                    value={minFee}
                    onChange={(e) => setMinFee(Number(e.target.value))}
                    className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-theme-muted block mb-1">
                    {isRTL ? 'الحد الأقصى لرسوم التوصيل' : 'Maximum Delivery Fee'}
                  </label>
                  <input
                    type="number"
                    value={maxFee}
                    onChange={(e) => setMaxFee(Number(e.target.value))}
                    className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black text-theme-muted block mb-1">
                    {isRTL ? 'مُعامل زيادة مسار الطريق' : 'Road Distance Factor'}
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={roadFactor}
                    onChange={(e) => setRoadFactor(Number(e.target.value))}
                    className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-theme-muted block mb-1">
                    {isRTL ? 'متوسط سرعة التوصيل (كم/س)' : 'Average Speed (KM/H)'}
                  </label>
                  <input
                    type="number"
                    value={averageSpeed}
                    onChange={(e) => setAverageSpeed(Number(e.target.value))}
                    className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="text-[9px] font-black text-theme-muted block mb-1">
                  {isRTL ? 'حد التوصيل المجاني للطلبات (ج.م)' : 'Free Delivery Order Threshold (EGP)'}
                </label>
                <input
                  type="number"
                  value={freeThreshold}
                  onChange={(e) => setFreeThreshold(Number(e.target.value))}
                  className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                  required
                />
              </div>
            </div>

            {/* Platform & Driver Settings */}
            <div className="p-4 bg-theme-bg/30 border border-theme-border/60 rounded-2xl space-y-4">
              <h4 className="font-black text-xs text-indigo-500 flex items-center gap-1.5">
                <Percent size={14} />
                {isRTL ? 'العمولة وبونص التشغيل' : 'Platform & Driver Settings'}
              </h4>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-black text-theme-muted block mb-1">
                    {isRTL ? 'عمولة المنصة على المبيعات (%)' : 'Platform Sales Commission (%)'}
                  </label>
                  <input
                    type="number"
                    value={commission}
                    onChange={(e) => setCommission(Number(e.target.value))}
                    className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-[9px] font-black text-theme-muted block mb-1">
                    {isRTL ? 'بونص السائق الإضافي (%)' : 'Additional Driver Bonus (%)'}
                  </label>
                  <input
                    type="number"
                    value={driverBonus}
                    onChange={(e) => setDriverBonus(Number(e.target.value))}
                    className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Multipliers */}
          <div className="p-4 bg-theme-bg/30 border border-theme-border/60 rounded-2xl space-y-4">
            <h4 className="font-black text-xs text-amber-500 flex items-center gap-1.5">
              <CloudRain size={14} />
              {isRTL ? 'مضاعفات التسعير الذكي (ضرب)' : 'Smart Pricing Multipliers (Multiplicative factors)'}
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-[9px] font-black text-theme-muted block mb-1">
                  {isRTL ? 'ساعات الذروة' : 'Peak Hours'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={peakMultiplier}
                  onChange={(e) => setPeakMultiplier(Number(e.target.value))}
                  className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-theme-muted block mb-1">
                  {isRTL ? 'الفترة الليلية' : 'Night Hours'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={nightMultiplier}
                  onChange={(e) => setNightMultiplier(Number(e.target.value))}
                  className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-theme-muted block mb-1">
                  {isRTL ? 'أيام العطلات' : 'Holidays'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={holidayMultiplier}
                  onChange={(e) => setHolidayMultiplier(Number(e.target.value))}
                  className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-theme-muted block mb-1">
                  {isRTL ? 'أجواء ماطرة' : 'Rainy Weather'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={rainMultiplier}
                  onChange={(e) => setRainMultiplier(Number(e.target.value))}
                  className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-theme-muted block mb-1">
                  {isRTL ? 'مناطق نائية' : 'Remote Area'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={remoteMultiplier}
                  onChange={(e) => setRemoteMultiplier(Number(e.target.value))}
                  className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-black text-xs px-6 py-3.5 rounded-2xl shadow transition"
            >
              <Save size={16} />
              {isRTL ? 'حفظ إعدادات التسعير' : 'Save Pricing Tariff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
