import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useApp } from '../../contexts/AppContext';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { Award, BookOpen, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { driverRepository } from '../../services/driver/repository';

interface DriverTrainingProps {
  driver: any;
  onCompleted: () => void;
}

export const DriverTraining: React.FC<DriverTrainingProps> = ({ driver, onCompleted }) => {
  const { t } = useTranslation();
  const { isRTL, showToast } = useApp();
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(false);

  const slides = [
    {
      titleAr: 'مرحباً بك في أكاديمية وصلة لينك! 🛵',
      titleEn: 'Welcome to Wasla Academy! 🛵',
      descAr: 'هذا التدريب السريع سيشرح لك كيف تعمل بأمان وتحقق أقصى ربح معنا. دعنا نبدأ الخطوات البسيطة.',
      descEn: 'This short training will guide you through delivering safely and maximizing your earnings with us.',
      icon: <Sparkles size={36} className="text-amber-500" />
    },
    {
      titleAr: '1. استلام وتأكيد الطلبات 📋',
      titleEn: '1. Receiving & Accepting Orders 📋',
      descAr: 'عند إرسال طلب إليك، ستتلقى نغمة تنبيه وبطاقة تفاصيل. أمامك 30 ثانية للقبول والتوجه مباشرة إلى المتجر.',
      descEn: 'When an order is assigned to you, you will hear a notification. Accept it within 30 seconds and head straight to the store.',
      icon: <BookOpen size={36} className="text-blue-500" />
    },
    {
      titleAr: '2. تأكيد الرمز السري OTP 🔑',
      titleEn: '2. Customer Verification Code (OTP) 🔑',
      descAr: 'لا تقم بتسليم أي طلب للعميل دون إدخال الرمز السري المكون من 4 أرقام الذي يظهر على هاتف العميل للتأكد من هوية المستلم.',
      descEn: 'Never hand over any package without entering the 4-digit verification code (OTP) shown on the customer\'s screen.',
      icon: <Check size={36} className="text-teal-500" />
    },
    {
      titleAr: '3. الدفع نقداً وتحصيل الأموال (COD) 💵',
      titleEn: '3. Cash On Delivery (COD) 💵',
      descAr: 'إذا كان الطلب نقدياً، يرجى استلام القيمة المكتوبة بالتفصيل دون أي زيادة. سيتم تسجيل هذه المبالغ كأمانة للتسوية لاحقاً.',
      descEn: 'For cash orders, collect the exact amount specified. These amounts will accumulate in your balance for future reconciliation.',
      icon: <Award size={36} className="text-green-500" />
    },
    {
      titleAr: '4. إثبات التسليم (Proof of Delivery) 📸',
      titleEn: '4. Proof of Delivery (POD) 📸',
      descAr: 'عند الوصول لموقع العميل، قم بالتقاط صورة للطلب مع العميل أو أمام بابه لإثبات التسليم وحل أي نزاعات قد تحدث.',
      descEn: 'Take a quick photo of the delivered items at the customer\'s doorstep to prove delivery and resolve any potential claims.',
      icon: <Sparkles size={36} className="text-purple-500" />
    },
    {
      titleAr: '5. إرشادات الطوارئ والدعم 📞',
      titleEn: '5. Emergencies & Support 📞',
      descAr: 'إذا واجهت أي مشكلة أثناء القيادة أو مع العميل، استخدم خيار المحادثة الفورية مع الدعم أو اتصل هاتفياً مباشرة لحل المشكلة فوراً.',
      descEn: 'If you face any issues while driving or with a customer, use the live chat option to reach support or call directly.',
      icon: <BookOpen size={36} className="text-red-500" />
    }
  ];

  const handleNext = () => {
    if (slide < slides.length - 1) {
      setSlide(slide + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (slide > 0) setSlide(slide - 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await driverRepository.update(driver.id, {
        trainingCompleted: true
      });
      showToast(isRTL ? 'تهانينا! لقد أكملت التدريب بنجاح.' : 'Congratulations! You have completed the training.', 'success');
      onCompleted();
    } catch (e) {
      console.error(e);
      showToast(isRTL ? 'خطأ أثناء تسجيل انتهاء التدريب' : 'Error saving training state', 'error');
    } finally {
      setLoading(false);
    }
  };

  const current = slides[slide];

  return (
    <div className="bg-theme-bg h-screen w-full flex flex-col justify-between p-5 z-[100] fixed inset-0 font-sans text-theme-text overflow-hidden">
      {/* Header */}
      <div className="bg-theme-card px-5 py-4 border-b border-theme-border/60 flex items-center justify-between z-20 rounded-2xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary"><BookOpen size={20} /></div>
          <div>
            <h2 className="text-sm font-black">{isRTL ? 'أكاديمية تدريب المناديب' : 'Driver Training Academy'}</h2>
            <p className="text-[9px] text-theme-muted font-bold mt-0.5">{isRTL ? `الخطوة ${slide + 1} من ${slides.length}` : `Slide ${slide + 1} of ${slides.length}`}</p>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 text-center my-6 space-y-6">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center border border-primary/20 shadow-inner animate-pulse-slow">
          {current.icon}
        </div>
        <h3 className="text-xl font-black max-w-xs">{isRTL ? current.titleAr : current.titleEn}</h3>
        <p className="text-sm font-bold text-theme-muted max-w-sm leading-relaxed">{isRTL ? current.descAr : current.descEn}</p>
      </div>

      {/* Navigation Footer */}
      <div className="bg-theme-card p-5 border-t border-theme-border/60 rounded-2xl flex gap-3 flex-shrink-0">
        {slide > 0 && (
          <PremiumButton onClick={handlePrev} variant="outline" className="flex-1 flex items-center justify-center gap-1.5 h-12 rounded-xl text-xs font-black">
            <ChevronLeft size={16} className={isRTL ? 'rotate-180' : ''} />
            <span>{isRTL ? 'السابق' : 'Back'}</span>
          </PremiumButton>
        )}
        <PremiumButton 
          onClick={handleNext} 
          disabled={loading} 
          variant="primary" 
          className="flex-[2] flex items-center justify-center gap-1.5 h-12 rounded-xl text-xs font-black shadow-md"
        >
          <span>{slide === slides.length - 1 ? (isRTL ? 'إنهاء التدريب وبدء العمل' : 'Complete & Start') : (isRTL ? 'التالي' : 'Next')}</span>
          {slide < slides.length - 1 && <ChevronRight size={16} className={isRTL ? 'rotate-180' : ''} />}
        </PremiumButton>
      </div>
    </div>
  );
};
