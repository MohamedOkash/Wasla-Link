import { useTranslation } from '../../hooks/useTranslation';
import React from 'react';
import { Check, X, Store as StoreIcon, AlertCircle, Trash2, Ban, RefreshCw } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useStores } from '../../hooks/useStores';

export const StoreApprovals: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useApp();
  const { setStores } = useStores();;
  const { stores } = useStores();;

  // Filter pending, approved, and suspended stores
  const pendingStores = stores.filter(s => s.status === 'pending');
  const activeStores = stores.filter(s => s.status === 'approved');
  const suspendedStores = stores.filter(s => s.status === 'suspended');

  const handleApproveStore = (id: string) => {
  const {} = useTranslation();

    setStores(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: 'approved' };
      }
      return s;
    }));
    showToast('تم اعتماد وقبول المتجر بنجاح');
  };

  const handleRejectStore = (id: string) => {
    if (confirm('هل أنت متأكد من رفض طلب هذا المتجر؟')) {
      setStores(prev => prev.map(s => {
        if (s.id === id) {
          return { ...s, status: 'rejected' };
        }
        return s;
      }));
      showToast('تم رفض طلب تسجيل المتجر');
    }
  };

  const handleToggleSuspendStore = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'suspended' ? 'approved' : 'suspended';
    setStores(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: nextStatus as any };
      }
      return s;
    }));
    showToast(nextStatus === 'suspended' ? 'تم تعليق وإيقاف المتجر مؤقتاً' : 'تم تنشيط وإعادة المتجر للخدمة');
  };

  const handleDeleteStore = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المتجر نهائياً من النظام؟ لا يمكن التراجع عن هذا الإجراء.')) {
      setStores(prev => prev.filter(s => s.id !== id));
      showToast('تم حذف المتجر بنجاح من النظام');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-theme-text">
      {/* Pending Approval Section */}
      <div>
        <h3 className="font-black text-theme-text text-sm mb-3">طلبات التسجيل المعلقة ({pendingStores.length})</h3>
        
        {pendingStores.length === 0 ? (
          <div className="bg-theme-card rounded-3xl p-6 border border-theme-border text-center text-theme-muted font-bold shadow-sm flex items-center justify-center gap-2 theme-transition">
            <AlertCircle size={18} />{t('str_658')}</div>
        ) : (
          <div className="space-y-3">
            {pendingStores.map(shop => (
              <div key={shop.id} className="bg-theme-card p-4 rounded-3xl border border-primary/20 shadow-sm flex items-center justify-between theme-transition">
                <div className="flex items-center gap-3">
                  <img src={shop.logoUrl} className="w-12 h-12 rounded-xl object-cover" alt={shop.name} />
                  <div>
                    <h4 className="font-black text-sm text-theme-text">{shop.name}</h4>
                    <p className="text-[10px] text-primary font-bold">{t('str_585')}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleApproveStore(shop.id)}
                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-xl shadow-md transition"
                  >
                    <Check size={16} strokeWidth={3} />
                  </button>
                  <button 
                    onClick={() => handleRejectStore(shop.id)}
                    className="bg-red-500/10 text-red-500 border border-red-500/20 p-2 rounded-xl hover:bg-red-500/20 transition"
                  >
                    <X size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Active Stores List */}
      <div>
        <h3 className="font-black text-theme-text text-sm mb-3">المتاجر المعتمدة النشطة ({activeStores.length})</h3>
        <div className="bg-theme-card rounded-3xl border border-theme-border shadow-sm divide-y divide-theme-border/60 overflow-hidden theme-transition">
          {activeStores.map(shop => (
            <div key={shop.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={shop.logoUrl} className="w-10 h-10 rounded-lg object-cover" alt={shop.name} />
                <div>
                  <h4 className="font-black text-xs text-theme-text">{shop.name}</h4>
                  <p className="text-[9px] text-theme-muted font-bold">التقييم: {shop.rating} • رسوم التوصيل: {shop.fee} ج.م</p>
                </div>
              </div>
              
              <div className="flex gap-1.5 items-center">
                <button
                  onClick={() => handleToggleSuspendStore(shop.id, shop.status)}
                  className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 hover:bg-amber-500/20 transition"
                  title={t('str_661')}
                >
                  <Ban size={12} />
                </button>
                <button
                  onClick={() => handleDeleteStore(shop.id)}
                  className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 hover:bg-red-500/20 transition"
                  title={t('str_662')}
                >
                  <Trash2 size={12} />
                </button>
                <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-lg border border-green-500/20 mr-2">{t('str_659')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suspended Stores List */}
      {suspendedStores.length > 0 && (
        <div>
          <h3 className="font-black text-red-500 text-sm mb-3">المتاجر الموقوفة مؤقتاً ({suspendedStores.length})</h3>
          <div className="bg-theme-card rounded-3xl border border-red-500/20 shadow-sm divide-y divide-theme-border/60 overflow-hidden theme-transition">
            {suspendedStores.map(shop => (
              <div key={shop.id} className="p-4 flex items-center justify-between bg-red-500/5">
                <div className="flex items-center gap-3">
                  <img src={shop.logoUrl} className="w-10 h-10 rounded-lg object-cover grayscale" alt={shop.name} />
                  <div>
                    <h4 className="font-black text-xs text-theme-muted line-through">{shop.name}</h4>
                    <p className="text-[9px] text-theme-muted font-bold">{t('str_660')}</p>
                  </div>
                </div>
                
                <div className="flex gap-1.5 items-center">
                  <button
                    onClick={() => handleToggleSuspendStore(shop.id, shop.status)}
                    className="p-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 hover:bg-green-500/20 transition flex items-center gap-1 text-[10px] font-black"
                    title={t('str_555')}
                  >
                    <RefreshCw size={10} />{t('str_556')}</button>
                  <button
                    onClick={() => handleDeleteStore(shop.id)}
                    className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 hover:bg-red-500/20 transition"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreApprovals;
