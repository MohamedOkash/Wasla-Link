import React, { useState } from 'react';
import { 
  User as UserIcon, Globe, Settings, HelpCircle, LogOut, ShieldCheck, 
  ChevronLeft, MapPin, Eye, EyeOff, Save, Check, Bell, BookOpen, Trash2, Plus,
  Heart, ShoppingBag, Coins, UserPlus, Info, ExternalLink, ShieldAlert
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { LoyaltyWallet } from '../../components/loyalty/LoyaltyWallet';
import { ReferralCenter } from '../../components/referral/ReferralCenter';
import { DriverRegistration } from '../driver/DriverRegistration';
import { auth } from '../../services/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail } from 'firebase/auth';

// Premium Rebuild Imports
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumInput } from '../../components/premium/PremiumInput';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { PremiumBadge } from '../../components/premium/PremiumBadge';
import { PremiumEmptyState } from '../../components/premium/PremiumEmptyState';

interface CustomerProfileProps {
  navigate?: (name: string, params?: any) => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ navigate }) => {
  const { 
    currentUser, 
    setCurrentUser,
    setRole,
    lang, 
    setLang, 
    t, 
    isRTL, 
    goHome,
    theme,
    toggleTheme,
    savedAddresses,
    addAddress,
    editAddress,
    deleteAddress,
    setDefaultAddress,
    showToast,
    setShowNotifications
  } = useApp();

  const handleLogout = () => {
    setCurrentUser(null);
    setRole('login');
    showToast(isRTL ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully');
  };

  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Navigation sub-states (to open specific edit forms)
  const [activeSection, setActiveSection] = useState<'root' | 'info' | 'addresses' | 'security' | 'support' | 'loyalty' | 'referral'>('root');

  // Account Info states
  const [name, setName] = useState(currentUser?.name || 'أحمد محمود');
  const [email, setEmail] = useState(currentUser?.email || 'customer@demo.com');
  const [phone, setPhone] = useState(currentUser?.phone || '01012345678');

  // Address states
  const [addrLabel, setAddrLabel] = useState('');
  const [addrText, setAddrText] = useState('');

  // Password States
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Contact support states
  const [supportMsg, setSupportMsg] = useState('');

  // Legal Modal States
  const [showLegal, setShowLegal] = useState<'none' | 'privacy' | 'terms' | 'about'>('none');

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1);

  const handleLanguageToggle = () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  };

  const handleForgotPassword = async () => {
    const emailToReset = forgotEmail.trim() || currentUser?.email || '';
    if (!emailToReset) {
      showToast(isRTL ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter email');
      return;
    }
    if (!emailToReset.includes('@')) {
      showToast(isRTL ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, emailToReset);
      showToast(isRTL ? `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${emailToReset}` : `Password reset link sent to ${emailToReset}`);
      setShowForgotModal(false);
    } catch (err: any) {
      console.error(err);
      showToast(isRTL ? 'فشل إرسال البريد الإلكتروني. يرجى المحاولة لاحقاً.' : 'Failed to send reset email. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast(isRTL ? 'الرجاء إدخال حقول صحيحة' : 'Please fill required fields');
      return;
    }
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        name,
        email,
        phone
      });
    }
    showToast(isRTL ? 'تم حفظ التعديلات بنجاح' : 'Changes saved successfully');
    setActiveSection('root');
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPass || !newPass || !confirmPass) {
      showToast(isRTL ? 'الرجاء ملء جميع حقول كلمات المرور' : 'Please fill all password fields');
      return;
    }
    if (newPass !== confirmPass) {
      showToast(isRTL ? 'كلمة المرور الجديدة غير متطابقة' : 'Passwords do not match');
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      showToast(isRTL ? 'يجب تسجيل الدخول أولاً' : 'Must be logged in');
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, oldPass);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPass);
      
      showToast(isRTL ? 'تم تغيير كلمة المرور بأمان' : 'Password changed securely');
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
      setActiveSection('root');
    } catch (error: any) {
      console.error('Password change error:', error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        showToast(isRTL ? 'كلمة المرور الحالية غير صحيحة' : 'Current password incorrect');
      } else {
        showToast(isRTL ? 'حدث خطأ أثناء تغيير كلمة المرور' : 'Error changing password');
      }
    } finally {
      setLoading(false);
    }
  };

  const parseAddressText = (text: string) => {
    const parts = (text || '').split(/[،,]/).map(p => p.trim());
    return {
      governorate: parts[0] || 'الدقهلية',
      center: parts[1] || 'السنبلاوين',
      village: parts[2] || 'ميت غراب',
      street: parts[3] || 'شارع رئيسي',
      building: parts[4] || 'عمارة 1',
      floor: parts[5] || '',
      apartment: parts[6] || '',
      landmark: parts[7] || '',
      notes: parts[8] || '',
    };
  };

  const getAddressDetails = (addr: any) => {
    return `${addr.governorate || 'الدقهلية'}، ${addr.center || 'السنبلاوين'}، ${addr.village || 'ميت غراب'}، ${addr.street || ''}، ${addr.building || ''}${addr.floor ? `، ${addr.floor}` : ''}${addr.apartment ? `، ${addr.apartment}` : ''}${addr.landmark ? `، ${addr.landmark}` : ''}${addr.notes ? `، ${addr.notes}` : ''}`;
  };

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrLabel.trim() || !addrText.trim()) {
      showToast(isRTL ? 'املأ اسم اللافتة وتفاصيل العنوان' : 'Fill address label and details');
      return;
    }
    const parsed = parseAddressText(addrText);
    if (editingAddressId) {
      editAddress(editingAddressId, {
        label: addrLabel,
        ...parsed
      });
      setEditingAddressId(null);
    } else {
      addAddress({
        label: addrLabel,
        ...parsed,
        isDefault: savedAddresses.length === 0,
        gpsCoords: null
      });
    }
    setAddrLabel('');
    setAddrText('');
    showToast(isRTL ? 'تم حفظ العنوان بنجاح' : 'Address saved successfully');
  };

  const handleContactSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMsg.trim()) {
      showToast(isRTL ? 'الرجاء كتابة رسالة دعم' : 'Please write support message');
      return;
    }
    showToast(isRTL ? 'تم إرسال رسالتك، سنتصل بك قريباً!' : 'Message sent, we will contact you soon!');
    setSupportMsg('');
    setActiveSection('root');
  };

  const handleDeleteAccount = () => {
    const confirmation = window.confirm(
      isRTL 
        ? 'تحذير: هل أنت متأكد من رغبتك في حذف حسابك نهائياً؟ سيتم حذف جميع عناوينك وطلباتك ولا يمكن التراجع عن هذا الإجراء.' 
        : 'Warning: Are you sure you want to delete your account permanently? This deletes all addresses and orders and cannot be undone.'
    );
    if (confirmation) {
      showToast(isRTL ? 'تم إرسال طلب حذف الحساب للإدارة للمراجعة' : 'Account deletion request submitted for admin review');
      goHome();
    }
  };

  // 1. Account Info Section
  if (activeSection === 'info') {
    return (
      <div className="bg-theme-bg h-full flex flex-col overflow-hidden animate-fade-in theme-transition pb-20">
        <div className="bg-theme-card px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 border-b border-theme-border/60 flex items-center gap-3.5 z-20 theme-transition">
          <button onClick={() => setActiveSection('root')} className="p-2.5 text-theme-text bg-theme-bg hover:bg-theme-border/50 rounded-full transition flex items-center justify-center border border-theme-border/30">
            <ChevronLeft size={18} className={isRTL ? '' : 'rotate-180'} />
          </button>
          <h2 className="text-sm font-black text-theme-text">{isRTL ? 'تعديل الملف الشخصي' : 'Edit Personal Profile'}</h2>
        </div>

        <form onSubmit={handleSaveInfo} className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-5">
          <PremiumCard hoverable={false} className="space-y-4">
            <PremiumInput 
              label={isRTL ? 'الاسم بالكامل' : 'Full Name'}
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
            <PremiumInput 
              label={isRTL ? 'البريد الإلكتروني' : 'Email Address'}
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
            <PremiumInput 
              label={isRTL ? 'رقم الهاتف (فودافون كاش)' : 'Phone Number (Vodafone Cash)'}
              type="tel" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
            />
          </PremiumCard>
          
          <PremiumButton type="submit" variant="primary" size="lg" className="w-full shadow-md rounded-2xl h-12 text-xs font-black">
            <Save size={15} />
            <span>{isRTL ? 'حفظ البيانات' : 'Save Info'}</span>
          </PremiumButton>
        </form>
      </div>
    );
  }

  // 1.5 Driver Registration Section
  if (activeSection === 'driver_registration') {
    return <DriverRegistration onBack={() => setActiveSection('root')} />;
  }

  // 2. Saved Addresses Section
  if (activeSection === 'addresses') {
    return (
      <div className="bg-theme-bg h-full flex flex-col overflow-hidden animate-fade-in theme-transition pb-20">
        <div className="bg-theme-card px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 border-b border-theme-border/60 flex items-center gap-3.5 z-20 theme-transition">
          <button onClick={() => { setActiveSection('root'); setEditingAddressId(null); setAddrLabel(''); setAddrText(''); }} className="p-2.5 text-theme-text bg-theme-bg hover:bg-theme-border/50 rounded-full transition flex items-center justify-center border border-theme-border/30">
            <ChevronLeft size={18} className={isRTL ? '' : 'rotate-180'} />
          </button>
          <h2 className="text-sm font-black text-theme-text">{isRTL ? 'دفتر العناوين المحفوظة' : 'My Shipping Addresses'}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-5">
          {/* Add / Edit address form */}
          <form onSubmit={handleAddNewAddress} className="bg-theme-card p-5 border border-theme-border rounded-[28px] space-y-4 theme-transition">
            <span className="text-[10px] text-theme-muted font-black uppercase tracking-wider block">
              {editingAddressId 
                ? (isRTL ? 'تعديل العنوان المحدد' : 'Edit Selected Address')
                : (isRTL ? 'إضافة عنوان شحن جديد' : 'Add New Shipping Address')}
            </span>
            <PremiumInput 
              type="text" 
              value={addrLabel}
              onChange={e => setAddrLabel(e.target.value)}
              placeholder={isRTL ? 'اسم اللافتة (مثال: المنزل 🏠، المكتب 🏢)' : 'Label (e.g. Home 🏠, Office 🏢)'}
            />
            <PremiumInput 
              type="text" 
              value={addrText}
              onChange={e => setAddrText(e.target.value)}
              placeholder={isRTL ? 'تفاصيل العنوان بالكامل (الشارع، البناء، الشقة...)' : 'Full Address details (Street, Building, Flat...)'}
            />
            <div className="flex gap-3">
              {editingAddressId && (
                <PremiumButton 
                  type="button" 
                  onClick={() => { setEditingAddressId(null); setAddrLabel(''); setAddrText(''); }}
                  variant="outline"
                  size="md"
                  className="flex-1 rounded-xl h-10 text-xs font-black"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </PremiumButton>
              )}
              <PremiumButton type="submit" variant="primary" size="md" className="flex-1 rounded-xl h-10 text-xs font-black">
                {editingAddressId ? (isRTL ? 'حفظ التعديل' : 'Save Changes') : (isRTL ? 'إضافة للدفتر' : 'Add to Address Book')}
              </PremiumButton>
            </div>
          </form>

          {/* List of addresses */}
          <div className="space-y-3.5">
            {savedAddresses.map(addr => (
              <PremiumCard 
                key={addr.id} 
                hoverable={false}
                className={`flex justify-between items-center transition-all ${
                  addr.isDefault ? 'border-primary/40 bg-primary/5 shadow-sm' : ''
                }`}
              >
                <div className="flex-1 pr-1 text-right">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-xs text-theme-text">{addr.label || addr.village}</span>
                    {addr.isDefault && (
                      <PremiumBadge variant="primary" pill={true}>
                        {isRTL ? 'افتراضي' : 'Default'}
                      </PremiumBadge>
                    )}
                  </div>
                  <p className="text-[10px] text-theme-muted font-bold mt-1.5 leading-relaxed">{getAddressDetails(addr)}</p>
                  
                  {!addr.isDefault && (
                    <button 
                      onClick={() => setDefaultAddress(addr.id || '')} 
                      className="text-primary hover:underline text-[10px] font-black mt-2 block"
                    >
                      {isRTL ? 'تعيين كافتراضي' : 'Set as default'}
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button 
                    onClick={() => {
                      setEditingAddressId(addr.id || '');
                      setAddrLabel(addr.label || addr.village);
                      setAddrText(getAddressDetails(addr));
                    }} 
                    className="p-2 text-theme-muted hover:text-primary rounded-xl bg-theme-bg border border-theme-border/60 transition"
                    title={isRTL ? 'تعديل العنوان' : 'Edit Address'}
                  >
                    <Settings size={14} />
                  </button>
                  <button 
                    onClick={() => deleteAddress(addr.id || '')} 
                    className="p-2 text-theme-muted hover:text-red-500 rounded-xl bg-theme-bg border border-theme-border/60 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </PremiumCard>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. Security Section
  if (activeSection === 'security') {
    const handleForgotPasswordSimulate = () => {
      setForgotEmail(currentUser?.email || '');
      setForgotStep(1);
      setShowForgotModal(true);
    };

    return (
      <div className="bg-theme-bg h-full flex flex-col overflow-hidden animate-fade-in theme-transition pb-20">
        <div className="bg-theme-card px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 border-b border-theme-border/60 flex items-center gap-3.5 z-20 theme-transition">
          <button onClick={() => setActiveSection('root')} className="p-2.5 text-theme-text bg-theme-bg hover:bg-theme-border/50 rounded-full transition flex items-center justify-center border border-theme-border/30">
            <ChevronLeft size={18} className={isRTL ? '' : 'rotate-180'} />
          </button>
          <h2 className="text-sm font-black text-theme-text">{isRTL ? 'الأمان وتغيير كلمة المرور' : 'Security & Password'}</h2>
        </div>

        <form onSubmit={handleSavePassword} className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-4">
          <PremiumCard hoverable={false} className="space-y-4 relative">
            <button 
              type="button" 
              onClick={() => setShowPass(!showPass)}
              className="absolute top-5 left-5 text-theme-muted hover:text-theme-text transition z-10 p-1 hover:bg-theme-border/40 rounded"
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>

            <PremiumInput 
              label={isRTL ? 'كلمة المرور الحالية' : 'Current Password'}
              type={showPass ? 'text' : 'password'} 
              value={oldPass} 
              onChange={e => setOldPass(e.target.value)} 
            />
            <PremiumInput 
              label={isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
              type={showPass ? 'text' : 'password'} 
              value={newPass} 
              onChange={e => setNewPass(e.target.value)} 
            />
            <PremiumInput 
              label={isRTL ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
              type={showPass ? 'text' : 'password'} 
              value={confirmPass} 
              onChange={e => setConfirmPass(e.target.value)} 
            />
          </PremiumCard>

          <PremiumButton 
            type="button" 
            onClick={handleForgotPasswordSimulate}
            variant="outline"
            size="md"
            className="w-full rounded-2xl h-11 text-xs font-black border-theme-border"
          >
            {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
          </PremiumButton>

          <PremiumButton type="submit" variant="primary" size="lg" className="w-full shadow-md rounded-2xl h-12 text-xs font-black">
            <Save size={15} />
            <span>{isRTL ? 'حفظ كلمة المرور' : 'Save Password'}</span>
          </PremiumButton>

          <PremiumButton 
            type="button" 
            onClick={handleDeleteAccount}
            variant="ghost"
            size="md"
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-600 rounded-2xl h-11 text-xs font-black transition-all"
          >
            {isRTL ? 'حذف الحساب نهائياً من وصلة لينك' : 'Delete Account Permanently'}
          </PremiumButton>
        </form>
      </div>
    );
  }

  // 4. Support Section
  if (activeSection === 'support') {
    return (
      <div className="bg-theme-bg h-full flex flex-col overflow-hidden animate-fade-in theme-transition pb-20">
        <div className="bg-theme-card px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 border-b border-theme-border/60 flex items-center gap-3.5 z-20 theme-transition">
          <button onClick={() => setActiveSection('root')} className="p-2.5 text-theme-text bg-theme-bg hover:bg-theme-border/50 rounded-full transition flex items-center justify-center border border-theme-border/30">
            <ChevronLeft size={18} className={isRTL ? '' : 'rotate-180'} />
          </button>
          <h2 className="text-sm font-black text-theme-text">{isRTL ? 'الاتصال بالدعم الفني' : 'Technical Support Help'}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-4">
          <PremiumCard hoverable={false} className="space-y-3.5 p-4.5 bg-theme-bg/15">
            <span className="text-[10px] text-theme-muted font-black uppercase tracking-wider block">{isRTL ? 'معلومات الاتصال المباشر' : 'Direct Contact Info'}</span>
            <div className="text-xs font-bold text-theme-text space-y-3">
              <p className="flex items-center justify-between">
                <span className="text-theme-muted">{isRTL ? '📞 الخط الساخن: ' : 'Hotline: '}</span>
                <a href="tel:19999" className="text-primary font-black hover:underline font-sans">19999</a>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-theme-muted">{isRTL ? '💬 واتساب الدعم: ' : 'WhatsApp chat: '}</span>
                <a href="https://wa.me/201000000000" className="text-primary font-black hover:underline font-sans">01000000000</a>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-theme-muted">{isRTL ? '✉️ البريد الإلكتروني: ' : 'Support email: '}</span>
                <a href="mailto:support@waslalink.com" className="text-primary font-black hover:underline font-sans">support@waslalink.com</a>
              </p>
            </div>
          </PremiumCard>

          <form onSubmit={handleContactSupport} className="space-y-4">
            <PremiumCard hoverable={false} className="space-y-3">
              <span className="text-[10px] text-theme-muted font-black uppercase tracking-wider block">{isRTL ? 'أرسل لنا استفسارك أو مشكلتك مباشرة وسيرد عليك ممثلو خدمة العملاء' : 'Send us your questions or problems and customer agents will reply'}</span>
              <textarea 
                rows={5}
                value={supportMsg}
                onChange={e => setSupportMsg(e.target.value)}
                placeholder={isRTL ? 'اكتب رسالتك أو استفسارك بالتفصيل هنا...' : 'Write your request details here...'}
                className="w-full bg-theme-bg border border-theme-border rounded-xl p-3.5 text-xs font-bold text-theme-text outline-none focus:border-primary theme-transition"
              />
            </PremiumCard>
            <PremiumButton type="submit" variant="primary" size="lg" className="w-full shadow-md rounded-2xl h-12 text-xs font-black">
              {isRTL ? 'إرسال الرسالة' : 'Send Ticket'}
            </PremiumButton>
          </form>
        </div>
      </div>
    );
  }

  // 5. Loyalty section details
  if (activeSection === 'loyalty') {
    return (
      <div className="bg-theme-bg h-full flex flex-col overflow-hidden animate-fade-in theme-transition pb-24">
        <div className="bg-theme-card px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 border-b border-theme-border/60 flex items-center gap-3.5 z-20 theme-transition">
          <button onClick={() => setActiveSection('root')} className="p-2.5 text-theme-text bg-theme-bg hover:bg-theme-border/50 rounded-full transition flex items-center justify-center border border-theme-border/30">
            <ChevronLeft size={18} className={isRTL ? '' : 'rotate-180'} />
          </button>
          <h2 className="text-sm font-black text-theme-text">{isRTL ? 'تفاصيل محفظة نقاط الولاء' : 'Loyalty Points Wallet'}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
          <LoyaltyWallet />
        </div>
      </div>
    );
  }

  // 6. Referral section details
  if (activeSection === 'referral') {
    return (
      <div className="bg-theme-bg h-full flex flex-col overflow-hidden animate-fade-in theme-transition pb-24">
        <div className="bg-theme-card px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 border-b border-theme-border/60 flex items-center gap-3.5 z-20 theme-transition">
          <button onClick={() => setActiveSection('root')} className="p-2.5 text-theme-text bg-theme-bg hover:bg-theme-border/50 rounded-full transition flex items-center justify-center border border-theme-border/30">
            <ChevronLeft size={18} className={isRTL ? '' : 'rotate-180'} />
          </button>
          <h2 className="text-sm font-black text-theme-text">{isRTL ? 'نظام الإحالات ودعوة الأصدقاء' : 'Referral & Invite System'}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
          <ReferralCenter />
        </div>
      </div>
    );
  }

  // 7. Root Dashboard Center View (Dashboard Grid Cards)
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-theme-bg theme-transition pb-[calc(env(safe-area-inset-bottom)+5.5rem)]">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        
        {/* Profile Card Header */}
        <div className="bg-primary px-5 pt-[calc(env(safe-area-inset-top)+2rem)] pb-8 rounded-b-[40px] shadow-md text-white text-center relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent)]"></div>
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[22px] shadow-inner flex items-center justify-center mx-auto mb-3 border border-white/25">
            <UserIcon size={32} className="text-white" />
          </div>
          <h2 className="text-base font-black tracking-tight">{currentUser?.name || 'أحمد محمود'}</h2>
          <p className="text-[10px] opacity-80 mt-0.5 font-bold font-sans">{currentUser?.email || 'customer@demo.com'}</p>
        </div>

        {/* Dashboard Grid Layout (Better information density) */}
        <div className="p-5 space-y-4">
          <span className="text-[10px] text-theme-muted font-black px-1 uppercase tracking-wider block leading-none">
            {isRTL ? 'لوحة التحكم والخدمات' : 'Control Dashboard'}
          </span>

          <div className="grid grid-cols-2 gap-3.5">
            
            {/* Grid item: Personal Info */}
            <PremiumCard 
              onClick={() => setActiveSection('info')}
              className="p-4 flex flex-col justify-between h-32 bg-theme-card/65"
            >
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary w-max transition-transform duration-300 hover:scale-105">
                <UserIcon size={18} />
              </div>
              <div>
                <h3 className="font-black text-xs text-theme-text leading-none">{isRTL ? 'بياناتي' : 'Personal Info'}</h3>
                <p className="text-[9px] text-theme-muted font-bold mt-1 leading-snug">{isRTL ? 'الاسم والهاتف والبريد' : 'Edit name & phone'}</p>
              </div>
            </PremiumCard>
            
            {/* Grid item: My Addresses */}
            <PremiumCard 
              onClick={() => setActiveSection('addresses')}
              className="p-4 flex flex-col justify-between h-32 bg-theme-card/65"
            >
              <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-500 w-max transition-transform duration-300 hover:scale-105">
                <MapPin size={18} />
              </div>
              <div>
                <h3 className="font-black text-xs text-theme-text leading-none">{isRTL ? 'عناويني' : 'My Addresses'}</h3>
                <p className="text-[9px] text-theme-muted font-bold mt-1 leading-snug">{isRTL ? 'إدارة وتعديل عناوين التوصيل' : 'Manage shipping routes'}</p>
              </div>
            </PremiumCard>

            {/* Grid item: Loyalty points */}
            <PremiumCard 
              onClick={() => setActiveSection('loyalty')}
              className="p-4 flex flex-col justify-between h-32 bg-theme-card/65"
            >
              <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500 w-max transition-transform duration-300 hover:scale-105">
                <Coins size={18} />
              </div>
              <div>
                <h3 className="font-black text-xs text-theme-text leading-none">{isRTL ? 'نقاط الولاء' : 'Loyalty Points'}</h3>
                <p className="text-[9px] text-theme-muted font-bold mt-1 leading-snug">
                  {isRTL ? `رصيدك: ${currentUser?.points || 0} نقطة` : `Balance: ${currentUser?.points || 0} pts`}
                </p>
              </div>
            </PremiumCard>
            
            {/* Grid item: Referrals invite */}
            <PremiumCard 
              onClick={() => setActiveSection('referral')}
              className="p-4 flex flex-col justify-between h-32 bg-theme-card/65"
            >
              <div className="bg-purple-500/10 p-2.5 rounded-xl text-purple-500 w-max transition-transform duration-300 hover:scale-105">
                <UserPlus size={18} />
              </div>
              <div>
                <h3 className="font-black text-xs text-theme-text leading-none">{isRTL ? 'دعوة أصدقاء' : 'Invite Friends'}</h3>
                <p className="text-[9px] text-theme-muted font-bold mt-1 leading-snug">
                  {isRTL ? 'اكسب 500 نقطة عن كل صديق' : 'Share code, earn 500 pts'}
                </p>
              </div>
            </PremiumCard>

            {/* Grid item: Orders */}
            <PremiumCard 
              onClick={() => navigate?.('orders')}
              className="p-4 flex flex-col justify-between h-32 bg-theme-card/65"
            >
              <div className="bg-green-500/10 p-2.5 rounded-xl text-green-500 w-max transition-transform duration-300 hover:scale-105">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h3 className="font-black text-xs text-theme-text leading-none">{isRTL ? 'طلباتي' : 'My Orders'}</h3>
                <p className="text-[9px] text-theme-muted font-bold mt-1 leading-snug">{isRTL ? 'متابعة وتتبع طلباتك الحالية' : 'Track your order history'}</p>
              </div>
            </PremiumCard>

            {/* Grid item: Favorites */}
            <PremiumCard 
              onClick={() => navigate?.('favorites')}
              className="p-4 flex flex-col justify-between h-32 bg-theme-card/65"
            >
              <div className="bg-red-500/10 p-2.5 rounded-xl text-red-500 w-max transition-transform duration-300 hover:scale-105">
                <Heart size={18} />
              </div>
              <div>
                <h3 className="font-black text-xs text-theme-text leading-none">{isRTL ? 'المفضلة' : 'Favorites'}</h3>
                <p className="text-[9px] text-theme-muted font-bold mt-1 leading-snug">{isRTL ? 'المتاجر والسلع المحفوظة' : 'Favorite store & products'}</p>
              </div>
            </PremiumCard>

            {/* Grid item: Notifications */}
            <PremiumCard 
              onClick={() => setShowNotifications(true)}
              className="p-4 flex flex-col justify-between h-32 bg-theme-card/65"
            >
              <div className="bg-orange-500/10 p-2.5 rounded-xl text-orange-500 w-max transition-transform duration-300 hover:scale-105">
                <Bell size={18} />
              </div>
              <div>
                <h3 className="font-black text-xs text-theme-text leading-none">{isRTL ? 'الإشعارات' : 'Notifications'}</h3>
                <p className="text-[9px] text-theme-muted font-bold mt-1 leading-snug">{isRTL ? 'تنبيهات العروض والتوصيل' : 'View notification log'}</p>
              </div>
            </PremiumCard>

            {/* Grid item: Theme settings */}
            <PremiumCard 
              onClick={toggleTheme}
              className="p-4 flex flex-col justify-between h-32 bg-theme-card/65"
            >
              <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500 w-max transition-transform duration-300 hover:scale-105">
                <Settings size={18} />
              </div>
              <div>
                <h3 className="font-black text-xs text-theme-text leading-none">{isRTL ? 'المظهر' : 'Theme Mode'}</h3>
                <p className="text-[9px] text-theme-muted font-bold mt-1 leading-snug">
                  {theme === 'orange' ? (isRTL ? 'برتقالي 🍊' : 'Orange 🍊') : (isRTL ? 'داكن 🌙' : 'Midnight 🌙')}
                </p>
              </div>
            </PremiumCard>

            {/* Grid item: Language switcher */}
            <PremiumCard 
              onClick={handleLanguageToggle}
              className="p-4 flex flex-col justify-between h-32 bg-theme-card/65"
            >
              <div className="bg-purple-500/10 p-2.5 rounded-xl text-purple-500 w-max transition-transform duration-300 hover:scale-105">
                <Globe size={18} />
              </div>
              <div>
                <h3 className="font-black text-xs text-theme-text leading-none">{isRTL ? 'اللغة' : 'Language'}</h3>
                <p className="text-[9px] text-theme-muted font-bold mt-1 leading-snug font-sans">
                  {lang === 'ar' ? 'English (En)' : 'العربية (Ar)'}
                </p>
              </div>
            </PremiumCard>

            {/* Grid item: Security */}
            <PremiumCard 
              onClick={() => setActiveSection('security')}
              className="p-4 flex flex-col justify-between h-32 bg-theme-card/65"
            >
              <div className="bg-teal-500/10 p-2.5 rounded-xl text-teal-500 w-max transition-transform duration-300 hover:scale-105">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="font-black text-xs text-theme-text leading-none">{isRTL ? 'الأمان' : 'Security'}</h3>
                <p className="text-[9px] text-theme-muted font-bold mt-1 leading-snug">{isRTL ? 'تعديل وحماية الحساب' : 'Edit account password'}</p>
              </div>
            </PremiumCard>

            {/* Grid item: Support */}
            <PremiumCard 
              onClick={() => setActiveSection('support')}
              className="p-4 flex flex-col justify-between h-32 bg-theme-card/65"
            >
              <div className="bg-cyan-500/10 p-2.5 rounded-xl text-cyan-500 w-max transition-transform duration-300 hover:scale-105">
                <HelpCircle size={18} />
              </div>
              <div>
                <h3 className="font-black text-xs text-theme-text leading-none">{isRTL ? 'الدعم الفني' : 'Support Help'}</h3>
                <p className="text-[9px] text-theme-muted font-bold mt-1 leading-snug">{isRTL ? 'الاتصال بنا والمساعدة' : 'Talk with customer agents'}</p>
              </div>
            </PremiumCard>

            {/* Grid item: Legal info */}
            <PremiumCard 
              onClick={() => setShowLegal('terms')}
              className="p-4 flex flex-col justify-between h-32 bg-theme-card/65"
            >
              <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-500 w-max transition-transform duration-300 hover:scale-105">
                <BookOpen size={18} />
              </div>
              <div>
                <h3 className="font-black text-xs text-theme-text leading-none">{isRTL ? 'الشروط والأحكام' : 'Terms & Info'}</h3>
                <p className="text-[9px] text-theme-muted font-bold mt-1 leading-snug">{isRTL ? 'بيان الخصوصية واستخدام التطبيق' : 'About and privacy policies'}</p>
              </div>
            </PremiumCard>

          </div>

          {/* Logout Button */}
          <PremiumButton 
            onClick={handleLogout}
            variant="ghost"
            size="lg"
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-600 rounded-2xl h-12 text-xs font-black transition-all flex items-center justify-center gap-2 mt-4"
          >
            <LogOut size={16} />
            <span>{t('logout')}</span>
          </PremiumButton>
        </div>
      </div>

      {/* Legal Modal Drawer */}
      {showLegal !== 'none' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center p-0 animate-fade-in">
          <div className="bg-theme-card p-6 border-t border-theme-border rounded-t-[32px] w-full max-w-[400px] space-y-4.5 shadow-2xl animate-slide-up pb-[calc(env(safe-area-inset-bottom)+1.5rem)] theme-transition text-right">
            <div className="flex justify-between items-center pb-3 border-b border-theme-border/60">
              <h4 className="font-black text-sm text-theme-text leading-none">
                {showLegal === 'privacy' && (isRTL ? 'سياسة الخصوصية' : 'Privacy Policy')}
                {showLegal === 'terms' && (isRTL ? 'الشروط والأحكام' : 'Terms of Use')}
                {showLegal === 'about' && (isRTL ? 'عن وصلة لينك' : 'About WaslaLink')}
              </h4>
              <button 
                onClick={() => setShowLegal('none')} 
                className="p-1 text-theme-muted hover:text-theme-text bg-theme-bg hover:bg-theme-border/60 rounded-full transition"
              >
                <XIcon size={16} />
              </button>
            </div>
            <div className="text-[11px] text-theme-muted leading-relaxed font-bold max-h-[35vh] overflow-y-auto pr-1 no-scrollbar text-right">
              {showLegal === 'privacy' && (
                isRTL 
                  ? 'منصة وصلة لينك ملتزمة بحماية بياناتك الشخصية وموقعك الجغرافي. نستخدم إذن الموقع فقط لتحديد وتيسير شحن وتوصيل الطلبات من المتاجر المجاورة لك بدقة. لا يتم مشاركة بيانات الدفع أو أرقام الهواتف لأطراف ثالثة لأغراض دعائية.'
                  : 'WaslaLink marketplace is fully committed to protecting your personal coordinates and profile data. Geolocation services are queried strictly to route delivery orders from nearby neighborhood stores. No digital wallets or email logs are shared with external third-party agencies.'
              )}
              {showLegal === 'terms' && (
                isRTL
                  ? 'باستخدامك لتطبيق وصلة لينك، فإنك توافق على الشروط والأحكام الحالية. المتاجر الشريكة مسؤولة بالكامل عن تسعير المنتجات وجودتها. يلتزم مندوب التوصيل بتوصيل الطلب إلى موقعك المحدد بالـ GPS، ويرجى إرفاق إيصالات دفع صحيحة لطلبات الدفع الرقمي.'
                  : 'By accessing or placing orders through WaslaLink, you legally agree to these Terms. Partner merchants maintain full authority over product pricing, availability, and packaging. Drivers will complete shipments to the resolved GPS coordinates.'
              )}
              {showLegal === 'about' && (
                isRTL
                  ? 'وصلة لينك (WaslaLink) هي منصة للتجارة المحلية والطلب اللحظي، تهدف لربط العملاء بأقرب المتاجر، الصيدليات، المطاعم، والمكتبات والفرن في محيطهم الجغرافي لتبسيط دورة الشراء والتوصيل اليومية.'
                  : 'WaslaLink is a localized marketplace connecting neighborhood customers directly with supermarkets, pharmacies, bakeries, libraries, and restaurants nearby to simplify daily home shopping and delivery.'
              )}
            </div>
            <PremiumButton 
              onClick={() => setShowLegal('none')} 
              variant="primary"
              size="md"
              className="w-full rounded-xl text-xs font-black h-10"
            >
              {isRTL ? 'فهمت وموافق' : 'I Understand'}
            </PremiumButton>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center p-0 animate-fade-in">
          <div className="bg-theme-card p-6 border-t border-theme-border rounded-t-[32px] w-full max-w-[400px] space-y-4.5 shadow-2xl animate-slide-up pb-[calc(env(safe-area-inset-bottom)+1.5rem)] theme-transition text-right">
            <div className="flex justify-between items-center pb-3 border-b border-theme-border/60">
              <h4 className="font-black text-sm text-theme-text leading-none">
                {isRTL ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
              </h4>
              <button 
                onClick={() => setShowForgotModal(false)} 
                className="p-1 text-theme-muted hover:text-theme-text bg-theme-bg hover:bg-theme-border/60 rounded-full transition"
              >
                <XIcon size={16} />
              </button>
            </div>
            
            {forgotStep === 1 ? (
              <form onSubmit={handleSendResetEmail} className="space-y-4">
                <p className="text-[11px] text-theme-muted font-bold leading-relaxed">
                  {isRTL 
                    ? 'أدخل بريدك الإلكتروني المسجل وسنقوم بإرسال رابط إعادة تعيين كلمة المرور التجريبي.' 
                    : 'Enter your registered email address and we will send a password reset link.'}
                </p>
                <PremiumInput 
                  type="email" 
                  value={forgotEmail} 
                  onChange={e => setForgotEmail(e.target.value)} 
                  placeholder="name@domain.com"
                  required
                />
                <PremiumButton 
                  type="submit" 
                  variant="primary"
                  size="md"
                  className="w-full rounded-xl text-xs font-black h-10"
                >
                  {isRTL ? 'إرسال رابط إعادة التعيين' : 'Send Reset Link'}
                </PremiumButton>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 text-green-600 p-4.5 rounded-2xl text-center space-y-2">
                  <Check className="mx-auto text-green-500" size={24} />
                  <p className="text-xs font-black">{isRTL ? 'تم الإرسال بنجاح!' : 'Sent Successfully!'}</p>
                </div>
                <p className="text-[11px] text-theme-muted font-bold leading-relaxed text-center">
                  {isRTL 
                    ? `تم إرسال الرابط بنجاح إلى ${forgotEmail}. يرجى التحقق من صندوق البريد الوارد.` 
                    : `The link has been sent successfully to ${forgotEmail}. Please check your inbox.`}
                </p>
                <PremiumButton 
                  onClick={() => setShowForgotModal(false)} 
                  variant="primary"
                  size="md"
                  className="w-full rounded-xl text-xs font-black h-10"
                >
                  {isRTL ? 'إغلاق' : 'Close'}
                </PremiumButton>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const XIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default CustomerProfile;
