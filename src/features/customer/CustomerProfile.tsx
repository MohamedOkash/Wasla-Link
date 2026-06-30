import { useTranslation } from '../../hooks/useTranslation';
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
import { PremiumBottomSheet } from '../../components/premium/PremiumBottomSheet';
import { ChatWidget } from '../../components/chat/ChatWidget';
import { MessageSquare } from 'lucide-react';

interface CustomerProfileProps {
  navigate?: (name: string, params?: any) => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ navigate }) => {
  const { t } = useTranslation();
  const { 
    currentUser, 
    setCurrentUser,
    setRole,
    lang, 
    setLang,  
    isRTL, 
    goHome,
    theme,
    setTheme,
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
    showToast(t('str_213'));
  };

  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Navigation sub-states (to open specific edit forms)
  const [activeSection, setActiveSection] = useState<'root' | 'info' | 'addresses' | 'security' | 'support' | 'loyalty' | 'referral' | 'driver_registration'>('root');
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);

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
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleLanguageToggle = () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  };

  const handleForgotPassword = async () => {
    const emailToReset = forgotEmail.trim() || currentUser?.email || '';
    if (!emailToReset) {
      showToast(t('str_214'));
      return;
    }
    if (!emailToReset.includes('@')) {
      showToast(t('str_215'));
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, emailToReset);
      showToast(t('str_216', { emailToReset }));
      setShowForgotModal(false);
    } catch (err: any) {
      console.error(err);
      showToast(t('str_217'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast(t('str_218'));
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
    showToast(t('str_219'));
    setActiveSection('root');
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPass || !newPass || !confirmPass) {
      showToast(t('str_220'));
      return;
    }
    if (newPass !== confirmPass) {
      showToast(t('str_221'));
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      showToast(t('str_222'));
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, oldPass);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPass);
      
      showToast(t('str_223'));
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
      setActiveSection('root');
    } catch (error: any) {
      console.error('Password change error:', error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        showToast(t('str_224'));
      } else {
        showToast(t('str_225'));
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
      showToast(t('str_226'));
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
    showToast(t('str_227'));
  };

  const handleContactSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMsg.trim()) {
      showToast(t('str_228'));
      return;
    }
    showToast(t('str_229'));
    setSupportMsg('');
    setActiveSection('root');
  };

  const handleDeleteAccount = () => {
    const confirmation = window.confirm(
      t('str_230')
    );
    if (confirmation) {
      showToast(t('str_231'));
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
          <h2 className="text-sm font-black text-theme-text">{t('str_232')}</h2>
        </div>

        <form onSubmit={handleSaveInfo} className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-5">
          <PremiumCard hoverable={false} className="space-y-4">
            <PremiumInput 
              label={t('str_233')}
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
            <PremiumInput 
              label={t('str_234')}
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
            <PremiumInput 
              label={t('str_235')}
              type="tel" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
            />
          </PremiumCard>
          
          <PremiumButton type="submit" variant="primary" size="lg" className="w-full shadow-md rounded-2xl h-12 text-xs font-black">
            <Save size={15} />
            <span>{t('str_236')}</span>
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
          <h2 className="text-sm font-black text-theme-text">{t('str_237')}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-5">
          {/* Add / Edit address form */}
          <form onSubmit={handleAddNewAddress} className="bg-theme-card p-5 border border-theme-border rounded-[28px] space-y-4 theme-transition">
            <span className="text-[10px] text-theme-muted font-black uppercase tracking-wider block">
              {editingAddressId 
                ? (t('str_238'))
                : (t('str_239'))}
            </span>
            <PremiumInput 
              type="text" 
              value={addrLabel}
              onChange={e => setAddrLabel(e.target.value)}
              placeholder={t('str_240')}
            />
            <PremiumInput 
              type="text" 
              value={addrText}
              onChange={e => setAddrText(e.target.value)}
              placeholder={t('str_241')}
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
                  {t('str_56')}
                </PremiumButton>
              )}
              <PremiumButton type="submit" variant="primary" size="md" className="flex-1 rounded-xl h-10 text-xs font-black">
                {editingAddressId ? (t('str_242')) : (t('str_243'))}
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
                        {t('str_77')}
                      </PremiumBadge>
                    )}
                  </div>
                  <p className="text-[10px] text-theme-muted font-bold mt-1.5 leading-relaxed">{getAddressDetails(addr)}</p>
                  
                  {!addr.isDefault && (
                    <button 
                      onClick={() => setDefaultAddress(addr.id || '')} 
                      className="text-primary hover:underline text-[10px] font-black mt-2 block"
                    >
                      {t('str_244')}
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
                    title={t('str_245')}
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
          <h2 className="text-sm font-black text-theme-text">{t('str_246')}</h2>
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
              label={t('str_247')}
              type={showPass ? 'text' : 'password'} 
              value={oldPass} 
              onChange={e => setOldPass(e.target.value)} 
            />
            <PremiumInput 
              label={t('str_248')}
              type={showPass ? 'text' : 'password'} 
              value={newPass} 
              onChange={e => setNewPass(e.target.value)} 
            />
            <PremiumInput 
              label={t('str_249')}
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
            {t('str_250')}
          </PremiumButton>

          <PremiumButton type="submit" variant="primary" size="lg" className="w-full shadow-md rounded-2xl h-12 text-xs font-black">
            <Save size={15} />
            <span>{t('str_251')}</span>
          </PremiumButton>

          <PremiumButton 
            type="button" 
            onClick={handleDeleteAccount}
            variant="ghost"
            size="md"
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-600 rounded-2xl h-11 text-xs font-black transition-all"
          >
            {t('str_252')}
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
          <h2 className="text-sm font-black text-theme-text">{t('str_253')}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-4">
          <PremiumCard hoverable={false} className="space-y-3.5 p-4.5 bg-theme-bg/15">
            <span className="text-[10px] text-theme-muted font-black uppercase tracking-wider block">{t('str_254')}</span>
            <div className="text-xs font-bold text-theme-text space-y-3">
              <p className="flex items-center justify-between">
                <span className="text-theme-muted">{t('str_255')}</span>
                <a href="tel:19999" className="text-primary font-black hover:underline font-sans">19999</a>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-theme-muted">{t('str_256')}</span>
                <a href="https://wa.me/201000000000" className="text-primary font-black hover:underline font-sans">01000000000</a>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-theme-muted">{t('str_257')}</span>
                <a href="mailto:support@waslalink.com" className="text-primary font-black hover:underline font-sans">support@waslalink.com</a>
              </p>
            </div>
          </PremiumCard>

          <form onSubmit={handleContactSupport} className="space-y-4">
            <PremiumCard hoverable={false} className="space-y-3">
              <span className="text-[10px] text-theme-muted font-black uppercase tracking-wider block">{t('str_258')}</span>
              <textarea 
                rows={5}
                value={supportMsg}
                onChange={e => setSupportMsg(e.target.value)}
                placeholder={t('str_259')}
                className="w-full bg-theme-bg border border-theme-border rounded-xl p-3.5 text-xs font-bold text-theme-text outline-none focus:border-primary theme-transition"
              />
            </PremiumCard>
            <PremiumButton type="submit" variant="primary" size="lg" className="w-full shadow-md rounded-2xl h-12 text-xs font-black">
              {t('str_260')}
            </PremiumButton>
          </form>
          
          <div className="pt-4 border-t border-theme-border/50">
            <PremiumButton 
              onClick={() => setIsSupportChatOpen(true)}
              variant="outline" 
              size="lg" 
              className="w-full shadow-sm rounded-2xl h-12 text-xs font-black flex items-center justify-center gap-2 border-primary text-primary"
            >
              <MessageSquare size={18} />
              {isRTL ? 'محادثة الدعم الفني المباشر' : 'Live Support Chat'}
            </PremiumButton>
          </div>
        </div>

        {isSupportChatOpen && (
          <ChatWidget
            orderId={`support_${currentUser?.id}`}
            title={isRTL ? 'الدعم الفني والشكاوى' : 'Support & Complaints'}
            isOpen={true}
            onClose={() => setIsSupportChatOpen(false)}
            currentUserRole="customer"
            participants={[currentUser?.id as string, 'admin']}
            participantRoles={{
              [currentUser?.id as string]: 'customer',
              'admin': 'admin'
            }}
          />
        )}
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
          <h2 className="text-sm font-black text-theme-text">{t('str_261')}</h2>
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
          <h2 className="text-sm font-black text-theme-text">{t('str_262')}</h2>
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

        {/* Dashboard List Layout (Compact Information Density) */}
        <div className="p-5 space-y-5">

          {/* Account Settings */}
          <div className="space-y-2">
            <span className="text-[10px] text-theme-muted font-black px-1 uppercase tracking-wider block leading-none">
              {t('str_263') || 'Account'}
            </span>
            <PremiumCard hoverable={false} className="p-0 overflow-hidden bg-theme-card/65 divide-y divide-theme-border/30">
              <button onClick={() => setActiveSection('info')} className="w-full flex items-center justify-between p-4 hover:bg-theme-border/20 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary"><UserIcon size={16} /></div>
                  <span className="font-black text-xs text-theme-text">{t('str_264')}</span>
                </div>
                <ChevronLeft size={16} className={`text-theme-muted ${isRTL ? '' : 'rotate-180'}`} />
              </button>
              
              <button onClick={() => setActiveSection('addresses')} className="w-full flex items-center justify-between p-4 hover:bg-theme-border/20 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2 rounded-lg text-blue-500"><MapPin size={16} /></div>
                  <span className="font-black text-xs text-theme-text">{t('str_266')}</span>
                </div>
                <ChevronLeft size={16} className={`text-theme-muted ${isRTL ? '' : 'rotate-180'}`} />
              </button>

              <button onClick={() => setActiveSection('security')} className="w-full flex items-center justify-between p-4 hover:bg-theme-border/20 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="bg-teal-500/10 p-2 rounded-lg text-teal-500"><ShieldCheck size={16} /></div>
                  <span className="font-black text-xs text-theme-text">{t('str_282')}</span>
                </div>
                <ChevronLeft size={16} className={`text-theme-muted ${isRTL ? '' : 'rotate-180'}`} />
              </button>
            </PremiumCard>
          </div>

          {/* Activity & Rewards */}
          <div className="space-y-2">
            <span className="text-[10px] text-theme-muted font-black px-1 uppercase tracking-wider block leading-none">
              Activity & Rewards
            </span>
            <PremiumCard hoverable={false} className="p-0 overflow-hidden bg-theme-card/65 divide-y divide-theme-border/30">
              <button onClick={() => navigate?.('orders')} className="w-full flex items-center justify-between p-4 hover:bg-theme-border/20 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/10 p-2 rounded-lg text-green-500"><ShoppingBag size={16} /></div>
                  <span className="font-black text-xs text-theme-text">{t('str_272')}</span>
                </div>
                <ChevronLeft size={16} className={`text-theme-muted ${isRTL ? '' : 'rotate-180'}`} />
              </button>

              <button onClick={() => navigate?.('favorites')} className="w-full flex items-center justify-between p-4 hover:bg-theme-border/20 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/10 p-2 rounded-lg text-red-500"><Heart size={16} /></div>
                  <span className="font-black text-xs text-theme-text">{t('str_274')}</span>
                </div>
                <ChevronLeft size={16} className={`text-theme-muted ${isRTL ? '' : 'rotate-180'}`} />
              </button>

              <button onClick={() => setActiveSection('loyalty')} className="w-full flex items-center justify-between p-4 hover:bg-theme-border/20 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500"><Coins size={16} /></div>
                  <span className="font-black text-xs text-theme-text">{t('str_268')}</span>
                </div>
                <span className="text-[10px] text-theme-muted font-bold mr-auto ml-2">{currentUser?.points || 0} pts</span>
                <ChevronLeft size={16} className={`text-theme-muted ${isRTL ? '' : 'rotate-180'}`} />
              </button>

              <button onClick={() => setActiveSection('referral')} className="w-full flex items-center justify-between p-4 hover:bg-theme-border/20 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500/10 p-2 rounded-lg text-purple-500"><UserPlus size={16} /></div>
                  <span className="font-black text-xs text-theme-text">{t('str_270')}</span>
                </div>
                <ChevronLeft size={16} className={`text-theme-muted ${isRTL ? '' : 'rotate-180'}`} />
              </button>
            </PremiumCard>
          </div>

          {/* Preferences */}
          <div className="space-y-2">
            <span className="text-[10px] text-theme-muted font-black px-1 uppercase tracking-wider block leading-none">
              Preferences
            </span>
            <PremiumCard hoverable={false} className="p-0 overflow-hidden bg-theme-card/65 divide-y divide-theme-border/30">
              <button onClick={() => setShowNotifications(true)} className="w-full flex items-center justify-between p-4 hover:bg-theme-border/20 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500/10 p-2 rounded-lg text-orange-500"><Bell size={16} /></div>
                  <span className="font-black text-xs text-theme-text">{t('str_276')}</span>
                </div>
                <ChevronLeft size={16} className={`text-theme-muted ${isRTL ? '' : 'rotate-180'}`} />
              </button>
              
              <button onClick={() => setShowThemeModal(true)} className="w-full flex items-center justify-between p-4 hover:bg-theme-border/20 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${theme === 'orange' ? 'bg-amber-500/10 text-amber-500' : theme === 'midnight' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-purple-500/10 text-purple-400'}`}><Settings size={16} /></div>
                  <span className="font-black text-xs text-theme-text">{t('str_278')}</span>
                </div>
                <ChevronLeft size={16} className={`text-theme-muted ${isRTL ? '' : 'rotate-180'}`} />
              </button>

              <button onClick={handleLanguageToggle} className="w-full flex items-center justify-between p-4 hover:bg-theme-border/20 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500/10 p-2 rounded-lg text-purple-500"><Globe size={16} /></div>
                  <span className="font-black text-xs text-theme-text">{t('str_281')}</span>
                </div>
                <span className="text-[10px] text-theme-muted font-bold mr-auto ml-2">{lang.toUpperCase()}</span>
                <ChevronLeft size={16} className={`text-theme-muted ${isRTL ? '' : 'rotate-180'}`} />
              </button>
            </PremiumCard>
          </div>

          {/* Support */}
          <div className="space-y-2">
            <PremiumCard hoverable={false} className="p-0 overflow-hidden bg-theme-card/65 divide-y divide-theme-border/30">
              <button onClick={() => setActiveSection('support')} className="w-full flex items-center justify-between p-4 hover:bg-theme-border/20 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-500/10 p-2 rounded-lg text-cyan-500"><HelpCircle size={16} /></div>
                  <span className="font-black text-xs text-theme-text">{t('str_284')}</span>
                </div>
                <ChevronLeft size={16} className={`text-theme-muted ${isRTL ? '' : 'rotate-180'}`} />
              </button>

              <button onClick={() => setShowLegal('terms')} className="w-full flex items-center justify-between p-4 hover:bg-theme-border/20 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-500"><BookOpen size={16} /></div>
                  <span className="font-black text-xs text-theme-text">{t('str_286')}</span>
                </div>
                <ChevronLeft size={16} className={`text-theme-muted ${isRTL ? '' : 'rotate-180'}`} />
              </button>
            </PremiumCard>
          </div>

          {/* Logout Button */}
          <PremiumButton 
            onClick={handleLogout}
            variant="ghost"
            size="lg"
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-600 rounded-2xl h-12 text-xs font-black transition-all flex items-center justify-center gap-2 mt-2"
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
                {showLegal === 'privacy' && (t('str_288'))}
                {showLegal === 'terms' && (t('str_286'))}
                {showLegal === 'about' && (t('str_289'))}
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
                t('str_290')
              )}
              {showLegal === 'terms' && (
                t('str_291')
              )}
              {showLegal === 'about' && (
                t('str_292')
              )}
            </div>
            <PremiumButton 
              onClick={() => setShowLegal('none')} 
              variant="primary"
              size="md"
              className="w-full rounded-xl text-xs font-black h-10"
            >
              {t('str_293')}
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
                {t('str_294')}
              </h4>
              <button 
                onClick={() => setShowForgotModal(false)} 
                className="p-1 text-theme-muted hover:text-theme-text bg-theme-bg hover:bg-theme-border/60 rounded-full transition"
              >
                <XIcon size={16} />
              </button>
            </div>
            
            {forgotStep === 1 ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-[11px] text-theme-muted font-bold leading-relaxed">
                  {t('str_295')}
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
                  {t('str_296')}
                </PremiumButton>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 text-green-600 p-4.5 rounded-2xl text-center space-y-2">
                  <Check className="mx-auto text-green-500" size={24} />
                  <p className="text-xs font-black">{t('str_297')}</p>
                </div>
                <p className="text-[11px] text-theme-muted font-bold leading-relaxed text-center">
                  {t('str_298', { forgotEmail })}
                </p>
                <PremiumButton 
                  onClick={() => setShowForgotModal(false)} 
                  variant="primary"
                  size="md"
                  className="w-full rounded-xl text-xs font-black h-10"
                >
                  {t('str_299')}
                </PremiumButton>
              </div>
            )}
          </div>
        </div>
      )}

      {/* THEME SELECTION BOTTOM SHEET (Component 15) */}
      <PremiumBottomSheet 
        isOpen={showThemeModal} 
        onClose={() => setShowThemeModal(false)} 
        title={t('str_278')}
      >
        <div className="space-y-4 text-right">
          {/* Orange Theme Option */}
          <button
            onClick={() => { setTheme('orange'); setShowThemeModal(false); }}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-right theme-transition ${
              theme === 'orange' 
                ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/50' 
                : 'border-theme-border/60 bg-theme-card hover:bg-theme-border/30'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
                🍊
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-theme-text block">{t('str_279')}</span>
                <span className="text-[9px] text-theme-muted font-bold block mt-0.5">
                  {lang === 'ar' ? 'اللون البرتقالي الكلاسيكي اللامع' : 'Classic bright orange experience'}
                </span>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <span className="w-4 h-4 rounded-full bg-[#FF7A00] border border-white/20"></span>
              <span className="w-4 h-4 rounded-full bg-[#4F46E5] border border-white/20 -ml-2"></span>
            </div>
          </button>

          {/* Midnight Theme Option */}
          <button
            onClick={() => { setTheme('midnight'); setShowThemeModal(false); }}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-right theme-transition ${
              theme === 'midnight' 
                ? 'border-[#4F7BFF] bg-[#4F7BFF]/10 ring-1 ring-[#4F7BFF]/50' 
                : 'border-theme-border/60 bg-theme-card hover:bg-theme-border/30'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex items-center justify-center text-white shadow-md border border-[#293548] shrink-0">
                🌙
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-theme-text block">{t('str_280')}</span>
                <span className="text-[9px] text-theme-muted font-bold block mt-0.5">
                  {lang === 'ar' ? 'مظهر داكن كربوني مريح للعين' : 'Elegant deep charcoal blue-slate'}
                </span>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <span className="w-4 h-4 rounded-full bg-[#4F7BFF] border border-white/20"></span>
              <span className="w-4 h-4 rounded-full bg-[#7C3AED] border border-white/20 -ml-2"></span>
            </div>
          </button>

          {/* Purple Glass Theme Option */}
          <button
            onClick={() => { setTheme('purple-glass'); setShowThemeModal(false); }}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-right theme-transition ${
              theme === 'purple-glass' 
                ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500/50' 
                : 'border-theme-border/60 bg-theme-card hover:bg-theme-border/30'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20 shrink-0">
                🔮
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-theme-text block">{t('str_purple_glass')}</span>
                <span className="text-[9px] text-theme-muted font-bold block mt-0.5">
                  {lang === 'ar' ? 'مظهر أرجواني زجاجي ديناميكي' : 'Cosmic glassmorphic neon gradients'}
                </span>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <span className="w-4 h-4 rounded-full bg-[#A855F7] border border-white/20"></span>
              <span className="w-4 h-4 rounded-full bg-[#EC4899] border border-white/20 -ml-2"></span>
            </div>
          </button>
        </div>
      </PremiumBottomSheet>
    </div>
  );
};

const XIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default CustomerProfile;
