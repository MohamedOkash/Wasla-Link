import React, { useState } from 'react';
import { Tag, Edit, Plus, Trash2, X, Check } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export const BannerManagement: React.FC = () => {
  const { banners, setBanners, showToast } = useApp();

  // Modals
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);

  // Form states
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [subAr, setSubAr] = useState('');
  const [subEn, setSubEn] = useState('');
  const [imgUrl, setImgUrl] = useState('');

  const handleOpenAdd = () => {
    setTitleAr('');
    setTitleEn('');
    setSubAr('');
    setSubEn('');
    setImgUrl('https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=800&q=80');
    setShowAddForm(true);
  };

  const handleOpenEdit = (banner: any) => {
    setEditingBanner(banner);
    setTitleAr(banner.title.ar || banner.title);
    setTitleEn(banner.title.en || banner.title);
    setSubAr(banner.subtitle.ar || banner.subtitle);
    setSubEn(banner.subtitle.en || banner.subtitle);
    setImgUrl(banner.imgUrl);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleAr || !titleEn || !imgUrl) {
      alert('الرجاء إدخال العنوان باللغتين ورابط الصورة');
      return;
    }

    const newBanner = {
      id: Date.now(),
      title: { ar: titleAr, en: titleEn },
      subtitle: { ar: subAr, en: subEn },
      imgUrl
    };

    setBanners(prev => [...prev, newBanner]);
    showToast('تمت إضافة البانر الإعلاني الجديد بنجاح');
    setShowAddForm(false);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    setBanners(prev => prev.map(b => {
      if (b.id === editingBanner.id) {
        return {
          ...b,
          title: { ar: titleAr, en: titleEn },
          subtitle: { ar: subAr, en: subEn },
          imgUrl
        };
      }
      return b;
    }));

    showToast('تم تحديث البانر الإعلاني بنجاح');
    setEditingBanner(null);
  };

  const handleDeleteBanner = (id: number) => {
    if (confirm('هل ترغب في حذف هذا البانر الإعلاني نهائياً من الصفحة الرئيسية؟')) {
      setBanners(prev => prev.filter(b => b.id !== id));
      showToast('تم حذف البانر بنجاح');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in text-theme-text">
      <div className="flex justify-between items-center">
        <h3 className="font-black text-theme-text text-sm">البانرات الإعلانية النشطة ({banners.length})</h3>
        <button 
          onClick={handleOpenAdd}
          className="bg-primary hover:bg-primary-hover text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus size={14} strokeWidth={3} /> إضافة إعلان جديد
        </button>
      </div>

      {/* Banners List */}
      <div className="space-y-4">
        {banners.map(banner => (
          <div key={banner.id} className="bg-theme-card rounded-3xl overflow-hidden border border-theme-border shadow-sm relative theme-transition">
            <div className="h-32 w-full bg-theme-bg">
              <img src={banner.imgUrl} className="w-full h-full object-cover" alt="Banner Preview" />
            </div>
            <div className="p-4 flex justify-between items-center bg-theme-card">
              <div>
                <h4 className="font-black text-xs text-theme-text">{typeof banner.title === 'object' ? (banner.title.ar || banner.title.en) : banner.title}</h4>
                <p className="text-[9px] text-theme-muted font-bold mt-0.5">{typeof banner.subtitle === 'object' ? (banner.subtitle.ar || banner.subtitle.en) : banner.subtitle}</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleOpenEdit(banner)}
                  className="bg-theme-bg border border-theme-border text-theme-muted font-bold p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition"
                >
                  <Edit size={12} />
                </button>
                <button 
                  onClick={() => handleDeleteBanner(banner.id)}
                  className="bg-red-500/10 border border-red-500/20 text-red-500 font-bold p-2 rounded-lg hover:bg-red-500/25 transition"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Banner Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-fade-in">
          <form 
            onSubmit={handleAdd}
            className="bg-theme-card border border-theme-border rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-slide-up theme-transition"
          >
            <div className="flex justify-between items-center pb-2 border-b border-theme-border">
              <h4 className="font-black text-theme-text text-sm">إضافة إعلان جديد</h4>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-theme-muted hover:text-theme-text"><X size={20} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">العنوان بالعربية</label>
                <input type="text" value={titleAr} onChange={e=>setTitleAr(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="مثال: عروض مطاعم الصيف" />
              </div>
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">العنوان بالإنجليزية</label>
                <input type="text" value={titleEn} onChange={e=>setTitleEn(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="مثال: Summer Restaurant Offers" />
              </div>
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">العنوان الفرعي بالعربية</label>
                <input type="text" value={subAr} onChange={e=>setSubAr(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="مثال: خصم حتى 50%" />
              </div>
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">العنوان الفرعي بالإنجليزية</label>
                <input type="text" value={subEn} onChange={e=>setSubEn(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="مثال: Up to 50% Off" />
              </div>
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">رابط صورة البانر</label>
                <input type="text" value={imgUrl} onChange={e=>setImgUrl(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-mono outline-none focus:border-primary text-theme-text" />
              </div>
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-black py-3.5 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"><Check size={16} strokeWidth={3} /> تأكيد وحفظ الإعلان</button>
          </form>
        </div>
      )}

      {/* Edit Banner Form */}
      {editingBanner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-fade-in">
          <form 
            onSubmit={handleEdit}
            className="bg-theme-card border border-theme-border rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-slide-up theme-transition"
          >
            <div className="flex justify-between items-center pb-2 border-b border-theme-border">
              <h4 className="font-black text-theme-text text-sm">تعديل بيانات الإعلان</h4>
              <button type="button" onClick={() => setEditingBanner(null)} className="text-theme-muted hover:text-theme-text"><X size={20} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">العنوان بالعربية</label>
                <input type="text" value={titleAr} onChange={e=>setTitleAr(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" />
              </div>
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">العنوان بالإنجليزية</label>
                <input type="text" value={titleEn} onChange={e=>setTitleEn(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" />
              </div>
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">العنوان الفرعي بالعربية</label>
                <input type="text" value={subAr} onChange={e=>setSubAr(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" />
              </div>
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">العنوان الفرعي بالإنجليزية</label>
                <input type="text" value={subEn} onChange={e=>setSubEn(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" />
              </div>
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">رابط صورة البانر</label>
                <input type="text" value={imgUrl} onChange={e=>setImgUrl(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-mono outline-none focus:border-primary text-theme-text" />
              </div>
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-black py-3.5 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"><Check size={16} strokeWidth={3} /> حفظ التعديلات</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default BannerManagement;
