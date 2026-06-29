import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { Tag, Send, Calendar, BarChart3, AlertCircle, Play, Eye, Users, FileText, CheckCircle, Clock, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { mediaService } from '../../services/media.service';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

export interface Campaign {
  id: string;
  storeId?: string;
  title: string;
  message: string;
  bannerUrl?: string;
  targetType: 'all' | 'store' | 'category';
  targetCategory?: string;
  startDate: string;
  endDate: string;
  scheduleTime: string;
  status: 'Draft' | 'Scheduled' | 'Running' | 'Finished';
  analytics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
  createdAt?: any;
}

export const VendorCampaigns: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL, showToast, triggerOfferBroadcast, currentUser } = useApp();

  const [campaignsList, setCampaignsList] = useState<Campaign[]>([]);

  useEffect(() => {
    if (!currentUser?.storeId) return;
    const q = query(collection(db, 'campaigns'), where('storeId', '==', currentUser.storeId));
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Campaign));
      list.sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime());
      setCampaignsList(list);
    });
    return () => unsub();
  }, [currentUser]);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [banner, setBanner] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'store' | 'category'>('all');
  const [targetCategory, setTargetCategory] = useState('ألبان وأجبان');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [status, setStatus] = useState<Campaign['status']>('Draft');
  
  const [uploading, setUploading] = useState(false);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true);
      try {
        const compressed = await mediaService.uploadImage(e.target.files[0]);
        setBanner(compressed);
        showToast(t('str_709'));
      } catch (err: any) {
        alert(err.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      alert(t('str_710'));
      return;
    }

    try {
      const newCamp = {
        storeId: currentUser?.storeId || '',
        title,
        message,
        bannerUrl: banner || null,
        targetType,
        targetCategory: targetType === 'category' ? targetCategory : null,
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0],
        scheduleTime: scheduleTime || '12:00',
        status,
        // [MOCKED_FOR_DEVELOPMENT]: Analytics should be fetched from a real tracking service
        analytics: status === 'Running' 
          ? { sent: 120, delivered: 118, opened: 54, clicked: 18 }
          : { sent: 0, delivered: 0, opened: 0, clicked: 0 },
        createdAt: serverTimestamp()
      };

      await import('../../services/vendor/service').then(m => m.vendorService.createCampaign(newCamp));
      showToast(t('str_711'));
      
      if (status === 'Running') {
        triggerOfferBroadcast(currentUser?.storeId || '', message);
      }

      setShowAddForm(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      showToast('Error creating campaign');
    }
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setBanner('');
    setTargetType('all');
    setStartDate('');
    setEndDate('');
    setScheduleTime('');
    setStatus('Draft');
  };

  const triggerRunCampaign = async (id: string) => {
    const c = campaignsList.find(camp => camp.id === id);
    if (!c) return;
    
    try {
      await import('../../services/vendor/service').then(m => m.vendorService.updateCampaign(id, {
        status: 'Running',
        analytics: { sent: 160, delivered: 155, opened: 80, clicked: 35 }
      }));
      triggerOfferBroadcast(currentUser?.storeId || '', c.message);
      showToast(t('str_712'));
    } catch (err) {
      console.error(err);
      showToast('Error running campaign');
    }
  };

  const getStatusBadgeColor = (status: Campaign['status']) => {
    switch (status) {
      case 'Running': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Scheduled': return 'bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse';
      case 'Finished': return 'bg-theme-bg text-theme-muted border-theme-border';
      default: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
  };

  const getStatusLabel = (status: Campaign['status']) => {
    switch (status) {
      case 'Running': return t('str_713');
      case 'Scheduled': return t('str_714');
      case 'Finished': return t('str_715');
      default: return t('str_716');
    }
  };

  return (
    <div className="space-y-6 text-theme-text">
      {/* Action Header */}
      <div className="flex justify-between items-center">
        <h3 className="font-black text-theme-text text-sm flex items-center gap-2">
          <Tag size={16} className="text-primary" />
          {t('str_717')}
        </h3>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-primary hover:bg-primary-hover text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
        >
          <Send size={14} /> {t('str_718')}
        </button>
      </div>

      {/* Campaigns Listing */}
      <div className="space-y-4">
        {campaignsList.map(camp => (
          <div key={camp.id} className="bg-theme-card border border-theme-border rounded-[28px] p-5 space-y-4 shadow-sm theme-transition">
            <div className="flex justify-between items-start border-b border-theme-border/60 pb-3">
              <div>
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border inline-block ${getStatusBadgeColor(camp.status)}`}>
                  {getStatusLabel(camp.status)}
                </span>
                <h4 className="font-black text-xs text-theme-text mt-1.5">{camp.title}</h4>
                <p className="text-[9px] text-theme-muted font-bold mt-0.5">
                  {isRTL ? `الهدف: ${camp.targetType === 'all' ? 'جميع المتابعين' : camp.targetType === 'category' ? `متابعي تصنيف ${camp.targetCategory}` : 'متابعي المتجر'}` : `Target: ${camp.targetType}`}
                </p>
              </div>
              {camp.status === 'Scheduled' && (
                <button
                  onClick={() => triggerRunCampaign(camp.id)}
                  className="bg-primary text-white text-[9px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1 shadow hover:bg-primary-hover transition"
                >
                  <Play size={10} fill="white" /> {t('str_719')}
                </button>
              )}
            </div>

            {/* Campaign details */}
            <p className="text-theme-muted text-[11px] font-bold leading-relaxed">{camp.message}</p>
            
            {camp.bannerUrl && (
              <img src={camp.bannerUrl} className="w-full h-32 object-cover rounded-xl bg-theme-bg border border-theme-border" alt="Campaign Banner" />
            )}

            {/* Scheduling Info */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-bold text-theme-muted border-t border-b border-theme-border/50 py-2">
              <span className="flex items-center gap-1"><Calendar size={11} /> {t('str_720')}</span>
              <span className="flex items-center gap-1"><Calendar size={11} /> {t('str_721')}</span>
              <span className="flex items-center gap-1"><Clock size={11} /> {t('str_722')}</span>
            </div>

            {/* Analytics Dashboard Grid */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {[
                { label: t('str_723'), val: camp.analytics.sent },
                { label: t('str_724'), val: camp.analytics.delivered },
                { label: t('str_725'), val: camp.analytics.opened },
                { label: t('str_726'), val: camp.analytics.clicked }
              ].map((an, i) => (
                <div key={i} className="bg-theme-bg/60 p-2.5 rounded-xl border border-theme-border/40">
                  <span className="text-[8px] text-theme-muted block font-bold">{an.label}</span>
                  <span className="font-black text-theme-text block mt-1">{an.val}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Campaign Modal overlay */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-fade-in">
          <form 
            onSubmit={handleCreateCampaign}
            className="bg-theme-card border border-theme-border rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto no-scrollbar theme-transition"
          >
            <div className="flex justify-between items-center pb-2 border-b border-theme-border">
              <h4 className="font-black text-theme-text text-sm">{t('str_727')}</h4>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-theme-muted hover:text-theme-text"><X size={20} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_728')}</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" 
                  placeholder={t('str_729')} 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_730')}</label>
                <textarea 
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                  className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text h-20 resize-none" 
                  placeholder={t('str_731')}
                />
              </div>

              {/* Banner upload slot */}
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_732')}</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleBannerUpload} 
                    className="hidden" 
                    id="camp-banner-input" 
                  />
                  <label 
                    htmlFor="camp-banner-input"
                    className="cursor-pointer bg-theme-bg hover:bg-theme-border/60 text-theme-text font-black px-4 py-2.5 rounded-xl border border-theme-border text-[10px] transition"
                  >
                    {uploading ? (t('str_733')) : (t('str_734'))}
                  </label>
                  {banner && (
                    <img src={banner} className="w-10 h-10 rounded-lg object-cover bg-theme-bg border border-theme-border" alt="Preview Banner" />
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_735')}</label>
                <select 
                  value={targetType} 
                  onChange={e => setTargetType(e.target.value as any)}
                  className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text"
                >
                  <option value="all">{t('str_736')}</option>
                  <option value="category">{t('str_737')}</option>
                </select>
              </div>

              {targetType === 'category' && (
                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_738')}</label>
                  <select 
                    value={targetCategory} 
                    onChange={e => setTargetCategory(e.target.value)}
                    className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text"
                  >
                    {['ألبان وأجبان', 'مشروبات', 'سناكس وشيبسي', 'أرز ومكرونة', 'زيوت وسمن', 'مجمدات', 'منظفات'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_739')}</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
                    className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-[10px] font-bold outline-none focus:border-primary text-theme-text" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_740')}</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)} 
                    className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-[10px] font-bold outline-none focus:border-primary text-theme-text" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_741')}</label>
                <input 
                  type="time" 
                  value={scheduleTime} 
                  onChange={e => setScheduleTime(e.target.value)} 
                  className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_742')}</label>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text"
                >
                  <option value="Draft">{t('str_716')}</option>
                  <option value="Scheduled">{t('str_714')}</option>
                  <option value="Running">{t('str_743')}</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-theme-border">
              <button 
                type="submit" 
                className="flex-1 bg-primary hover:bg-primary-hover text-white font-black py-3.5 rounded-2xl text-xs shadow-md transition"
              >
                {t('str_744')}
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)} 
                className="bg-theme-bg hover:bg-theme-border text-theme-text font-black px-5 py-3.5 rounded-2xl text-xs transition"
              >
                {t('str_56')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default VendorCampaigns;
