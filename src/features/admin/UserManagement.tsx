import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, Key, Ban, ShieldAlert, Check, Trash2, ShieldCheck, UserX } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { userRepository } from "../../services/shared/user.repository";

export const UserManagement: React.FC = () => {
  const { t } = useTranslation();
  const { showToast, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'customer' | 'vendor' | 'admin'>('customer');

  const [usersList, setUsersList] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, snap => {
      setUsersList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error('Users listener error:', err));
    return () => unsub();
  }, [currentUser]);

  const filteredUsers = usersList.filter(u => (u.role || 'customer') === activeTab);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await userRepository.update(id, { status: nextStatus });
      showToast(nextStatus === 'suspended' ? 'تم حظر وإيقاف حساب العضو' : 'تم إلغاء حظر العضو وتنشيط حسابه', 'success');
    } catch (err) {
      console.error(err);
      showToast('خطأ أثناء تحديث الحالة', 'error');
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await userRepository.update(id, { role: newRole });
      showToast(`تم تغيير دور العضو إلى ${newRole} بنجاح`, 'success');
    } catch (err) {
      console.error(err);
      showToast('خطأ أثناء تغيير الدور', 'error');
    }
  };

  const handleResetPassword = async (email: string) => {
    if (!email) return;
    if (confirm(`هل تريد إرسال رابط إعادة تعيين كلمة المرور إلى ${email}؟`)) {
      try {
        await sendPasswordResetEmail(auth, email);
        showToast('تم إرسال رابط إعادة التعيين إلى بريد العضو بنجاح', 'success');
      } catch (err) {
        console.error(err);
        showToast('حدث خطأ أثناء إرسال الرابط', 'error');
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف بيانات هذا العضو نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
      try {
        await userRepository.delete(id);
        showToast('تم حذف بيانات العضو بنجاح', 'success');
      } catch (err) {
        console.error(err);
        showToast('حدث خطأ أثناء الحذف', 'error');
      }
    }
  };

  return (
    <div className="space-y-5 text-theme-text">
      {/* Role Filter Tabs */}
      <div className="bg-theme-card p-1 rounded-2xl border border-theme-border shadow-sm flex gap-1 theme-transition">
        {[
          { id: 'customer', label: 'العملاء' },
          { id: 'vendor', label: 'البائعين' },
          { id: 'admin', label: 'المدراء' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition ${
              activeTab === tab.id 
                ? 'bg-primary text-white shadow-sm font-black' 
                : 'text-theme-muted hover:text-theme-text'
            }`}
          >
            {tab.label} ({usersList.filter(u => u.role === tab.id).length})
          </button>
        ))}
      </div>

      {/* Users List Panel */}
      <div className="bg-theme-card rounded-[30px] border border-theme-border p-5 shadow-sm space-y-4 animate-fade-in theme-transition">
        <h3 className="font-black text-theme-text text-sm flex items-center gap-2 border-b border-theme-border/60 pb-2.5">
          <Users size={18} className="text-primary" />{t('str_673')}</h3>
        
        {filteredUsers.length === 0 ? (
          <p className="text-xs text-theme-muted text-center py-6 font-bold">{t('str_674')}</p>
        ) : (
          <div className="divide-y divide-theme-border/60">
            {filteredUsers.map(user => (
              <div key={user.id} className="py-3.5 flex justify-between items-center">
                <div>
                  <h4 className={`font-black text-xs ${user.status === 'suspended' ? 'text-theme-muted line-through' : 'text-theme-text'}`}>
                    {user.name}
                  </h4>
                  <p className="text-[9px] text-theme-muted font-bold mt-0.5">{user.email} • انضم: {user.createdAt}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {user.status === 'suspended' && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-lg border border-red-500/25 bg-red-500/10 text-red-500 animate-pulse">{t('str_675')}</span>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-1 items-center">
                    <select
                      value={user.role || 'customer'}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="bg-theme-bg border border-theme-border/50 rounded-lg text-[9px] font-bold px-1.5 py-1"
                    >
                      <option value="customer">{t('str_44')}</option>
                      <option value="vendor">{t('str_676')}</option>
                      <option value="driver">{t('str_677')}</option>
                      <option value="admin">{t('str_678')}</option>
                    </select>

                    <button
                      onClick={() => handleResetPassword(user.email)}
                      className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-500 hover:bg-blue-500/20 transition"
                      title={t('str_679')}
                    >
                      <Key size={12} />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(user.id, user.status)}
                      className={`p-1.5 rounded-lg border transition ${
                        user.status === 'active'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20'
                          : 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20'
                      }`}
                      title={user.status === 'active' ? 'حظر الحساب' : 'إلغاء الحظر'}
                    >
                      <UserX size={12} />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 hover:bg-red-500/20 transition"
                      title={t('str_680')}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
