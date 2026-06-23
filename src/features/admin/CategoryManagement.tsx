import { useTranslation } from '../../hooks/useTranslation';
import React, { useState } from 'react';
import { Plus, Trash2, Edit, X, Check, FolderOpen } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export const CategoryManagement: React.FC = () => {
  const { t } = useTranslation();
  const { categories, setCategories, showToast } = useApp();
  
  // Modals
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // Form states
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [catId, setCatId] = useState('');

  const handleOpenAdd = () => {
  const {} = useTranslation();

    setNameAr('');
    setNameEn('');
    setImgUrl('https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=300&q=80');
    setCatId('');
    setShowAddForm(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat);
    setNameAr(cat.name.ar);
    setNameEn(cat.name.en);
    setImgUrl(cat.imgUrl);
    setCatId(cat.id);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr || !nameEn || !catId) {
      alert('الرجاء تعبئة كافة الحقول المطلوبة');
      return;
    }

    // Check if ID already exists
    if (categories.some(c => c.id === catId)) {
      alert('معرف القسم موجود بالفعل، الرجاء اختيار معرف فريد');
      return;
    }

    const newCat = {
      id: catId.trim().toLowerCase(),
      name: { ar: nameAr, en: nameEn },
      imgUrl
    };

    setCategories(prev => [...prev, newCat]);
    showToast('تمت إضافة القسم الجديد بنجاح');
    setShowAddForm(false);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setCategories(prev => prev.map(c => {
      if (c.id === editingCategory.id) {
        return {
          ...c,
          name: { ar: nameAr, en: nameEn },
          imgUrl
        };
      }
      return c;
    }));

    showToast('تم تحديث بيانات القسم بنجاح');
    setEditingCategory(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟ قد يؤثر ذلك على المتاجر المرتبطة به.')) {
      setCategories(prev => prev.filter(c => c.id !== id));
      showToast('تم حذف القسم بنجاح');
    }
  };

  return (
    <div className="space-y-5 text-theme-text">
      {/* Header action bar */}
      <div className="flex justify-between items-center">
        <h3 className="font-black text-theme-text text-sm flex items-center gap-1.5">
          <FolderOpen size={18} className="text-primary" />
          إدارة أقسام المنصة ({categories.length})
        </h3>
        <button
          onClick={handleOpenAdd}
          className="bg-primary hover:bg-primary-hover text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus size={16} strokeWidth={3} />{t('str_464')}</button>
      </div>

      {/* Categories Grid List */}
      <div className="space-y-4">
        {categories.map(cat => (
          <div 
            key={cat.id}
            className="bg-theme-card rounded-3xl p-4 border border-theme-border shadow-sm flex items-center justify-between gap-4 theme-transition"
          >
            <div className="flex items-center gap-3">
              <img src={cat.imgUrl} className="w-12 h-12 rounded-xl object-cover border border-theme-border bg-theme-bg flex-shrink-0" alt={cat.name.ar} />
              <div>
                <h4 className="font-black text-sm text-theme-text">{cat.name.ar}</h4>
                <p className="text-[10px] text-theme-muted font-bold mt-0.5">{cat.name.en} • ID: {cat.id}</p>
              </div>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => handleOpenEdit(cat)}
                className="p-2 bg-theme-bg border border-theme-border rounded-xl text-theme-muted hover:text-primary hover:bg-primary/10 transition"
                title={t('str_513')}
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500/20 transition"
                title={t('str_514')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-fade-in">
          <form 
            onSubmit={handleAdd}
            className="bg-theme-card border border-theme-border rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-slide-up theme-transition"
          >
            <div className="flex justify-between items-center pb-2 border-b border-theme-border">
              <h4 className="font-black text-theme-text text-sm">{t('str_505')}</h4>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-theme-muted hover:text-theme-text"><X size={20} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_506')}</label>
                <input type="text" value={catId} onChange={e=>setCatId(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="مثال: pharmacy" />
              </div>
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_507')}</label>
                <input type="text" value={nameAr} onChange={e=>setNameAr(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="مثال: الصيدليات" />
              </div>
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_508')}</label>
                <input type="text" value={nameEn} onChange={e=>setNameEn(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="مثال: Pharmacies" />
              </div>
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_509')}</label>
                <input type="text" value={imgUrl} onChange={e=>setImgUrl(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-mono outline-none focus:border-primary text-theme-text" />
              </div>
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-black py-3.5 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"><Check size={16} strokeWidth={3} />{t('str_510')}</button>
          </form>
        </div>
      )}

      {/* Edit Form Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-fade-in">
          <form 
            onSubmit={handleEdit}
            className="bg-theme-card border border-theme-border rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-slide-up theme-transition"
          >
            <div className="flex justify-between items-center pb-2 border-b border-theme-border">
              <h4 className="font-black text-theme-text text-sm">{t('str_511')}</h4>
              <button type="button" onClick={() => setEditingCategory(null)} className="text-theme-muted hover:text-theme-text"><X size={20} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_512')}</label>
                <input type="text" disabled value={catId} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none text-theme-muted cursor-not-allowed" />
              </div>
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_507')}</label>
                <input type="text" value={nameAr} onChange={e=>setNameAr(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" />
              </div>
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_508')}</label>
                <input type="text" value={nameEn} onChange={e=>setNameEn(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" />
              </div>
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_509')}</label>
                <input type="text" value={imgUrl} onChange={e=>setImgUrl(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-mono outline-none focus:border-primary text-theme-text" />
              </div>
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-black py-3.5 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"><Check size={16} strokeWidth={3} />{t('str_413')}</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
