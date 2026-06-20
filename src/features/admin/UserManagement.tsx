import React, { useState } from 'react';
import { Users, Shield, UserCheck, Key, Ban, ShieldAlert, Check, Trash2, ShieldCheck, UserX } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export const UserManagement: React.FC = () => {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'customer' | 'vendor' | 'admin'>('customer');

  const [usersList, setUsersList] = useState([
    { id: 'u1', name: 'أحمد محمود', email: 'ahmed@demo.com', role: 'customer', status: 'active', createdAt: '2026-06-10' },
    { id: 'u2', name: 'علي حسن', email: 'ali@demo.com', role: 'customer', status: 'active', createdAt: '2026-06-12' },
    { id: 'u3', name: 'محمد مصطفى (تاجر الخير)', email: 'alkhair@demo.com', role: 'vendor', status: 'active', createdAt: '2026-06-11' },
    { id: 'u4', name: 'عمر ياسين (حلويات الجمل)', email: 'elgamal@demo.com', role: 'vendor', status: 'active', createdAt: '2026-06-14' },
    { id: 'u5', name: 'مدير النظام الرئيس', email: 'admin@demo.com', role: 'admin', status: 'active', createdAt: '2026-06-01' },
    { id: 'u6', name: 'عادل عبدالرحمن (مساعد مشرف)', email: 'assistant@demo.com', role: 'admin', status: 'active', createdAt: '2026-06-15' }
  ]);

  const filteredUsers = usersList.filter(u => u.role === activeTab);

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setUsersList(prev => prev.map(u => {
      if (u.id === id) {
        return { ...u, status: nextStatus };
      }
      return u;
    }));
    showToast(nextStatus === 'suspended' ? 'تم حظر وإيقاف حساب العضو' : 'تم إلغاء حظر العضو وتنشيط حسابه');
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('هل أنت متأكد من حذف حساب هذا العضو نهائياً؟')) {
      setUsersList(prev => prev.filter(u => u.id !== id));
      showToast('تم حذف حساب العضو بنجاح');
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
          <Users size={18} className="text-primary" />
          إدارة مستخدمي المنصة
        </h3>
        
        {filteredUsers.length === 0 ? (
          <p className="text-xs text-theme-muted text-center py-6 font-bold">لا يوجد أعضاء مسجلين بهذا الدور</p>
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
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-lg border border-red-500/25 bg-red-500/10 text-red-500 animate-pulse">
                      محظور
                    </span>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-1">
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
                      title="حذف نهائي"
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
