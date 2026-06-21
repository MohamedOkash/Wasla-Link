import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Shield, Key, AlertTriangle } from 'lucide-react';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumInput } from '../../components/premium/PremiumInput';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export const SecurityCenter = () => {
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
      showToast(lang === 'ar' ? 'يرجى إدخال كلمة المرور الحالية والجديدة' : 'Please enter current and new passwords');
      return;
    }

    if (newPassword.length < 8) {
      showToast(lang === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      showToast(lang === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      console.error("Password update error:", err);
      let errMsg = lang === 'ar' ? 'فشل تغيير كلمة المرور' : 'Failed to update password';
      if (err.code === 'auth/invalid-credential') {
        errMsg = lang === 'ar' ? 'كلمة المرور الحالية غير صحيحة' : 'Current password is incorrect';
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
            {lang === 'ar' ? 'مركز الأمان' : 'Security Center'}
          </h2>
          <p className="text-xs text-theme-muted font-bold mt-1">
            {lang === 'ar' ? 'إدارة كلمة المرور وإعدادات الأمان الخاصة بحساب الإدارة' : 'Manage your admin account security and password'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PremiumCard className="p-6">
          <h3 className="text-lg font-black mb-4 flex items-center gap-2">
            <Key size={18} className="text-primary" />
            {lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
          </h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <PremiumInput
              type="password"
              placeholder={lang === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
            />
            <PremiumInput
              type="password"
              placeholder={lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
            <PremiumButton type="submit" isLoading={loading} className="w-full">
              {lang === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'}
            </PremiumButton>
          </form>
        </PremiumCard>

        <PremiumCard className="p-6 bg-theme-card/50 border border-yellow-500/30">
          <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-yellow-500">
            <AlertTriangle size={18} />
            {lang === 'ar' ? 'إرشادات الأمان' : 'Security Guidelines'}
          </h3>
          <ul className="list-disc list-inside space-y-2 text-sm font-bold text-theme-muted">
            <li>{lang === 'ar' ? 'استخدم كلمة مرور قوية تحتوي على أحرف وأرقام' : 'Use a strong password with letters and numbers'}</li>
            <li>{lang === 'ar' ? 'لا تشارك بيانات حساب الإدارة مع أي شخص' : 'Never share admin account details'}</li>
            <li>{lang === 'ar' ? 'تم تأمين قاعدة البيانات باستخدام Role-Based Access' : 'Database is secured with Role-Based Access'}</li>
            <li>{lang === 'ar' ? 'الجلسة الحالية:' : 'Current Session:'} {user?.email}</li>
          </ul>
        </PremiumCard>
      </div>
    </div>
  );
};
