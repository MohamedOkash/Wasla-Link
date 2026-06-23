import { useTranslation } from '../../hooks/useTranslation';
import React, { useState } from 'react';
import { ChevronLeft, Camera, Upload, CheckCircle, Bike, User, Shield, Check } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { PremiumInput } from '../../components/premium/PremiumInput';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { mediaService } from '../../services/media.service';

interface DriverRegistrationProps {
  onBack: () => void;
}

export const DriverRegistration: React.FC<DriverRegistrationProps> = ({ onBack }) => {
  const { currentUser, showToast, isRTL } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [vehicleNumber, setVehicleNumber] = useState('');
  
  // Files
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
  const {} = useTranslation();

    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const validateStep = () => {
    if (step === 1 && (!name || !phone)) return false;
    if (step === 2 && nationalId.length !== 14) return false;
    if (step === 3 && (!vehicleType || !vehicleNumber)) return false;
    if (step === 4 && (!idCardFile || !licenseFile)) return false;
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep(s => s + 1);
    else showToast(t('str_1133'), 'warning');
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // Upload files
      const idCardUrl = await mediaService.uploadImage(idCardFile!, `drivers/${currentUser.uid}/id_card`);
      const licenseUrl = await mediaService.uploadImage(licenseFile!, `drivers/${currentUser.uid}/license`);

      await setDoc(doc(db, 'drivers', currentUser.uid), {
        uid: currentUser.uid,
        name,
        phone,
        nationalId,
        nationalIdImage: idCardUrl,
        licenseImage: licenseUrl,
        vehicleType,
        vehicleNumber,
        role: 'driver',
        status: 'pending',
        isApproved: false,
        isActive: false,
        rating: 5.0,
        completedOrders: 0,
        totalDeliveries: 0,
        totalEarnings: 0,
        currentOrderId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        availability: 'offline'
      });

      setSubmitted(true);
    } catch (error) {
      console.error(error);
      showToast(t('str_1134'), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-theme-bg h-full flex flex-col items-center justify-center p-6 text-center animate-fade-in z-[100] fixed inset-0">
        <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-2xl font-black mb-2 text-theme-text">{t('str_1135')}</h2>
        <p className="text-theme-muted mb-8 max-w-xs font-bold leading-relaxed">
          {t('str_1136')}
        </p>
        <PremiumButton onClick={onBack} variant="primary" className="w-full max-w-[200px]">
          {t('str_1137')}
        </PremiumButton>
      </div>
    );
  }

  return (
    <div className="bg-theme-bg h-full flex flex-col overflow-hidden animate-slide-in-right pb-20 z-[100] fixed inset-0">
      <div className="bg-theme-card px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 border-b border-theme-border/60 flex items-center gap-3.5 z-20">
        <button onClick={onBack} className="p-2.5 text-theme-text bg-theme-bg hover:bg-theme-border/50 rounded-full transition border border-theme-border/30">
          <ChevronLeft size={18} className={isRTL ? '' : 'rotate-180'} />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-black text-theme-text">{t('str_1138')}</h2>
          <div className="flex gap-1 mt-1.5">
            {[1,2,3,4,5].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-theme-border/50'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <PremiumCard hoverable={false} className="animate-fade-in">
          
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <User size={24} />
                <h3 className="font-black text-lg">{t('str_937')}</h3>
              </div>
              <PremiumInput label={t('str_233')} value={name} onChange={e => setName(e.target.value)} />
              <PremiumInput label={t('str_1139')} type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <Shield size={24} />
                <h3 className="font-black text-lg">{t('str_1140')}</h3>
              </div>
              <PremiumInput 
                label={t('str_1141')} 
                type="number" 
                maxLength={14}
                value={nationalId} 
                onChange={e => setNationalId(e.target.value)} 
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <Bike size={24} />
                <h3 className="font-black text-lg">{t('str_1142')}</h3>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-theme-muted">{t('str_1143')}</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition text-theme-text"
                >
                  <option value="motorcycle">{t('str_1144')}</option>
                  <option value="car">{t('str_1145')}</option>
                  <option value="bicycle">{t('str_1146')}</option>
                </select>
              </div>
              <PremiumInput label={t('str_1147')} value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2 text-primary">
                <Camera size={24} />
                <h3 className="font-black text-lg">{t('str_1148')}</h3>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-theme-muted block">{t('str_1149')}</label>
                <label className="w-full py-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/10 transition">
                  {idCardFile ? <Check size={20} className="text-green-500" /> : <Upload size={20} />}
                  <span className="text-sm font-bold">{idCardFile ? idCardFile.name : (t('str_1150'))}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, setIdCardFile)} />
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-theme-muted block">{t('str_1151')}</label>
                <label className="w-full py-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/10 transition">
                  {licenseFile ? <Check size={20} className="text-green-500" /> : <Upload size={20} />}
                  <span className="text-sm font-bold">{licenseFile ? licenseFile.name : (t('str_1150'))}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, setLicenseFile)} />
                </label>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 text-green-500">
                <CheckCircle size={24} />
                <h3 className="font-black text-lg">{t('str_1152')}</h3>
              </div>
              <div className="bg-theme-bg p-4 rounded-xl space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-theme-muted">الاسم:</span> <span className="font-black text-theme-text">{name}</span></div>
                <div className="flex justify-between"><span className="text-theme-muted">الهاتف:</span> <span className="font-black text-theme-text">{phone}</span></div>
                <div className="flex justify-between"><span className="text-theme-muted">الرقم القومي:</span> <span className="font-black text-theme-text">{nationalId}</span></div>
                <div className="flex justify-between"><span className="text-theme-muted">المركبة:</span> <span className="font-black text-theme-text">{vehicleType} - {vehicleNumber}</span></div>
              </div>
            </div>
          )}

        </PremiumCard>

        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <PremiumButton variant="secondary" onClick={() => setStep(s => s - 1)} className="flex-1">
              {t('str_330')}
            </PremiumButton>
          )}
          {step < 5 ? (
            <PremiumButton variant="primary" onClick={handleNext} className="flex-[2]">
              {t('str_1153')}
            </PremiumButton>
          ) : (
            <PremiumButton variant="primary" onClick={handleSubmit} disabled={loading} className="flex-[2]">
              {loading ? (t('str_1154')) : (t('str_1155'))}
            </PremiumButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverRegistration;
