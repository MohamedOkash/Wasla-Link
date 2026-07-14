import { useTranslation } from '../../hooks/useTranslation';
import React, { useState } from 'react';
import { ChevronLeft, Camera, Upload, CheckCircle, Bike, User, Shield, Check, MapPin, CreditCard, ClipboardList } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { PremiumInput } from '../../components/premium/PremiumInput';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { serverTimestamp } from 'firebase/firestore';
import { mediaService } from '../../services/media.service';
import { driverRepository } from "../../services/driver/repository";
import { EGYPT_REGIONS } from '../auth/AuthScreen';

interface DriverRegistrationProps {
  onBack: () => void;
}

export const DriverRegistration: React.FC<DriverRegistrationProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { currentUser, showToast, isRTL, lang } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // STEP 1: Personal Info
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [birthdate, setBirthdate] = useState('');
  const [nationalId, setNationalId] = useState('');

  // STEP 2: Address
  const [governorate, setGovernorate] = useState('الدقهلية');
  const [city, setCity] = useState('السنبلاوين');
  const [village, setVillage] = useState('ميت غراب');

  // STEP 3: Vehicle details
  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');

  // STEP 4: Profile Photo
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);

  // STEP 5: Document Uploads & Expiries
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
  const [nationalIdExpiry, setNationalIdExpiry] = useState('');
  
  const [drivingLicenseFile, setDrivingLicenseFile] = useState<File | null>(null);
  const [drivingLicenseExpiry, setDrivingLicenseExpiry] = useState('');
  
  const [vehicleLicenseFile, setVehicleLicenseFile] = useState<File | null>(null);
  const [vehicleLicenseExpiry, setVehicleLicenseExpiry] = useState('');
  
  const [vehicleFile, setVehicleFile] = useState<File | null>(null);
  
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [insuranceExpiry, setInsuranceExpiry] = useState('');

  // STEP 6: Finance details
  const [instaPayAddress, setInstaPayAddress] = useState('');
  const [vodafoneCashNumber, setVodafoneCashNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const getAvailableCities = () => {
    return EGYPT_REGIONS[governorate]?.cities ? Object.keys(EGYPT_REGIONS[governorate].cities) : ['أخرى'];
  };

  const getAvailableVillages = () => {
    const cityData = EGYPT_REGIONS[governorate]?.cities[city];
    return cityData || ['أخرى'];
  };

  const validateStep = () => {
    if (step === 1 && (!name || !phone || !nationalId || nationalId.length !== 14 || !birthdate)) {
      showToast(isRTL ? 'يرجى إدخال اسمك ورقم هاتفك ورقم قومي صحيح (14 رقم)' : 'Please enter your name, phone and a valid 14-digit National ID', 'warning');
      return false;
    }
    if (step === 2 && (!governorate || !city || !village)) {
      showToast(isRTL ? 'يرجى تحديد العنوان بالكامل' : 'Please select your full address', 'warning');
      return false;
    }
    if (step === 3 && (!vehicleBrand || !vehicleModel || !plateNumber || !vehicleColor || !vehicleYear)) {
      showToast(isRTL ? 'يرجى إكمال بيانات المركبة بالكامل' : 'Please complete all vehicle details', 'warning');
      return false;
    }
    if (step === 4 && !profilePhotoFile) {
      showToast(isRTL ? 'الصورة الشخصية مطلوبة' : 'Profile photo is required', 'warning');
      return false;
    }
    if (step === 5 && (!nationalIdFile || !nationalIdExpiry || !drivingLicenseFile || !drivingLicenseExpiry || !vehicleLicenseFile || !vehicleLicenseExpiry || !vehicleFile)) {
      showToast(isRTL ? 'يرجى رفع جميع المستندات المطلوبة وتحديد تواريخ الانتهاء' : 'Please upload all required documents and specify expiry dates', 'warning');
      return false;
    }
    if (step === 6 && (!instaPayAddress && !vodafoneCashNumber && (!bankName || !bankAccount))) {
      showToast(isRTL ? 'يرجى إدخال وسيلة دفع واحدة على الأقل للاستلام' : 'Please enter at least one payout method', 'warning');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // 1. Upload files
      let profilePhotoUrl = '';
      if (profilePhotoFile) profilePhotoUrl = await mediaService.uploadImage(profilePhotoFile, `drivers/${currentUser.uid}/profile`);
      
      let nationalIdImageUrl = '';
      if (nationalIdFile) nationalIdImageUrl = await mediaService.uploadImage(nationalIdFile, `drivers/${currentUser.uid}/national_id`);
      
      let drivingLicenseUrl = '';
      if (drivingLicenseFile) drivingLicenseUrl = await mediaService.uploadImage(drivingLicenseFile, `drivers/${currentUser.uid}/license`);
      
      let vehicleLicenseUrl = '';
      if (vehicleLicenseFile) vehicleLicenseUrl = await mediaService.uploadImage(vehicleLicenseFile, `drivers/${currentUser.uid}/vehicle_license`);

      let vehicleImageUrl = '';
      if (vehicleFile) vehicleImageUrl = await mediaService.uploadImage(vehicleFile, `drivers/${currentUser.uid}/vehicle_photo`);
      
      let insuranceImageUrl = '';
      if (insuranceFile) insuranceImageUrl = await mediaService.uploadImage(insuranceFile, `drivers/${currentUser.uid}/insurance`);

      // 2. Submit to repository
      await driverRepository.create(currentUser.uid, {
        uid: currentUser.uid,
        name,
        phone,
        email: currentUser.email || '',
        governorate,
        city,
        village,
        deliveryMethod: vehicleType,
        birthdate,
        
        vehicles: [{
          type: vehicleType,
          brand: vehicleBrand,
          model: vehicleModel,
          plateNumber,
          color: vehicleColor,
          year: vehicleYear,
          isPrimary: true,
          status: 'active'
        }],

        workingZones: [{
          governorate,
          center: city,
          village
        }],
        maxDistance: 15,
        preferredAreas: [village],

        availabilitySettings: {
          workingDays: [0, 1, 2, 3, 4, 5, 6],
          workingHours: { start: '08:00', end: '23:00' },
          breakTime: null,
          vacationMode: false,
          emergencyOffline: false
        },

        profilePhotoUrl,
        nationalIdNumber: nationalId,
        nationalIdImageUrl,
        nationalIdExpiry,
        drivingLicenseUrl,
        licenseExpiry: drivingLicenseExpiry,
        vehicleLicenseUrl,
        vehicleLicenseExpiry,
        vehicleImageUrl,
        insuranceImageUrl,
        insuranceExpiry,
        documentStatus: 'pending',

        status: 'pending_review',
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
        availability: 'offline',
        agreementAccepted: false,
        trainingCompleted: false,
        tier: 'bronze',
        score: 100,

        // Finance settings
        instaPayAddress,
        vodafoneCashNumber,
        bankName,
        bankAccount
      } as any);

      setSubmitted(true);
      showToast(isRTL ? 'تم تقديم طلب الانضمام بنجاح!' : 'Join request submitted successfully!', 'success');
    } catch (error) {
      console.error(error);
      showToast(isRTL ? 'خطأ أثناء تقديم الطلب' : 'Error submitting registration', 'error');
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
        <h2 className="text-2xl font-black mb-2 text-theme-text">{isRTL ? 'تم الإرسال بنجاح' : 'Submitted Successfully'}</h2>
        <p className="text-theme-muted mb-8 max-w-xs font-bold leading-relaxed">
          {isRTL ? 'طلبك الآن قيد المراجعة من قبل الإدارة وسنتواصل معك قريباً.' : 'Your application is under review by our administration. We will contact you soon.'}
        </p>
        <PremiumButton onClick={onBack} variant="primary" className="w-full max-w-[200px]">
          {isRTL ? 'العودة' : 'Back'}
        </PremiumButton>
      </div>
    );
  }

  return (
    <div className="bg-theme-bg h-full flex flex-col overflow-hidden animate-slide-in-right pb-20 z-[100] fixed inset-0 font-sans text-theme-text">
      <div className="bg-theme-card px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 border-b border-theme-border/60 flex items-center gap-3.5 z-20">
        <button onClick={onBack} className="p-2.5 text-theme-text bg-theme-bg hover:bg-theme-border/50 rounded-full transition border border-theme-border/30">
          <ChevronLeft size={18} className={isRTL ? '' : 'rotate-180'} />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-black text-theme-text">{isRTL ? 'تسجيل حساب مندوب' : 'Driver Registration'}</h2>
          <div className="flex gap-1 mt-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-theme-border/50'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <PremiumCard hoverable={false} className="animate-fade-in">
          
          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <User size={24} />
                <h3 className="font-black text-lg">{isRTL ? 'البيانات الشخصية' : 'Personal Info'}</h3>
              </div>
              <PremiumInput label={isRTL ? "الاسم بالكامل" : "Full Name"} value={name} onChange={e => setName(e.target.value)} />
              <PremiumInput label={isRTL ? "رقم الهاتف" : "Phone Number"} type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
              <div className="space-y-1">
                <label className="text-xs font-bold text-theme-muted">{isRTL ? "تاريخ الميلاد" : "Birthdate"}</label>
                <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} className="w-full bg-theme-bg border border-theme-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition text-theme-text" />
              </div>
              <PremiumInput label={isRTL ? "الرقم القومي (14 رقم)" : "National ID Number (14 Digits)"} type="number" maxLength={14} value={nationalId} onChange={e => setNationalId(e.target.value)} />
            </div>
          )}

          {/* STEP 2: Address Info */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <MapPin size={24} />
                <h3 className="font-black text-lg">{isRTL ? 'العنوان' : 'Address'}</h3>
              </div>
              <div>
                <label className="text-xs font-bold text-theme-muted block mb-1">{isRTL ? 'المحافظة' : 'Governorate'}</label>
                <select
                  value={governorate}
                  onChange={(e) => {
                    setGovernorate(e.target.value);
                    const firstCity = Object.keys(EGYPT_REGIONS[e.target.value]?.cities || {})[0] || 'أخرى';
                    setCity(firstCity);
                    const firstVillage = EGYPT_REGIONS[e.target.value]?.cities[firstCity]?.[0] || 'أخرى';
                    setVillage(firstVillage);
                  }}
                  className="w-full bg-theme-bg border border-theme-border/55 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-primary transition text-theme-text font-bold"
                >
                  {Object.keys(EGYPT_REGIONS).map(gov => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-theme-muted block mb-1">{isRTL ? 'المركز / المدينة' : 'City / Center'}</label>
                <select
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    const firstVillage = EGYPT_REGIONS[governorate]?.cities[e.target.value]?.[0] || 'أخرى';
                    setVillage(firstVillage);
                  }}
                  className="w-full bg-theme-bg border border-theme-border/55 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-primary transition text-theme-text font-bold"
                >
                  {getAvailableCities().map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-theme-muted block mb-1">{isRTL ? 'القرية / الحي' : 'Village / District'}</label>
                <select
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border/55 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-primary transition text-theme-text font-bold"
                >
                  {getAvailableVillages().map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 3: Vehicle details */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <Bike size={24} />
                <h3 className="font-black text-lg">{isRTL ? 'بيانات المركبة' : 'Vehicle Details'}</h3>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-theme-muted">{isRTL ? "وسيلة التوصيل" : "Delivery Method"}</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition text-theme-text"
                >
                  <option value="motorcycle">{isRTL ? 'موتوسيكل' : 'Motorcycle'}</option>
                  <option value="car">{isRTL ? 'سيارة' : 'Car'}</option>
                  <option value="bicycle">{isRTL ? 'دراجة هوائية' : 'Bicycle'}</option>
                  <option value="walking">{isRTL ? 'مشياً' : 'Walking'}</option>
                </select>
              </div>
              <PremiumInput label={isRTL ? "ماركة المركبة (مثال: دايون، هيونداي)" : "Vehicle Brand"} value={vehicleBrand} onChange={e => setVehicleBrand(e.target.value)} />
              <PremiumInput label={isRTL ? "الموديل (مثال: نيو 4، فيرنا)" : "Vehicle Model"} value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} />
              <PremiumInput label={isRTL ? "رقم اللوحة / حروف وأرقام" : "Plate Number"} value={plateNumber} onChange={e => setPlateNumber(e.target.value)} />
              <PremiumInput label={isRTL ? "اللون" : "Color"} value={vehicleColor} onChange={e => setVehicleColor(e.target.value)} />
              <PremiumInput label={isRTL ? "سنة الصنع" : "Year"} type="number" value={vehicleYear} onChange={e => setVehicleYear(e.target.value)} />
            </div>
          )}

          {/* STEP 4: Profile Photo */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <Camera size={24} />
                <h3 className="font-black text-lg">{isRTL ? 'الصورة الشخصية' : 'Profile Photo'}</h3>
              </div>
              <p className="text-xs text-theme-muted font-bold leading-relaxed">
                {isRTL ? 'يرجى تحميل صورة شخصية واضحة بوجه مكشوف بخلفية بيضاء أو محايدة.' : 'Please upload a clear profile photo with face visible on a neutral background.'}
              </p>
              <div className="space-y-2 mt-4">
                <label className="w-full py-6 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-primary/10 transition">
                  {profilePhotoFile ? <Check size={32} className="text-green-500" /> : <Camera size={32} />}
                  <span className="text-sm font-bold mt-2">{profilePhotoFile ? profilePhotoFile.name : (isRTL ? 'اختر صورة من جهازك' : 'Upload Photo')}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, setProfilePhotoFile)} />
                </label>
              </div>
            </div>
          )}

          {/* STEP 5: Document Uploads */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2 text-primary">
                <Shield size={24} />
                <h3 className="font-black text-lg">{isRTL ? 'المستندات الرسمية' : 'Official Documents'}</h3>
              </div>

              {/* National ID */}
              <div className="space-y-2 border-b border-theme-border/40 pb-4">
                <label className="text-xs font-black text-theme-text block">{isRTL ? 'صورة البطاقة الشخصية (مطلوب)' : 'National ID Image (Required)'}</label>
                <label className="w-full py-3.5 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-primary flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/10 transition">
                  {nationalIdFile ? <Check size={18} className="text-green-500" /> : <Upload size={18} />}
                  <span className="text-xs font-bold">{nationalIdFile ? nationalIdFile.name : (isRTL ? 'تحميل صورة البطاقة' : 'Upload ID')}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, setNationalIdFile)} />
                </label>
                <div className="space-y-1 mt-2">
                  <label className="text-[10px] font-black text-theme-muted block">{isRTL ? 'تاريخ انتهاء البطاقة' : 'National ID Expiry Date'}</label>
                  <input type="date" value={nationalIdExpiry} onChange={e => setNationalIdExpiry(e.target.value)} className="w-full bg-theme-bg border border-theme-border/50 rounded-xl px-4 py-2.5 text-xs text-theme-text focus:outline-none" />
                </div>
              </div>

              {/* Driving License */}
              <div className="space-y-2 border-b border-theme-border/40 pb-4">
                <label className="text-xs font-black text-theme-text block">{isRTL ? 'صورة رخصة القيادة (مطلوب)' : 'Driving License Image (Required)'}</label>
                <label className="w-full py-3.5 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-primary flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/10 transition">
                  {drivingLicenseFile ? <Check size={18} className="text-green-500" /> : <Upload size={18} />}
                  <span className="text-xs font-bold">{drivingLicenseFile ? drivingLicenseFile.name : (isRTL ? 'تحميل صورة الرخصة' : 'Upload License')}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, setDrivingLicenseFile)} />
                </label>
                <div className="space-y-1 mt-2">
                  <label className="text-[10px] font-black text-theme-muted block">{isRTL ? 'تاريخ انتهاء رخصة القيادة' : 'Driving License Expiry Date'}</label>
                  <input type="date" value={drivingLicenseExpiry} onChange={e => setDrivingLicenseExpiry(e.target.value)} className="w-full bg-theme-bg border border-theme-border/50 rounded-xl px-4 py-2.5 text-xs text-theme-text focus:outline-none" />
                </div>
              </div>

              {/* Vehicle License */}
              <div className="space-y-2 border-b border-theme-border/40 pb-4">
                <label className="text-xs font-black text-theme-text block">{isRTL ? 'صورة رخصة المركبة (مطلوب)' : 'Vehicle License Image (Required)'}</label>
                <label className="w-full py-3.5 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-primary flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/10 transition">
                  {vehicleLicenseFile ? <Check size={18} className="text-green-500" /> : <Upload size={18} />}
                  <span className="text-xs font-bold">{vehicleLicenseFile ? vehicleLicenseFile.name : (isRTL ? 'تحميل رخصة المركبة' : 'Upload Vehicle License')}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, setVehicleLicenseFile)} />
                </label>
                <div className="space-y-1 mt-2">
                  <label className="text-[10px] font-black text-theme-muted block">{isRTL ? 'تاريخ انتهاء رخصة المركبة' : 'Vehicle License Expiry'}</label>
                  <input type="date" value={vehicleLicenseExpiry} onChange={e => setVehicleLicenseExpiry(e.target.value)} className="w-full bg-theme-bg border border-theme-border/50 rounded-xl px-4 py-2.5 text-xs text-theme-text focus:outline-none" />
                </div>
              </div>

              {/* Vehicle Photo */}
              <div className="space-y-2 border-b border-theme-border/40 pb-4">
                <label className="text-xs font-black text-theme-text block">{isRTL ? 'صورة المركبة بالكامل (مطلوب)' : 'Vehicle Photo (Required)'}</label>
                <label className="w-full py-3.5 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-primary flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/10 transition">
                  {vehicleFile ? <Check size={18} className="text-green-500" /> : <Upload size={18} />}
                  <span className="text-xs font-bold">{vehicleFile ? vehicleFile.name : (isRTL ? 'تحميل صورة المركبة' : 'Upload Vehicle Photo')}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, setVehicleFile)} />
                </label>
              </div>

              {/* Insurance Info (Optional) */}
              <div className="space-y-2">
                <label className="text-xs font-black text-theme-text block">{isRTL ? 'صورة تأمين المركبة (اختياري)' : 'Vehicle Insurance Photo (Optional)'}</label>
                <label className="w-full py-3.5 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-primary flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/10 transition">
                  {insuranceFile ? <Check size={18} className="text-green-500" /> : <Upload size={18} />}
                  <span className="text-xs font-bold">{insuranceFile ? insuranceFile.name : (isRTL ? 'تحميل صورة التأمين' : 'Upload Insurance')}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, setInsuranceFile)} />
                </label>
                <div className="space-y-1 mt-2">
                  <label className="text-[10px] font-black text-theme-muted block">{isRTL ? 'تاريخ انتهاء التأمين' : 'Insurance Expiry'}</label>
                  <input type="date" value={insuranceExpiry} onChange={e => setInsuranceExpiry(e.target.value)} className="w-full bg-theme-bg border border-theme-border/50 rounded-xl px-4 py-2.5 text-xs text-theme-text focus:outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Finance payout settings */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <CreditCard size={24} />
                <h3 className="font-black text-lg">{isRTL ? 'الحساب المالي للتحويلات' : 'Finance & Payout details'}</h3>
              </div>
              <p className="text-xs text-theme-muted font-bold leading-relaxed">
                {isRTL ? 'يرجى إدخال وسيلة سداد واحدة على الأقل لاستلام مستحقات التوصيل اليومية.' : 'Please provide at least one method to receive your daily delivery earnings.'}
              </p>
              <PremiumInput label="InstaPay IPA Address (E.g. user@instapay)" value={instaPayAddress} onChange={e => setInstaPayAddress(e.target.value)} />
              <PremiumInput label="Vodafone Cash Number (E.g. 010xxxxxxxx)" type="tel" value={vodafoneCashNumber} onChange={e => setVodafoneCashNumber(e.target.value)} />
              <div className="h-px bg-theme-border/40 my-2" />
              <PremiumInput label={isRTL ? "اسم البنك" : "Bank Name"} value={bankName} onChange={e => setBankName(e.target.value)} />
              <PremiumInput label={isRTL ? "رقم الحساب / الآيبان" : "Bank Account / IBAN"} value={bankAccount} onChange={e => setBankAccount(e.target.value)} />
            </div>
          )}

          {/* STEP 7: Review & Final Submission */}
          {step === 7 && (
            <div className="space-y-4 font-sans text-xs">
              <div className="flex items-center gap-2 mb-4 text-green-500">
                <ClipboardList size={24} />
                <h3 className="font-black text-lg">{isRTL ? 'مراجعة البيانات' : 'Summary Review'}</h3>
              </div>
              <div className="bg-theme-bg p-4 rounded-2xl space-y-3.5 border border-theme-border/60">
                <div className="flex justify-between"><span className="text-theme-muted font-bold">{isRTL ? 'الاسم:' : 'Name:'}</span> <span className="font-black text-theme-text">{name}</span></div>
                <div className="flex justify-between"><span className="text-theme-muted font-bold">{isRTL ? 'رقم الهاتف:' : 'Phone:'}</span> <span className="font-black text-theme-text">{phone}</span></div>
                <div className="flex justify-between"><span className="text-theme-muted font-bold">{isRTL ? 'الرقم القومي:' : 'National ID:'}</span> <span className="font-black text-theme-text font-mono">{nationalId}</span></div>
                <div className="flex justify-between"><span className="text-theme-muted font-bold">{isRTL ? 'تاريخ الميلاد:' : 'Birthdate:'}</span> <span className="font-black text-theme-text font-mono">{birthdate}</span></div>
                <div className="h-px bg-theme-border/40" />
                <div className="flex justify-between"><span className="text-theme-muted font-bold">{isRTL ? 'المحافظة والقرية:' : 'Zone:'}</span> <span className="font-black text-theme-text">{governorate} - {city} - {village}</span></div>
                <div className="flex justify-between"><span className="text-theme-muted font-bold">{isRTL ? 'وسيلة التوصيل:' : 'Method:'}</span> <span className="font-black text-theme-text">{vehicleType} ({vehicleBrand} {vehicleModel})</span></div>
                <div className="flex justify-between"><span className="text-theme-muted font-bold">{isRTL ? 'رقم اللوحة:' : 'Plate Number:'}</span> <span className="font-black text-theme-text">{plateNumber}</span></div>
                <div className="h-px bg-theme-border/40" />
                <div className="flex justify-between"><span className="text-theme-muted font-bold">{isRTL ? 'إنستاباي:' : 'InstaPay:'}</span> <span className="font-black text-theme-text font-mono">{instaPayAddress || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-theme-muted font-bold">{isRTL ? 'فودافون كاش:' : 'Vodafone Cash:'}</span> <span className="font-black text-theme-text font-mono">{vodafoneCashNumber || 'N/A'}</span></div>
              </div>
            </div>
          )}

        </PremiumCard>

        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <PremiumButton variant="secondary" onClick={() => setStep(s => s - 1)} className="flex-grow-[1]">
              {isRTL ? 'السابق' : 'Back'}
            </PremiumButton>
          )}
          {step < 7 ? (
            <PremiumButton variant="primary" onClick={handleNext} className="flex-grow-[2]">
              {isRTL ? 'التالي' : 'Next'}
            </PremiumButton>
          ) : (
            <PremiumButton variant="primary" onClick={handleSubmit} disabled={loading} className="flex-grow-[2]">
              {loading ? (isRTL ? 'جاري تقديم الطلب...' : 'Submitting...') : (isRTL ? 'تقديم الطلب' : 'Submit Application')}
            </PremiumButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverRegistration;
