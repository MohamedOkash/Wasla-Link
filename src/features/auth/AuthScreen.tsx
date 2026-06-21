import React, { useState } from 'react';
import { Globe, ArrowRight, ArrowLeft, Check, Store as StoreIcon, ShieldAlert } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { auth, db } from '../../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, writeBatch, increment } from 'firebase/firestore';
import { catalogTemplates } from '../../data/catalogTemplates';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { PremiumInput } from '../../components/premium/PremiumInput';
import { PremiumBadge } from '../../components/premium/PremiumBadge';

// Dynamic Egypt Regions Data
const EGYPT_REGIONS: Record<string, { cities: Record<string, string[]> }> = {
  'الدقهلية': {
    cities: {
      'السنبلاوين': ['ميت غراب', 'برقين', 'البوها', 'طماي الزهايرة', 'أخرى'],
      'المنصورة': ['سلكا', 'سندوب', 'شاوة', 'أخرى'],
      'ميت غمر': ['دنديط', 'ميت الفرماوي', 'صهرجت الكبرى', 'أخرى'],
      'طلخا': ['ميت الكرماء', 'بطرة', 'أخرى']
    }
  },
  'القاهرة': {
    cities: {
      'المعادي': ['زهراء المعادي', 'دجلة', 'ثكنات المعادي', 'أخرى'],
      'مصر الجديدة': ['الماظة', 'ميدان تريومف', 'أخرى'],
      'حلوان': ['المعصرة', 'حدائق حلوان', 'أخرى']
    }
  },
  'الجيزة': {
    cities: {
      'الدقي': ['شارع التحرير', 'ميدان المساحة', 'أخرى'],
      '6 أكتوبر': ['الحي المتميز', 'الحي الأول', 'الحي المالي', 'أخرى']
    }
  },
  'الإسكندرية': {
    cities: {
      'شرق': ['سموحة', 'سيدي جابر', 'رشدي', 'أخرى'],
      'وسط': ['محرم بك', 'المنشية', 'أخرى']
    }
  }
};

