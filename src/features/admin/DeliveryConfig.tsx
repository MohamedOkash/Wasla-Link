import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Save, Plus, Trash2, MapPin } from 'lucide-react';

export const DeliveryConfig: React.FC = () => {
  const { isRTL, deliveryFeeConfig, updateDeliveryFeeConfig, showToast } = useApp();

  const [sameFee, setSameFee] = useState(5);
  const [nearFee, setNearFee] = useState(15);
  const [farFee, setFarFee] = useState(25);

  const [sameEta, setSameEta] = useState('15-20 دقيقة');
  const [nearEta, setNearEta] = useState('25-35 دقيقة');
  const [farEta, setFarEta] = useState('40-60 دقيقة');

  const [classifications, setClassifications] = useState<Record<string, 'same' | 'near' | 'far'>>({});
  
  // States for adding a new village classification
  const [newVillage, setNewVillage] = useState('');
  const [newClass, setNewClass] = useState<'same' | 'near' | 'far'>('near');

  useEffect(() => {
    if (deliveryFeeConfig) {
      setSameFee(deliveryFeeConfig.sameVillageFee);
      setNearFee(deliveryFeeConfig.nearVillageFee);
      setFarFee(deliveryFeeConfig.farVillageFee);
      setSameEta(deliveryFeeConfig.sameVillageEta);
      setNearEta(deliveryFeeConfig.nearVillageEta);
      setFarEta(deliveryFeeConfig.farVillageEta);
      setClassifications(deliveryFeeConfig.villageClassifications || {});
    }
  }, [deliveryFeeConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      sameVillageFee: Number(sameFee),
      nearVillageFee: Number(nearFee),
      farVillageFee: Number(farFee),
      sameVillageEta: sameEta,
      nearVillageEta: nearEta,
      farVillageEta: farEta,
      villageClassifications: classifications
    };
    await updateDeliveryFeeConfig(updated);
  };

  const handleAddVillage = () => {
  const {} = useTranslation();

    if (!newVillage.trim()) return;
    setClassifications(prev => ({
      ...prev,
      [newVillage.trim()]: newClass
    }));
    setNewVillage('');
    showToast(t('str_515'));
  };

  const handleRemoveVillage = (village: string) => {
    setClassifications(prev => {
      const next = { ...prev };
      delete next[village];
      return next;
    });
    showToast(t('str_516'));
  };

  return (
    <div className="space-y-6 text-theme-text animate-fade-in pb-10">
      <div className="bg-theme-card p-5 rounded-[28px] border border-theme-border shadow-sm theme-transition">
        <h3 className="font-black text-theme-text text-sm mb-1">
          {t('str_517')}
        </h3>
        <p className="text-[10px] text-theme-muted font-bold mb-6">
          {isRTL 
            ? 'تحديد أسعار توصيل الشحنات وتقدير الوقت بناءً على تصنيف القرية مقارنة بقرية المتجر.' 
            : 'Configure delivery tariffs and ETAs dynamically based on village classifications relative to store locations.'}
        </p>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Same Village */}
            <div className="p-4 bg-theme-bg/30 border border-theme-border/60 rounded-2xl space-y-4">
              <h4 className="font-black text-xs text-primary flex items-center gap-1.5">
                <MapPin size={14} />
                {t('str_518')}
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-black text-theme-muted block mb-1">{t('str_519')}</label>
                  <input
                    type="number"
                    value={sameFee}
                    onChange={(e) => setSameFee(Number(e.target.value))}
                    className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-theme-muted block mb-1">{t('str_520')}</label>
                  <input
                    type="text"
                    value={sameEta}
                    onChange={(e) => setSameEta(e.target.value)}
                    className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Near Village */}
            <div className="p-4 bg-theme-bg/30 border border-theme-border/60 rounded-2xl space-y-4">
              <h4 className="font-black text-xs text-green-500 flex items-center gap-1.5">
                <MapPin size={14} />
                {t('str_521')}
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-black text-theme-muted block mb-1">{t('str_519')}</label>
                  <input
                    type="number"
                    value={nearFee}
                    onChange={(e) => setNearFee(Number(e.target.value))}
                    className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-theme-muted block mb-1">{t('str_520')}</label>
                  <input
                    type="text"
                    value={nearEta}
                    onChange={(e) => setNearEta(e.target.value)}
                    className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Far Village */}
            <div className="p-4 bg-theme-bg/30 border border-theme-border/60 rounded-2xl space-y-4">
              <h4 className="font-black text-xs text-amber-500 flex items-center gap-1.5">
                <MapPin size={14} />
                {t('str_522')}
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-black text-theme-muted block mb-1">{t('str_519')}</label>
                  <input
                    type="number"
                    value={farFee}
                    onChange={(e) => setFarFee(Number(e.target.value))}
                    className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-theme-muted block mb-1">{t('str_520')}</label>
                  <input
                    type="text"
                    value={farEta}
                    onChange={(e) => setFarEta(e.target.value)}
                    className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-black text-xs px-5 py-3 rounded-2xl shadow transition"
            >
              <Save size={16} />
              {t('str_523')}
            </button>
          </div>
        </form>
      </div>

      {/* Classifications Manager */}
      <div className="bg-theme-card p-5 rounded-[28px] border border-theme-border shadow-sm theme-transition">
        <h3 className="font-black text-theme-text text-sm mb-4">
          {t('str_524')}
        </h3>

        {/* Add village form */}
        <div className="flex flex-col sm:flex-row gap-3 bg-theme-bg/20 p-4 rounded-2xl border border-theme-border/60 mb-5">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('str_525')}
              value={newVillage}
              onChange={(e) => setNewVillage(e.target.value)}
              className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2.5 text-xs font-bold focus:border-primary outline-none text-theme-text"
            />
          </div>
          <div className="w-full sm:w-44">
            <select
              value={newClass}
              onChange={(e) => setNewClass(e.target.value as any)}
              className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2.5 text-xs font-bold focus:border-primary outline-none text-theme-text"
            >
              <option value="same">{t('str_526')}</option>
              <option value="near">{t('str_521')}</option>
              <option value="far">{t('str_522')}</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleAddVillage}
            className="flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-hover text-white font-black text-xs px-5 py-2.5 rounded-xl transition"
          >
            <Plus size={15} />
            {t('str_527')}
          </button>
        </div>

        {/* Villages List */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-right text-xs">
            <thead>
              <tr className="border-b border-theme-border/60 text-theme-muted font-black text-[10px]">
                <th className="py-2.5 px-3">{t('str_528')}</th>
                <th className="py-2.5 px-3">{t('str_529')}</th>
                <th className="py-2.5 px-3 w-16 text-center">{t('str_530')}</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(classifications).length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-6 font-bold text-theme-muted">
                    {t('str_531')}
                  </td>
                </tr>
              ) : (
                Object.entries(classifications).map(([villageName, classVal]) => (
                  <tr key={villageName} className="border-b border-theme-border/40 hover:bg-theme-bg/10">
                    <td className="py-3 px-3 font-bold">{villageName}</td>
                    <td className="py-3 px-3 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        classVal === 'same' ? 'bg-primary/10 text-primary' :
                        classVal === 'near' ? 'bg-green-500/10 text-green-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {classVal === 'same' ? (t('str_526')) :
                         classVal === 'near' ? (t('str_532')) :
                         (t('str_533'))}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleRemoveVillage(villageName)}
                        className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
