import { useTranslation } from '../../hooks/useTranslation';
import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Shield, Key, AlertTriangle } from 'lucide-react';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumInput } from '../../components/premium/PremiumInput';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export const SecurityCenter = () => {
  const {} = useTranslation();

  const { lang, showToast } = useApp();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    if (!currentPassword || !newPassword) {
      showToast(t('str_646'));
      return;
    }

    if (newPassword.length < 8) {
      showToast(t('str_647'));
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      showToast(t('str_648'));
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      console.error("Password update error:", err);
      let errMsg = t('str_649');
      if (err.code === 'auth/invalid-credential') {
        errMsg = t('str_224');
      }
      showToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-3 rounded-2xl shadow-lg shadow-indigo-500/30">
          <Shield size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-theme-text">
            {t('str_358')}
          </h2>
          <p className="text-xs text-theme-muted font-bold mt-1">
            {t('str_650')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PremiumCard className="p-6">
          <h3 className="text-lg font-black mb-4 flex items-center gap-2">
            <Key size={18} className="text-primary" />
            {t('str_651')}
          </h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <PremiumInput
              type="password"
              placeholder={t('str_247')}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
            />
            <PremiumInput
              type="password"
              placeholder={t('str_248')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
            <PremiumButton type="submit" isLoading={loading} className="w-full">
              {t('str_652')}
            </PremiumButton>
          </form>
        </PremiumCard>

        <PremiumCard className="p-6 bg-theme-card/50 border border-yellow-500/30">
          <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-yellow-500">
            <AlertTriangle size={18} />
            {t('str_653')}
          </h3>
          <ul className="list-disc list-inside space-y-2 text-sm font-bold text-theme-muted">
            <li>{t('str_654')}</li>
            <li>{t('str_655')}</li>
            <li>{t('str_656')}</li>
            <li>{t('str_657')} {user?.email}</li>
          </ul>
        </PremiumCard>
      </div>
    </div>
  );
};
