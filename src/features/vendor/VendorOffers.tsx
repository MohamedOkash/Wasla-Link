import { useTranslation } from '../../hooks/useTranslation';
import React, { useState } from 'react';
import { Tag, Save, X, Edit, Plus, Trash2, Upload, Image as ImageIcon, Loader2, Check } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { mediaService } from '../../services/media.service';
import { useStores } from '../../hooks/useStores';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { storeRepository } from "../../services/vendor/repository";

export const VendorOffers: React.FC = () => {
  const { t } = useTranslation();
  const { showToast, triggerOfferBroadcast, isRTL, currentUser } = useApp();
  const { stores } = useStores();
  const [editing, setEditing] = useState(false);
  const [promoText, setPromoText] = useState('');

  // Find store
  const store = stores.find(s => s.id === currentUser?.storeId);

  const [offerBanner, setOfferBanner] = useState(store?.offerBanner || '');
  const [mobileBanner, setMobileBanner] = useState(store?.offerMobileBanner || '');
  const [offerThumbnail, setOfferThumbnail] = useState(store?.offerThumbnail || '');
  const [offerGallery, setOfferGallery] = useState<string[]>(store?.offerGallery || []);
  const [uploading, setUploading] = useState({ banner: false, mobile: false, thumb: false, gallery: false });

  const handleUpload = async (file: File, key: 'banner' | 'mobile' | 'thumb' | 'gallery') => {
    setUploading(prev => ({ ...prev, [key]: true }));
    try {
      const url = await mediaService.uploadImage(file, 'offers');
      if (key === 'gallery') {
        setOfferGallery(prev => [...prev, url]);
      } else if (key === 'banner') {
        setOfferBanner(url);
      } else if (key === 'mobile') {
        setMobileBanner(url);
      } else if (key === 'thumb') {
        setOfferThumbnail(url);
      }
      showToast(t('str_824'));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await storeRepository.update(currentUser?.storeId || '', {
              promoBanner: promoText || null,
              offerBanner: offerBanner || null,
              offerMobileBanner: mobileBanner || null,
              offerThumbnail: offerThumbnail || null,
              offerGallery: offerGallery.length > 0 ? offerGallery : null
            });
      
      if (promoText.trim()) {
        triggerOfferBroadcast(currentUser?.storeId || '', promoText.trim());
      }
      
      showToast(t('str_825'));
      setEditing(false);
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ', 'error');
    }
  };

  const handleRemovePromo = async () => {
    if (confirm(t('str_826'))) {
      try {
        await storeRepository.update(currentUser?.storeId || '', {
          promoBanner: null,
          offerBanner: null,
          offerMobileBanner: null,
          offerThumbnail: null,
          offerGallery: null
        });

        setPromoText('');
        setOfferBanner('');
        setMobileBanner('');
        setOfferThumbnail('');
        setOfferGallery([]);
        showToast(t('str_827'));
      } catch (err) {
        console.error(err);
        showToast('حدث خطأ', 'error');
      }
    }
  };

  return (
    <div className="bg-theme-card rounded-[30px] border border-theme-border p-6 shadow-sm space-y-6 animate-fade-in theme-transition">
      <div className="flex justify-between items-center pb-3 border-b border-theme-border/60">
        <h3 className="font-black text-theme-text text-sm flex items-center gap-2">
          <Tag size={18} className="text-primary" />
          {t('str_828')}
        </h3>
      </div>

      {store?.promoBanner || store?.offerBanner ? (
        <div className="bg-primary/10 border border-primary/20 p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.08),transparent)]"></div>
          <div>
            <span className="text-[10px] font-black text-primary bg-primary/20 px-2 py-0.5 rounded-lg">{t('str_829')}</span>
            <p className="text-base font-black text-theme-text mt-2 leading-relaxed">
              {store.promoBanner || (t('str_830'))}
            </p>
            {store.offerBanner && (
              <div className="mt-3 rounded-xl overflow-hidden border border-theme-border/60 max-h-36">
                <img src={store.offerBanner} className="w-full h-full object-cover" alt="Campaign Banner" />
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2 relative z-10">
            <button 
              onClick={() => { 
                setPromoText(store.promoBanner || ''); 
                setOfferBanner(store.offerBanner || '');
                setMobileBanner(store.offerMobileBanner || '');
                setOfferThumbnail(store.offerThumbnail || '');
                setOfferGallery(store.offerGallery || []);
                setEditing(true); 
              }}
              className="bg-theme-card border border-theme-border-hover text-theme-text font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 hover:bg-theme-bg transition"
            >
              <Edit size={12} /> {t('str_831')}
            </button>
            <button 
              onClick={handleRemovePromo}
              className="bg-red-500/10 border border-red-500/20 text-red-500 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 hover:bg-red-500/25 transition"
            >
              <Trash2 size={12} /> {t('str_832')}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-theme-bg rounded-2xl border-2 border-dashed border-theme-border-hover space-y-4">
          <Tag size={36} className="text-theme-muted mx-auto" />
          <div>
            <h4 className="font-black text-theme-text text-sm">{t('str_833')}</h4>
            <p className="text-[11px] text-theme-muted font-bold mt-1 max-w-[80%] mx-auto">
              {t('str_834')}
            </p>
          </div>
          <button 
            onClick={() => { 
              setPromoText(''); 
              setOfferBanner('');
              setMobileBanner('');
              setOfferThumbnail('');
              setOfferGallery([]);
              setEditing(true); 
            }}
            className="bg-primary hover:bg-primary-hover text-white font-black px-6 py-2.5 rounded-xl text-xs transition"
          >
            {t('str_835')}
          </button>
        </div>
      )}

      {/* Edit Form Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-fade-in">
          <form 
            onSubmit={handleSavePromo}
            className="bg-theme-card border border-theme-border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl animate-slide-up max-h-[85vh] overflow-y-auto no-scrollbar theme-transition"
          >
            <div className="flex justify-between items-center pb-2 border-b border-theme-border">
              <h4 className="font-black text-theme-text text-sm">{t('str_836')}</h4>
              <button 
                type="button" 
                onClick={() => setEditing(false)} 
                className="text-theme-muted hover:text-theme-text"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1.5">{t('str_837')}</label>
                <textarea 
                  value={promoText} 
                  onChange={(e) => setPromoText(e.target.value)} 
                  className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs outline-none focus:border-primary font-bold h-16 resize-none leading-relaxed text-theme-text"
                  placeholder={t('str_838')}
                  required
                />
              </div>

              {/* Large Desktop Banner */}
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_839')}</label>
                <div className="relative border border-theme-border rounded-xl h-20 flex flex-col items-center justify-center overflow-hidden bg-theme-bg cursor-pointer">
                  {offerBanner ? (
                    <>
                      <img src={offerBanner} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-white text-[8px] font-bold opacity-0 hover:opacity-100 transition">
                        {t('str_840')}
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-2">
                      <Upload size={14} className="mx-auto text-theme-muted mb-0.5" />
                      <span className="text-[9px] font-bold text-theme-text">{t('str_841')}</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'banner')} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                </div>
                {uploading.banner && <p className="text-[8px] text-primary animate-pulse font-bold mt-0.5">{t('str_842')}</p>}
              </div>

              {/* Mobile Banner */}
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_843')}</label>
                <div className="relative border border-theme-border rounded-xl h-20 flex flex-col items-center justify-center overflow-hidden bg-theme-bg cursor-pointer">
                  {mobileBanner ? (
                    <>
                      <img src={mobileBanner} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-white text-[8px] font-bold opacity-0 hover:opacity-100 transition">
                        {t('str_844')}
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-2">
                      <Upload size={14} className="mx-auto text-theme-muted mb-0.5" />
                      <span className="text-[9px] font-bold text-theme-text">{t('str_845')}</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'mobile')} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                </div>
                {uploading.mobile && <p className="text-[8px] text-primary animate-pulse font-bold mt-0.5">{t('str_846')}</p>}
              </div>

              {/* Offer Thumbnail & Gallery */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_847')}</label>
                  <div className="relative border border-theme-border rounded-xl h-16 flex flex-col items-center justify-center overflow-hidden bg-theme-bg cursor-pointer">
                    {offerThumbnail ? (
                      <>
                        <img src={offerThumbnail} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-white text-[8px] font-bold opacity-0 hover:opacity-100 transition">
                          {t('str_848')}
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-1">
                        <Upload size={12} className="mx-auto text-theme-muted mb-0.5" />
                        <span className="text-[8px] font-bold text-theme-text">{t('str_849')}</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'thumb')} 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>
                  {uploading.thumb && <p className="text-[8px] text-primary animate-pulse font-bold mt-0.5">{t('str_733')}</p>}
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_850')}</label>
                  <div className="relative border border-theme-border rounded-xl h-16 flex flex-col items-center justify-center overflow-hidden bg-theme-bg cursor-pointer">
                    <div className="text-center p-1">
                      <Plus size={12} className="mx-auto text-theme-muted mb-0.5" />
                      <span className="text-[8px] font-bold text-theme-text">
                        {t('str_851')}
                      </span>
                    </div>
                    <input 
                      type="file" 
                      multiple
                      accept="image/*" 
                      onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'gallery')} 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>
                  {uploading.gallery && <p className="text-[8px] text-primary animate-pulse font-bold mt-0.5">{t('str_733')}</p>}
                </div>
              </div>

              {/* Gallery List Preview */}
              {offerGallery.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {offerGallery.map((url, idx) => (
                    <div key={idx} className="relative w-10 h-10 rounded-lg overflow-hidden border border-theme-border flex-shrink-0">
                      <img src={url} className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setOfferGallery(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-bl"
                      >
                        <X size={8} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              type="submit"
              className="w-full bg-primary hover:bg-primary-hover text-white font-black py-3.5 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Save size={16} /> {t('str_852')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default VendorOffers;
