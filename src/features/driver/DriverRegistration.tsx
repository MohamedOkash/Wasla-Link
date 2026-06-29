import { useTranslation } from '../../hooks/useTranslation';
import React, { useState } from 'react';
import { ChevronLeft, Camera, Upload, CheckCircle, Bike, User, Shield, Check, MapPin } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { PremiumInput } from '../../components/premium/PremiumInput';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { serverTimestamp } from 'firebase/firestore';
import { mediaService } from '../../services/media.service';
import { driverRepository } from "../../services/driver/repository";
import { DriverStatus } from '../../types/driver.types';

interface DriverRegistrationProps {
  onBack: () => void;
}

export const DriverRegistration: React.FC<DriverRegistrationProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { currentUser, showToast, isRTL } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form State (Required)
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');
  const [village, setVillage] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('motorcycle');
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);

  // Form State (Optional)
  const [nationalId, setNationalId] = useState('');
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [vehicleFile, setVehicleFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const validateStep = () => {
    if (step === 1 && (!name || !phone || !profilePhotoFile)) return false;
    if (step === 2 && (!governorate || !city || !village)) return false;
    if (step === 3 && !deliveryMethod) return false;
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep(s => s + 1);
    else showToast(t('str_1133') || 'Please fill required fields', 'warning');
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // Upload files
      let profilePhotoUrl = '';
      if (profilePhotoFile) profilePhotoUrl = await mediaService.uploadImage(profilePhotoFile, `drivers/${currentUser.uid}/profile`);
      
      let idCardUrl = '';
      if (idCardFile) idCardUrl = await mediaService.uploadImage(idCardFile, `drivers/${currentUser.uid}/id_card`);
      
      let licenseUrl = '';
      if (licenseFile) licenseUrl = await mediaService.uploadImage(licenseFile, `drivers/${currentUser.uid}/license`);
      
      let vehicleUrl = '';
      if (vehicleFile) vehicleUrl = await mediaService.uploadImage(vehicleFile, `drivers/${currentUser.uid}/vehicle`);

      const status: DriverStatus = 'pending_review';

      await driverRepository.create(currentUser.uid, {
        uid: currentUser.uid,
        name,
        phone,
        governorate,
        city,
        village,
        deliveryMethod,
        profilePhotoUrl,
        nationalIdNumber: nationalId,
        nationalIdImageUrl: idCardUrl,
        drivingLicenseUrl: licenseUrl,
        vehicleImageUrl: vehicleUrl,
        
        status,
        role: 'driver',
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
      } as any);

      setSubmitted(true);
      showToast('Registration submitted successfully!', 'success');
    } catch (error) {
      console.error(error);
      showToast(t('str_1134') || 'Error submitting registration', 'error');
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
        <h2 className="text-2xl font-black mb-2 text-theme-text">{t('str_1135') || 'Submitted Successfully'}</h2>
        <p className="text-theme-muted mb-8 max-w-xs font-bold leading-relaxed">
          {t('str_1136') || 'Your application is under review.'}
        </p>
        <PremiumButton onClick={onBack} variant="primary" className="w-full max-w-[200px]">
          {t('str_1137') || 'Back'}
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
          <h2 className="text-sm font-black text-theme-text">{t('str_1138') || 'Driver Registration'}</h2>
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
                <h3 className="font-black text-lg">Personal Info</h3>
              </div>
              <PremiumInput label="Full Name" value={name} onChange={e => setName(e.target.value)} />
              <PremiumInput label="Phone Number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
              
              <div className="space-y-2 mt-4">
                <label className="text-xs font-bold text-theme-muted block">Profile Photo (Required)</label>
                <label className="w-full py-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/10 transition">
                  {profilePhotoFile ? <Check size={20} className="text-green-500" /> : <Camera size={20} />}
                  <span className="text-sm font-bold">{profilePhotoFile ? profilePhotoFile.name : 'Upload Photo'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, setProfilePhotoFile)} />
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <MapPin size={24} />
                <h3 className="font-black text-lg">Location</h3>
              </div>
              <PremiumInput label="Governorate" value={governorate} onChange={e => setGovernorate(e.target.value)} />
              <PremiumInput label="City / Center" value={city} onChange={e => setCity(e.target.value)} />
              <PremiumInput label="Village / District" value={village} onChange={e => setVillage(e.target.value)} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <Bike size={24} />
                <h3 className="font-black text-lg">Delivery Method</h3>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-theme-muted">Method (Required)</label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition text-theme-text"
                >
                  <option value="motorcycle">Motorcycle</option>
                  <option value="car">Car</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="walking">Walking</option>
                </select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2 text-primary">
                <Shield size={24} />
                <h3 className="font-black text-lg">Documents (Optional)</h3>
              </div>
              
              <PremiumInput 
                label="National ID Number" 
                type="number" 
                maxLength={14}
                value={nationalId} 
                onChange={e => setNationalId(e.target.value)} 
              />
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-theme-muted block">National ID Image</label>
                <label className="w-full py-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/10 transition">
                  {idCardFile ? <Check size={20} className="text-green-500" /> : <Upload size={20} />}
                  <span className="text-sm font-bold">{idCardFile ? idCardFile.name : 'Upload ID'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, setIdCardFile)} />
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-theme-muted block">Driving License Image</label>
                <label className="w-full py-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/10 transition">
                  {licenseFile ? <Check size={20} className="text-green-500" /> : <Upload size={20} />}
                  <span className="text-sm font-bold">{licenseFile ? licenseFile.name : 'Upload License'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, setLicenseFile)} />
                </label>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-theme-muted block">Vehicle Image</label>
                <label className="w-full py-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/10 transition">
                  {vehicleFile ? <Check size={20} className="text-green-500" /> : <Upload size={20} />}
                  <span className="text-sm font-bold">{vehicleFile ? vehicleFile.name : 'Upload Vehicle Photo'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, setVehicleFile)} />
                </label>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 text-green-500">
                <CheckCircle size={24} />
                <h3 className="font-black text-lg">Review</h3>
              </div>
              <div className="bg-theme-bg p-4 rounded-xl space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-theme-muted">Name:</span> <span className="font-black text-theme-text">{name}</span></div>
                <div className="flex justify-between"><span className="text-theme-muted">Phone:</span> <span className="font-black text-theme-text">{phone}</span></div>
                <div className="flex justify-between"><span className="text-theme-muted">Method:</span> <span className="font-black text-theme-text">{deliveryMethod}</span></div>
              </div>
            </div>
          )}

        </PremiumCard>

        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <PremiumButton variant="secondary" onClick={() => setStep(s => s - 1)} className="flex-1">
              {t('str_330') || 'Back'}
            </PremiumButton>
          )}
          {step < 5 ? (
            <PremiumButton variant="primary" onClick={handleNext} className="flex-[2]">
              {t('str_1153') || 'Next'}
            </PremiumButton>
          ) : (
            <PremiumButton variant="primary" onClick={handleSubmit} disabled={loading} className="flex-[2]">
              {loading ? 'Submitting...' : 'Submit'}
            </PremiumButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverRegistration;