export const AuthScreen: React.FC = () => {
  const { setRole, setCurrentUser, lang, setLang, t, categories, showToast } = useApp();
  const [view, setView] = useState<'login' | 'register' | 'vendor_register' | 'forgot_password'>('login');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState('grocery');
  const [loading, setLoading] = useState(false);

  // Vendor Onboarding Wizard states
  const [regStep, setRegStep] = useState(1);
  const [governorate, setGovernorate] = useState('الدقهلية');
  const [city, setCity] = useState('السنبلاوين');
  const [village, setVillage] = useState('ميت غراب');
  const [customCity, setCustomCity] = useState('');
  const [customVillage, setCustomVillage] = useState('');

  const getAvailableCities = () => {
    return EGYPT_REGIONS[governorate]?.cities ? Object.keys(EGYPT_REGIONS[governorate].cities) : ['أخرى'];
  };

  const getAvailableVillages = () => {
    const cityData = EGYPT_REGIONS[governorate]?.cities[city];
    return cityData || ['أخرى'];
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast(lang === 'ar' ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      let errMsg = lang === 'ar' ? 'فشل تسجيل الدخول. يرجى التحقق من البيانات' : 'Login failed. Please check credentials';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errMsg = lang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Incorrect email or password';
      }
      showToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      showToast(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      let referredByUid: string | null = null;
      let isReferralValid = false;
      const inviteCode = referralCodeInput.trim().toUpperCase();

      if (inviteCode) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('referralCode', '==', inviteCode));
        const qSnap = await getDocs(q);
        
        if (!qSnap.empty) {
          const inviterDoc = qSnap.docs[0];
          referredByUid = inviterDoc.id;
          isReferralValid = true;
        } else {
          showToast(lang === 'ar' ? 'كود الإحالة غير صحيح. سيتم التسجيل بدون إحالة.' : 'Invalid referral code. Registering without referral.');
        }
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const generatedCode = name.replace(/\s+/g, '').substring(0, 6).toUpperCase() + Math.floor(1000 + Math.random() * 9000);

      const batch = writeBatch(db);

      const userProfile = {
        uid,
        name,
        email,
        phone: phone || '',
        role: 'customer',
        points: isReferralValid ? 100 : 0,
        referralCode: generatedCode,
        referredBy: referredByUid,
        createdAt: new Date().toISOString()
      };

      batch.set(doc(db, 'users', uid), userProfile);

      if (isReferralValid && referredByUid) {
        const refId = `ref_${uid}`;
        batch.set(doc(db, 'referrals', refId), {
          id: refId,
          inviterId: referredByUid,
          invitedId: uid,
          invitedName: name,
          pointsAwarded: 500,
          status: 'registered',
          createdAt: new Date().toISOString()
        });

        batch.update(doc(db, 'users', referredByUid), {
          points: increment(500)
        });

        const histInvId = `ref_inv_${uid}`;
        batch.set(doc(db, 'pointsHistory', histInvId), {
          id: histInvId,
          userId: referredByUid,
          points: 500,
          type: 'referral_inviter',
          createdAt: new Date().toISOString()
        });

        const histInvdId = `ref_invd_${uid}`;
        batch.set(doc(db, 'pointsHistory', histInvdId), {
          id: histInvdId,
          userId: uid,
          points: 100,
          type: 'referral_invited',
          createdAt: new Date().toISOString()
        });
      }

      await batch.commit();
      showToast(lang === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully');
    } catch (err: any) {
      console.error(err);
      let errMsg = lang === 'ar' ? 'فشل إنشاء الحساب' : 'Registration failed';
      if (err.code === 'auth/email-already-in-use') {
        errMsg = lang === 'ar' ? 'البريد الإلكتروني مستخدم بالفعل' : 'Email already in use';
      } else if (err.code === 'auth/weak-password') {
        errMsg = lang === 'ar' ? 'كلمة المرور ضعيفة جداً' : 'Password is too weak';
      }
      showToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !storeName || !phone) {
      showToast(lang === 'ar' ? 'يرجى ملء جميع الحقول لتسجيل المتجر' : 'Please fill all fields to register store');
      return;
    }
    setLoading(true);
    try {
      const finalCity = city === 'أخرى' ? customCity : city;
      const finalVillage = village === 'أخرى' ? customVillage : village;

      if (!finalCity || !finalVillage) {
        showToast(lang === 'ar' ? 'يرجى تحديد المدينة والقرية التابع لها المتجر' : 'Please specify the city and village of the store');
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const storeId = `store_${Date.now()}`;

      // 1. Write User document
      await setDoc(doc(db, 'users', uid), {
        uid,
        name: storeName,
        email,
        phone,
        role: 'vendor',
        storeId,
        createdAt: new Date().toISOString()
      });

      // 2. Create Store document with detailed regions
      const catObj = categories.find(c => c.id === storeCategory);
      const categoryNameEn = catObj?.nameEn || catObj?.name?.en || storeCategory;
      const categoryNameAr = catObj?.nameAr || catObj?.name?.ar || storeCategory;

      await setDoc(doc(db, 'stores', storeId), {
        id: storeId,
        vendorId: uid,
        catId: storeCategory,
        storeType: storeCategory,
        governorate,
        city: finalCity,
        village: finalVillage,
        name: storeName,
        logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(storeName)}&background=FF7A00&color=fff&size=128`,
        coverUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
        rating: 5.0,
        time: 20,
        fee: 15,
        minOrder: 50,
        isOpen: true,
        status: 'approved', // Auto-approved for frictionless onboarding experience
        followersCount: 0,
        paymentInfo: { vodafone: phone, instapay: '' },
        coveredVillages: [finalVillage],
        coveredCenters: [finalCity],
        deliveryFees: { [finalVillage]: 15 },
        etas: { [finalVillage]: '20 دقيقة' },
        openingHours: '08:00',
        closingHours: '23:00',
        workingDays: [0, 1, 2, 3, 4, 5, 6],
        businessHours: {
          openingHours: '08:00',
          closingHours: '23:00',
          workingDays: [0, 1, 2, 3, 4, 5, 6]
        },
        isTemporarilyClosed: false,
        createdAt: new Date().toISOString()
      });

      // 3. Auto-seed vendor inventory from master templates
      const templates = catalogTemplates[storeCategory] || [];
      if (templates.length > 0) {
        const batchLimit = 400; // Limit under Firestore 500 batch cap
        for (let i = 0; i < templates.length; i += batchLimit) {
          const batch = writeBatch(db);
          const chunk = templates.slice(i, i + batchLimit);
          
          chunk.forEach(p => {
            const prodId = `prod_${storeId}_${p.id}_${Math.floor(1000 + Math.random() * 9000)}`;
            const vendorProd = {
              ...p,
              id: prodId,
              storeId: storeId,
              isTemplate: false,
              templateId: p.id,
              stock: p.stock || 100,
              price: p.sellingPrice || p.price || 10,
              costPrice: p.costPrice || Math.round((p.sellingPrice || 10) * 0.8),
              sellingPrice: p.sellingPrice || p.price || 10,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            batch.set(doc(db, 'products', prodId), vendorProd);
          });
          await batch.commit();
        }
      }

      showToast(lang === 'ar' ? 'تم تسجيل متجرك وتوليد كتالوج المنتجات بنجاح!' : 'Store registered and inventory templates cloned successfully!');
      setRegStep(1);
      setView('login');
    } catch (err: any) {
      console.error(err);
      let errMsg = lang === 'ar' ? 'فشل تسجيل المتجر' : 'Store registration failed';
      if (err.code === 'auth/email-already-in-use') {
        errMsg = lang === 'ar' ? 'البريد الإلكتروني مستخدم بالفعل' : 'Email already in use';
      }
      showToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast(lang === 'ar' ? 'يرجى إدخال البريد الإلكتروني أولاً' : 'Please enter email first');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showToast(lang === 'ar' ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' : 'Password reset link sent to your email');
      setView('login');
    } catch (err: any) {
      console.error(err);
      showToast(lang === 'ar' ? 'فشل إرسال البريد الإلكتروني. تحقق من العنوان' : 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (roleType: 'customer' | 'vendor' | 'driver') => {
    setLoading(true);
    try {
      const demoEmail = `${roleType}@demo.com`;
      const demoPass = 'password123';
      await signInWithEmailAndPassword(auth, demoEmail, demoPass);
    } catch (err: any) {
      console.error(err);
      showToast(lang === 'ar' ? 'بيانات الدخول التجريبي غير متوفرة، يرجى التسجيل أولاً' : 'Demo account not found, please register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-theme-bg text-theme-text relative overflow-y-auto animate-fade-in theme-transition font-sans">
      {/* Lang Switch */}
      <button 
        onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} 
        className="absolute top-6 left-6 bg-theme-card border border-theme-border/60 p-2.5 rounded-2xl text-xs font-black flex items-center gap-2 hover:border-primary/20 transition active:scale-95 shadow-sm"
      >
        <Globe size={15}/> {t('language')}
      </button>

      <img 
        src="/logo.jpg" 
        alt="WaslaLink Logo" 
        className="w-20 h-20 object-cover rounded-[24px] shadow-lg mb-4 mt-8 border border-theme-border/20"
      />
      <h1 className="text-2xl font-black mb-6 tracking-tight text-theme-text">{t('appName')}</h1>

      {/* LOGIN VIEW */}
      {view === 'login' && (
        <form onSubmit={handleEmailLogin} className="w-full max-w-sm space-y-4">
          <PremiumInput 
            type="email" 
            placeholder={t('email')} 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <PremiumInput 
            type="password" 
            placeholder={t('password')} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          
          <PremiumButton 
            type="submit"
            isLoading={loading}
            className="w-full py-3.5"
          >
            {t('loginAsCustomer')}
          </PremiumButton>
          
          <div className="text-right">
            <span 
              onClick={() => setView('forgot_password')}
              className="text-xs font-black text-primary cursor-pointer hover:underline"
            >
              {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
            </span>
          </div>

          <div className="border-t border-theme-border/60 my-6 pt-4 text-center">
            <span className="text-[10px] font-black text-theme-muted uppercase tracking-wider">{lang === 'ar' ? 'دخول تجريبي سريع' : 'Quick Demo Access'}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              type="button"
              onClick={() => handleDemoLogin('vendor')} 
              className="bg-primary/10 text-primary font-black py-3 rounded-xl border border-primary/20 hover:bg-primary/15 transition text-[10px] truncate"
            >
              {lang === 'ar' ? 'دخول بائع' : 'Vendor'}
            </button>
            <button 
              type="button"
              onClick={() => handleDemoLogin('driver')} 
              className="bg-primary/10 text-primary font-black py-3 rounded-xl border border-primary/20 hover:bg-primary/15 transition text-[10px] truncate"
            >
              {lang === 'ar' ? 'دخول مندوب' : 'Driver'}
            </button>
          </div>

          <p 
            className="text-center text-xs font-bold text-theme-muted mt-6 cursor-pointer hover:text-primary transition" 
            onClick={() => { setView('register'); setEmail(''); setPassword(''); }}
          >
            {lang === 'ar' ? 'إنشاء حساب جديد كعميل' : 'Create new customer account'}
          </p>
          <p 
            className="text-center text-xs font-black text-primary cursor-pointer hover:underline" 
            onClick={() => { setView('vendor_register'); setEmail(''); setPassword(''); setRegStep(1); }}
          >
            {lang === 'ar' ? 'تسجيل متجرك معنا' : 'Register your store with us'}
          </p>
        </form>
      )}

      {/* CUSTOMER REGISTER VIEW */}
      {view === 'register' && (
        <form onSubmit={handleCustomerRegister} className="w-full max-w-sm space-y-4">
          <PremiumInput 
            type="text" 
            placeholder={t('name')} 
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
          <PremiumInput 
            type="email" 
            placeholder={t('email')} 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <PremiumInput 
            type="text" 
            placeholder={lang === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone Number (Optional)'} 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
          />
          <PremiumInput 
            type="text" 
            placeholder={lang === 'ar' ? 'كود الدعوة / الإحالة (اختياري)' : 'Referral / Invite Code (Optional)'} 
            value={referralCodeInput}
            onChange={(e) => setReferralCodeInput(e.target.value)}
            disabled={loading}
          />
          <PremiumInput 
            type="password" 
            placeholder={t('password')} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <PremiumButton 
            type="submit"
            isLoading={loading}
            className="w-full py-3.5"
          >
            {t('register')}
          </PremiumButton>
          <p 
            className="text-center text-xs font-bold text-theme-muted mt-4 cursor-pointer hover:text-primary transition" 
            onClick={() => setView('login')}
          >
            {lang === 'ar' ? 'لدي حساب بالفعل' : 'Already have an account'}
          </p>
        </form>
      )}

      {/* SMART VENDOR ONBOARDING WIZARD */}
      {view === 'vendor_register' && (
        <div className="w-full max-w-lg bg-theme-card border border-theme-border/60 rounded-[28px] p-6 shadow-md relative theme-transition">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-black text-sm text-primary uppercase tracking-wider">
              {lang === 'ar' ? 'تسجيل شريك جديد' : 'Vendor Onboarding'}
            </h2>
            <PremiumBadge variant="primary" pill>
              {lang === 'ar' ? `الخطوة ${regStep} من 5` : `Step ${regStep} of 5`}
            </PremiumBadge>
          </div>

          {/* Stepper Progress Bar */}
          <div className="w-full h-1 bg-theme-border/40 rounded-full mb-6 overflow-hidden flex">
            {[1, 2, 3, 4, 5].map(stepNum => (
              <div 
                key={stepNum} 
                className={`h-full flex-1 transition-all duration-300 ${
                  stepNum <= regStep ? 'bg-primary' : 'bg-transparent'
                }`}
              />
            ))}
          </div>

          {/* STEP 1: Store Type */}
          {regStep === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-theme-muted font-bold mb-2">
                {lang === 'ar' ? 'اختر نوع نشاط متجرك لتوليد المنتجات والكتالوج تلقائياً:' : 'Select your store category to load starter inventory templates:'}
              </p>
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                {categories.map(c => {
                  const isSelected = storeCategory === c.id;
                  return (
                    <PremiumCard 
                      key={c.id}
                      onClick={() => setStoreCategory(c.id)}
                      className={`p-3.5 flex flex-col justify-between min-h-[90px] ${
                        isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-theme-border/60 bg-theme-bg'
                      }`}
                    >
                      <span className="text-[10px] font-black text-theme-text uppercase tracking-wider line-clamp-1">
                        {lang === 'ar' ? c.nameAr : c.nameEn}
                      </span>
                      <div className="flex justify-between items-center mt-2.5">
                        <span className="text-[8px] font-bold text-theme-muted uppercase">
                          {c.id}
                        </span>
                        {isSelected && (
                          <span className="p-1 rounded-full bg-primary text-white">
                            <Check size={10} strokeWidth={4} />
                          </span>
                        )}
                      </div>
                    </PremiumCard>
                  );
                })}
              </div>
              <PremiumButton 
                onClick={() => setRegStep(2)}
                className="w-full mt-4"
                rightIcon={<ArrowRight size={14} />}
              >
                {lang === 'ar' ? 'التالي: الموقع الجغرافي' : 'Next: Store Location'}
              </PremiumButton>
            </div>
          )}

          {/* STEP 2: Governorate */}
          {regStep === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-theme-muted font-bold">
                {lang === 'ar' ? 'حدد المحافظة التي يقع بها متجرك شريكاً للمنصة:' : 'Choose the Governorate of your physical store:'}
              </p>
              <select
                value={governorate}
                onChange={(e) => {
                  setGovernorate(e.target.value);
                  const firstCity = Object.keys(EGYPT_REGIONS[e.target.value]?.cities || {})[0] || 'أخرى';
                  setCity(firstCity);
                  const firstVillage = EGYPT_REGIONS[e.target.value]?.cities[firstCity]?.[0] || 'أخرى';
                  setVillage(firstVillage);
                }}
                className="w-full bg-theme-bg border border-theme-border/60 p-4 rounded-xl font-bold outline-none focus:border-primary text-theme-text transition"
              >
                {Object.keys(EGYPT_REGIONS).map(gov => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>

              <div className="flex gap-3 mt-6">
                <PremiumButton 
                  variant="outline"
                  onClick={() => setRegStep(1)}
                  className="flex-1"
                  leftIcon={<ArrowLeft size={14} />}
                >
                  {lang === 'ar' ? 'السابق' : 'Back'}
                </PremiumButton>
                <PremiumButton 
                  onClick={() => setRegStep(3)}
                  className="flex-1"
                  rightIcon={<ArrowRight size={14} />}
                >
                  {lang === 'ar' ? 'التالي: المركز' : 'Next: City'}
                </PremiumButton>
              </div>
            </div>
          )}

          {/* STEP 3: City / Center */}
          {regStep === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-theme-muted font-bold">
                {lang === 'ar' ? 'اختر المدينة أو المركز التابع له المتجر:' : 'Select the City / Operational center:'}
              </p>
              <select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  const firstVillage = EGYPT_REGIONS[governorate]?.cities[e.target.value]?.[0] || 'أخرى';
                  setVillage(firstVillage);
                }}
                className="w-full bg-theme-bg border border-theme-border/60 p-4 rounded-xl font-bold outline-none focus:border-primary text-theme-text transition"
              >
                {getAvailableCities().map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {city === 'أخرى' && (
                <PremiumInput 
                  type="text" 
                  placeholder={lang === 'ar' ? 'اكتب اسم المدينة/المركز' : 'Type City / Center name'} 
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                />
              )}

              <div className="flex gap-3 mt-6">
                <PremiumButton 
                  variant="outline"
                  onClick={() => setRegStep(2)}
                  className="flex-1"
                  leftIcon={<ArrowLeft size={14} />}
                >
                  {lang === 'ar' ? 'السابق' : 'Back'}
                </PremiumButton>
                <PremiumButton 
                  onClick={() => setRegStep(4)}
                  className="flex-1"
                  rightIcon={<ArrowRight size={14} />}
                >
                  {lang === 'ar' ? 'التالي: القرية' : 'Next: Village'}
                </PremiumButton>
              </div>
            </div>
          )}

          {/* STEP 4: Village */}
          {regStep === 4 && (
            <div className="space-y-4">
              <p className="text-xs text-theme-muted font-bold">
                {lang === 'ar' ? 'حدد اسم القرية أو الحي الفرعي للخدمات واللوجستيات:' : 'Choose the Village or local neighborhood:'}
              </p>
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full bg-theme-bg border border-theme-border/60 p-4 rounded-xl font-bold outline-none focus:border-primary text-theme-text transition"
              >
                {getAvailableVillages().map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>

              {village === 'أخرى' && (
                <PremiumInput 
                  type="text" 
                  placeholder={lang === 'ar' ? 'اكتب اسم القرية/الحي' : 'Type Village / District name'} 
                  value={customVillage}
                  onChange={(e) => setCustomVillage(e.target.value)}
                />
              )}

              <div className="flex gap-3 mt-6">
                <PremiumButton 
                  variant="outline"
                  onClick={() => setRegStep(3)}
                  className="flex-1"
                  leftIcon={<ArrowLeft size={14} />}
                >
                  {lang === 'ar' ? 'السابق' : 'Back'}
                </PremiumButton>
                <PremiumButton 
                  onClick={() => setRegStep(5)}
                  className="flex-1"
                  rightIcon={<ArrowRight size={14} />}
                >
                  {lang === 'ar' ? 'التالي: الحساب' : 'Next: Credentials'}
                </PremiumButton>
              </div>
            </div>
          )}

          {/* STEP 5: Store Details & Credentials */}
          {regStep === 5 && (
            <form onSubmit={handleVendorRegister} className="space-y-4">
              <PremiumInput 
                type="text" 
                placeholder={lang === 'ar' ? 'اسم المتجر (مثال: ماركت الخير)' : 'Store Name (e.g. Al-Khair Market)'} 
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                disabled={loading}
              />
              <PremiumInput 
                type="text" 
                placeholder={lang === 'ar' ? 'رقم هاتف فودافون كاش للمدفوعات' : 'Vodafone Cash Phone Number'} 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
              <PremiumInput 
                type="email" 
                placeholder={lang === 'ar' ? 'البريد الإلكتروني للعمل' : 'Vendor Business Email'} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <PremiumInput 
                type="password" 
                placeholder={lang === 'ar' ? 'كلمة مرور حساب البائع' : 'Password'} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />

              <div className="flex gap-3 mt-6">
                <PremiumButton 
                  variant="outline"
                  type="button"
                  onClick={() => setRegStep(4)}
                  className="flex-grow-[1]"
                  leftIcon={<ArrowLeft size={14} />}
                >
                  {lang === 'ar' ? 'السابق' : 'Back'}
                </PremiumButton>
                <PremiumButton 
                  type="submit"
                  isLoading={loading}
                  className="flex-grow-[2]"
                >
                  {lang === 'ar' ? 'إنشاء المتجر وتوليد الكتالوج' : 'Create Store & Catalog'}
                </PremiumButton>
              </div>
            </form>
          )}

          <p 
            className="text-center text-xs font-bold text-theme-muted mt-5 cursor-pointer hover:text-primary transition" 
            onClick={() => { setView('login'); setRegStep(1); }}
          >
            {lang === 'ar' ? 'إلغاء والعودة لتسجيل الدخول' : 'Cancel and Go Back'}
          </p>
        </div>
      )}

      {/* FORGOT PASSWORD VIEW */}
      {view === 'forgot_password' && (
        <form onSubmit={handleForgotPassword} className="w-full max-w-sm space-y-4">
          <h2 className="text-center font-black text-primary mb-2">{lang === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}</h2>
          <p className="text-center text-xs font-bold text-theme-muted mb-4">
            {lang === 'ar' ? 'أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين' : 'Enter your email to receive a password reset link'}
          </p>
          <PremiumInput 
            type="email" 
            placeholder={t('email')} 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <PremiumButton 
            type="submit"
            isLoading={loading}
            className="w-full py-3.5"
          >
            {lang === 'ar' ? 'إرسال الرابط' : 'Send Link'}
          </PremiumButton>
          <p 
            className="text-center text-xs font-bold text-theme-muted mt-4 cursor-pointer hover:text-primary transition" 
            onClick={() => setView('login')}
          >
            {lang === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
          </p>
        </form>
      )}
    </div>
  );
};

export default AuthScreen;
