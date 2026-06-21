import React, { useState } from 'react';
import { ChevronLeft, Camera, Upload, CheckCircle, Bike } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { PremiumInput } from '../../components/premium/PremiumInput';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { mediaService } from '../../services/media.service';

interface DriverRegistrationProps {
  onBack: () => void;
}

export const DriverRegistration: React.FC<DriverRegistrationProps> = ({ onBack }) => {
  const { currentUser, showToast, isRTL } = useApp();
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState('الدقهلية');
  const [vehicleType, setVehicleType] = useState('motorcycle');
  
  // Files
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [vehicleLicenseFile, setVehicleLicenseFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleUploadClick = (inputId: string) => {
    document.getElementById(inputId)?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast(isRTL ? 'الرجاء تسجيل الدخول أولاً' : 'Please login first', 'warning');
      return;
    }
    if (!phone || !idCardFile || !licenseFile || !vehicleLicenseFile) {
      showToast(isRTL ? 'الرجاء إكمال جميع البيانات والمرفقات' : 'Please complete all details and attachments', 'warning');
      return;
    }

    setLoading(true);
    try {
      const requestId = `req_${Date.now()}_${currentUser.uid}`;
      
      // Upload files
      const idCardUrl = await mediaService.uploadImage(idCardFile, `driver_requests/${requestId}/id_card`);
      const licenseUrl = await mediaService.uploadImage(licenseFile, `driver_requests/${requestId}/license`);
      const vehicleLicenseUrl = await mediaService.uploadImage(vehicleLicenseFile, `driver_requests/${requestId}/vehicle_license`);

      await setDoc(doc(db, 'driverRequests', requestId), {
        id: requestId,
        userId: currentUser.uid,
        name: currentUser.name,
        email: currentUser.email,
        phone,
        governorate,
        vehicleType,
        documents: {
          idCardUrl,
          licenseUrl,
          vehicleLicenseUrl
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      setSubmitted(true);
      showToast(isRTL ? 'تم إرسال طلبك بنجاح. سيتم التواصل معك قريباً' : 'Request submitted successfully. We will contact you soon.', 'success');
    } catch (error) {
      console.error('Error submitting driver request:', error);
      showToast(isRTL ? 'حدث خطأ أثناء تقديم الطلب' : 'Error submitting request', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-theme-bg h-full flex flex-col items-center justify-center p-6 text-center animate-fade-in z-[100] fixed inset-0">
        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-black mb-2">{isRTL ? 'تم إرسال طلبك' : 'Request Submitted'}</h2>
        <p className="text-theme-muted mb-8 max-w-xs">
          {isRTL ? 'تم استلام بياناتك وسيتم مراجعتها من قبل الإدارة. سنتواصل معك في أقرب وقت.' : 'Your details have been received and will be reviewed by admin. We will contact you soon.'}
        </p>
        <PremiumButton onClick={onBack} variant="primary" className="w-full max-w-[200px]">
          {isRTL ? 'العودة' : 'Go Back'}
        </PremiumButton>
      </div>
    );
  }

  return (
    <div className="bg-theme-bg h-full flex flex-col overflow-hidden animate-slide-in-right pb-20 z-[100] fixed inset-0">
      <div className="bg-theme-card px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 border-b border-theme-border/60 flex items-center gap-3.5 z-20">
        <button onClick={onBack} className="p-2.5 text-theme-text bg-theme-bg hover:bg-theme-border/50 rounded-full transition flex items-center justify-center border border-theme-border/30">
          <ChevronLeft size={18} className={isRTL ? '' : 'rotate-180'} />
        </button>
        <div>
          <h2 className="text-sm font-black">{isRTL ? 'انضم كمندوب توصيل' : 'Join as Driver'}</h2>
          <p className="text-[10px] text-theme-muted">{isRTL ? 'سجل بياناتك للبدء' : 'Register your details to start'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-6">
        <PremiumCard hoverable={false} className="space-y-4">
          <div className="flex items-center gap-2 mb-2 text-primary font-bold">
            <Bike size={20} />
            <span>{isRTL ? 'البيانات الأساسية' : 'Basic Info'}</span>
          </div>
          <PremiumInput
            label={isRTL ? 'رقم الهاتف (للتواصل)' : 'Phone Number'}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <div className="space-y-1">
            <label className="text-xs font-bold text-theme-muted">{isRTL ? 'المحافظة' : 'Governorate'}</label>
            <select
              value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition"
            >
              <option value="الدقهلية">الدقهلية (Dakahlia)</option>
              <option value="القاهرة">القاهرة (Cairo)</option>
              <option value="الجيزة">الجيزة (Giza)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-theme-muted">{isRTL ? 'نوع المركبة' : 'Vehicle Type'}</label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition"
            >
              <option value="motorcycle">{isRTL ? 'موتوسيكل' : 'Motorcycle'}</option>
              <option value="car">{isRTL ? 'سيارة' : 'Car'}</option>
              <option value="bicycle">{isRTL ? 'دراجة هوائية' : 'Bicycle'}</option>
            </select>
          </div>
        </PremiumCard>

        <PremiumCard hoverable={false} className="space-y-4">
          <div className="flex items-center gap-2 mb-2 text-primary font-bold">
            <Camera size={20} />
            <span>{isRTL ? 'المستندات المطلوبة' : 'Required Documents'}</span>
          </div>

          {[
            { id: 'idCard', label: isRTL ? 'صورة البطاقة (الرقم القومي)' : 'ID Card', file: idCardFile, setter: setIdCardFile },
            { id: 'license', label: isRTL ? 'صورة رخصة القيادة' : 'Driving License', file: licenseFile, setter: setLicenseFile },
            { id: 'vehicleLicense', label: isRTL ? 'صورة رخصة المركبة' : 'Vehicle License', file: vehicleLicenseFile, setter: setVehicleLicenseFile }
          ].map((doc) => (
            <div key={doc.id} className="border border-theme-border/50 rounded-xl p-4 flex flex-col gap-3 bg-theme-bg/50">
              <span className="text-sm font-bold">{doc.label}</span>
              <input
                type="file"
                id={doc.id}
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, doc.setter)}
              />
              <button
                type="button"
                onClick={() => handleUploadClick(doc.id)}
                className={`w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition ${
                  doc.file 
                    ? 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400' 
                    : 'border-primary/30 hover:border-primary bg-primary/5 text-primary'
                }`}
              >
                <Upload size={18} />
                <span className="text-xs font-bold">
                  {doc.file ? doc.file.name : (isRTL ? 'اضغط لرفع الصورة' : 'Click to upload image')}
                </span>
              </button>
            </div>
          ))}
        </PremiumCard>

        <PremiumButton 
          type="submit" 
          variant="primary" 
          size="lg" 
          className="w-full shadow-md rounded-2xl h-14 text-sm font-black"
          disabled={loading}
        >
          {loading ? (isRTL ? 'جاري الإرسال...' : 'Submitting...') : (isRTL ? 'إرسال طلب الانضمام' : 'Submit Application')}
        </PremiumButton>
      </form>
    </div>
  );
};
