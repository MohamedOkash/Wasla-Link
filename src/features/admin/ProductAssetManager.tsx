import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, doc, getDocs, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { Product } from '../../types/product.types';
import { mediaService } from '../../services/media.service';
import { catalogSyncService } from '../../services/catalogSync.service';
import { assetRecoveryService } from '../../services/assetRecovery.service';
import { placeholderService } from '../../services/placeholder.service';
import { useApp } from '../../contexts/AppContext';
import { 
  Upload, Image as ImageIcon, Trash2, RefreshCw, AlertTriangle, 
  CheckCircle, Database, Sparkles, Plus, X, Layers, Search, 
  Activity, Check 
} from 'lucide-react';
import { tokens } from '../../design/tokens';

export const ProductAssetManager: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL, showToast } = useApp();
  const [templates, setTemplates] = useState<Product[]>([]);
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Upload states
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadType, setUploadingType] = useState<'primary' | 'gallery'>('primary');

  // Recovery scans
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const tempSnap = await getDocs(collection(db, 'productTemplates'));
      const tempData = tempSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setTemplates(tempData);

      const prodSnap = await getDocs(collection(db, 'products'));
      const prodData = prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setVendorProducts(prodData);
    } catch (err) {
      console.error(err);
      showToast(t('str_596'));
    } finally {
      setLoading(false);
    }
  };

  // Recompute Statistics
  const totalTemplates = templates.length;
  const templatesWithImages = templates.filter(t => t.primaryImage || t.imageUrl || t.imgUrl).length;
  const templatesMissingImages = totalTemplates - templatesWithImages;
  const galleryCoverage = totalTemplates > 0 
    ? Math.round((templates.filter(t => t.galleryImages && t.galleryImages.length > 0).length / totalTemplates) * 100)
    : 0;

  // Compute total images stored (roughly)
  let totalImagesCount = templatesWithImages;
  templates.forEach(t => {
    if (t.galleryImages) totalImagesCount += t.galleryImages.length;
  });
  // Estimate: Average webp image compressed is 120KB
  const storageUsageEstimateMb = parseFloat(((totalImagesCount * 120) / 1024).toFixed(1));

  // Single Template Actions
  const handleUploadClick = async (e: React.ChangeEvent<HTMLInputElement>, templateId: string, type: 'primary' | 'gallery') => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingId(templateId);
    setUploadingType(type);
    
    try {
      if (type === 'primary') {
        const file = e.target.files[0];
        const url = await mediaService.uploadProductImage(file, 'productTemplates');
        
        // Retrieve template gallery
        const temp = templates.find(t => t.id === templateId);
        const gallery = temp?.galleryImages || temp?.images || [];
        
        // Create asset version
        await mediaService.createAssetVersion(templateId, url, gallery, 'admin');
        showToast(t('str_597'));
      } else {
        const files = Array.from(e.target.files);
        const urls = await mediaService.uploadGalleryImages(files, 'productTemplates');
        
        const temp = templates.find(t => t.id === templateId);
        const primary = temp?.primaryImage || temp?.imageUrl || temp?.imgUrl || '';
        const currentGallery = temp?.galleryImages || temp?.images || [];
        const newGallery = [...currentGallery, ...urls];
        
        await mediaService.createAssetVersion(templateId, primary, newGallery, 'admin');
        showToast(t('str_598'));
      }
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingId(null);
    }
  };

  const handleRemoveAsset = async (templateId: string) => {
    if (!confirm(t('str_599'))) return;
    setLoading(true);
    try {
      await import('../../services/admin/service').then(m => m.adminService.updateTemplateAsset(templateId, {
        primaryImage: '',
        imageUrl: '',
        imgUrl: '',
        galleryImages: [],
        images: [],
        gallery: [],
        templateImageVersion: 0,
        assetVersion: 0,
        assetStatus: 'missing',
        lastAssetUpdate: new Date().toISOString()
      }));
      showToast(t('str_600'));
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Bulk Actions
  const handleBulkSync = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    let synced = 0;
    try {
      for (const id of selectedIds) {
        const count = await catalogSyncService.syncTemplateToProducts(id);
        synced += count;
      }
      showToast(t('str_601'));
      setSelectedIds([]);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(t('str_602'))) return;
    setLoading(true);
    try {
      for (const id of selectedIds) {
        await import('../../services/admin/service').then(m => m.adminService.updateTemplateAsset(id, {
          primaryImage: '',
          imageUrl: '',
          imgUrl: '',
          galleryImages: [],
          images: [],
          gallery: [],
          templateImageVersion: 0,
          assetVersion: 0,
          assetStatus: 'missing',
          lastAssetUpdate: new Date().toISOString()
        }));
      }
      showToast(t('str_603'));
      setSelectedIds([]);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRecover = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    let repaired = 0;
    try {
      for (const id of selectedIds) {
        await assetRecoveryService.repairAsset(id, true);
        repaired++;
      }
      showToast(t('str_604'));
      setSelectedIds([]);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
  const {} = useTranslation();

    if (e.target.checked) {
      setSelectedIds(filteredTemplates.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Run Recovery Scan
  const handleRunRecoveryScan = async () => {
    setScanning(true);
    try {
      const res = await assetRecoveryService.runRecoveryScan();
      showToast(isRTL 
        ? `اكتمل الفحص بنجاح. تم فحص ${res.totalScanned} وتصحيح ${res.totalRepaired} صورة مكسورة.` 
        : `Recovery scan complete. Scanned ${res.totalScanned}, repaired ${res.totalRepaired} assets.`
      );
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  const filteredTemplates = templates.filter(t => {
    // Search
    const nameMatch = (t.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                      (t.nameAr && t.nameAr.toLowerCase().includes((searchQuery || '').toLowerCase())) ||
                      (t.brand && t.brand.toLowerCase().includes((searchQuery || '').toLowerCase()));
    
    // Store type filter
    const typeMatch = filterType === 'all' || t.storeType === filterType || t.cat === filterType;
    
    // Status filter
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'ready' && (t.primaryImage || t.imageUrl)) ||
      (filterStatus === 'missing' && !(t.primaryImage || t.imageUrl));

    return nameMatch && typeMatch && statusMatch;
  });

  return (
    <div className="space-y-6 text-theme-text font-sans">
      {/* Overview Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-theme-card p-4 rounded-3xl border border-theme-border/60 shadow-sm theme-transition">
          <Database size={16} className="text-primary mb-2" />
          <h5 className="text-[10px] text-theme-muted font-bold uppercase">{t('str_605')}</h5>
          <p className="text-lg font-black mt-1">{totalTemplates}</p>
        </div>

        <div className="bg-theme-card p-4 rounded-3xl border border-theme-border/60 shadow-sm theme-transition">
          <CheckCircle size={16} className="text-green-500 mb-2" />
          <h5 className="text-[10px] text-theme-muted font-bold uppercase">{t('str_606')}</h5>
          <p className="text-lg font-black text-green-500 mt-1">{templatesWithImages}</p>
        </div>

        <div className="bg-theme-card p-4 rounded-3xl border border-theme-border/60 shadow-sm theme-transition">
          <AlertTriangle size={16} className="text-red-500 mb-2" />
          <h5 className="text-[10px] text-theme-muted font-bold uppercase">{t('str_607')}</h5>
          <p className="text-lg font-black text-red-500 mt-1">{templatesMissingImages}</p>
        </div>

        <div className="bg-theme-card p-4 rounded-3xl border border-theme-border/60 shadow-sm theme-transition">
          <Sparkles size={16} className="text-indigo-500 mb-2" />
          <h5 className="text-[10px] text-theme-muted font-bold uppercase">{t('str_608')}</h5>
          <p className="text-lg font-black text-indigo-500 mt-1">{galleryCoverage}%</p>
        </div>

        <div className="bg-theme-card p-4 rounded-3xl border border-theme-border/60 shadow-sm theme-transition">
          <Layers size={16} className="text-amber-500 mb-2" />
          <h5 className="text-[10px] text-theme-muted font-bold uppercase">{t('str_609')}</h5>
          <p className="text-lg font-black text-amber-500 mt-1">{storageUsageEstimateMb} MB</p>
        </div>
      </div>

      {/* Global Action Toolbar */}
      <div className="bg-theme-card p-4 rounded-3xl border border-theme-border/60 shadow-sm flex flex-wrap gap-3.5 justify-between items-center theme-transition">
        {/* Filters */}
        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('str_610')}
              className="bg-theme-bg border border-theme-border/60 rounded-xl pl-3.5 pr-9 py-2 text-xs font-bold outline-none focus:border-primary text-theme-text w-48"
            />
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
          </div>

          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
            className="bg-theme-bg border border-theme-border/60 rounded-xl px-3 py-2 text-xs font-bold outline-none text-theme-text focus:border-primary"
          >
            <option value="all">{t('str_611')}</option>
            <option value="grocery">{t('str_612')}</option>
            <option value="mobile">{t('str_613')}</option>
            <option value="pharmacy">{t('str_614')}</option>
            <option value="library">{t('str_615')}</option>
            <option value="electrical">{t('str_616')}</option>
          </select>

          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-theme-bg border border-theme-border/60 rounded-xl px-3 py-2 text-xs font-bold outline-none text-theme-text focus:border-primary"
          >
            <option value="all">{t('str_617')}</option>
            <option value="ready">{t('str_618')}</option>
            <option value="missing">{t('str_619')}</option>
          </select>
        </div>

        {/* Global actions */}
        <div className="flex gap-2">
          <button 
            onClick={handleRunRecoveryScan}
            disabled={scanning}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition"
          >
            <Activity size={14} className={scanning ? 'animate-spin' : ''} />
            {scanning ? (t('str_620')) : (t('str_621'))}
          </button>

          <button 
            onClick={fetchData}
            disabled={loading}
            className="bg-theme-bg border border-theme-border hover:bg-theme-border-hover text-theme-text font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {t('str_622')}
          </button>
        </div>
      </div>

      {/* Bulk Operations Selection bar */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border border-primary/20 p-3.5 rounded-2xl flex justify-between items-center animate-fade-in">
          <span className="text-xs font-black text-primary">
            {t('str_623')}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handleBulkSync}
              className="bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-lg hover:scale-102 transition"
            >
              {t('str_624')}
            </button>
            <button 
              onClick={handleBulkRecover}
              className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg hover:scale-102 transition"
            >
              {t('str_625')}
            </button>
            <button 
              onClick={handleBulkDelete}
              className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg hover:scale-102 transition"
            >
              {t('str_626')}
            </button>
            <button 
              onClick={() => setSelectedIds([])}
              className="text-[10px] text-theme-muted hover:text-theme-text font-bold px-2"
            >
              {t('str_56')}
            </button>
          </div>
        </div>
      )}

      {/* Main Templates Table Grid */}
      <div className="bg-theme-card border border-theme-border/60 rounded-[30px] shadow-sm overflow-hidden theme-transition">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-theme-bg border-b border-theme-border/60 text-theme-muted font-black uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4 text-center w-12">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={filteredTemplates.length > 0 && selectedIds.length === filteredTemplates.length}
                    className="w-4 h-4 accent-primary rounded border-theme-border cursor-pointer"
                  />
                </th>
                <th className="p-4">{t('str_627')}</th>
                <th className="p-4">{t('str_628')}</th>
                <th className="p-4">{t('str_629')}</th>
                <th className="p-4">{t('str_630')}</th>
                <th className="p-4">{t('str_631')}</th>
                <th className="p-4">{t('str_632')}</th>
                <th className="p-4 text-center">{t('str_633')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/40 font-bold">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-theme-muted font-bold animate-pulse">
                    {t('str_634')}
                  </td>
                </tr>
              ) : filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-theme-muted font-bold">
                    {t('str_635')}
                  </td>
                </tr>
              ) : (
                filteredTemplates.map(temp => {
                  const hasImage = temp.primaryImage || temp.imageUrl || temp.imgUrl;
                  const isSelected = selectedIds.includes(temp.id);
                  const version = temp.templateImageVersion || temp.assetVersion || 1;
                  
                  // Compute synced vs outdated count
                  const copies = vendorProducts.filter(p => p.templateId === temp.id);
                  const outdatedCount = copies.filter(p => (p.assetVersion || 0) < version).length;
                  const syncedCount = copies.length - outdatedCount;

                  return (
                    <tr 
                      key={temp.id} 
                      className={`hover:bg-theme-bg/20 transition-all ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleToggleSelect(temp.id)}
                          className="w-4 h-4 accent-primary rounded border-theme-border cursor-pointer"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={hasImage ? hasImage : placeholderService.getPlaceholderForCategory(temp.categoryName || temp.cat)} 
                            className="w-10 h-10 rounded-xl object-cover border border-theme-border bg-theme-bg flex-shrink-0" 
                            alt="Template" 
                          />
                          <div>
                            <span className="text-theme-text font-black block">{temp.nameAr || temp.name}</span>
                            <span className="text-[10px] text-theme-muted font-bold block mt-0.5">ID: {temp.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-theme-text uppercase">{temp.storeType || temp.cat}</td>
                      <td className="p-4 text-theme-muted">{temp.brand || '—'}</td>
                      <td className="p-4">
                        <span className="font-mono bg-theme-bg px-2 py-0.5 rounded border border-theme-border text-theme-text">
                          v{version}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-green-500 block">
                            {t('str_636')}
                          </span>
                          {outdatedCount > 0 && (
                            <span className="text-[10px] text-red-500 block animate-pulse font-black">
                              {t('str_637')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${
                          hasImage 
                            ? 'text-green-500 bg-green-500/10 border-green-500/20' 
                            : 'text-red-500 bg-red-500/10 border-red-500/20 animate-pulse'
                        }`}>
                          {hasImage ? (t('str_161')) : (t('str_638'))}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          {/* Upload primary */}
                          <div className="relative">
                            <button 
                              disabled={uploadingId === temp.id}
                              className="px-2.5 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition rounded-xl text-[10px] font-black flex items-center gap-1"
                            >
                              <Upload size={10} />
                              {t('str_639')}
                            </button>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={e => handleUploadClick(e, temp.id, 'primary')}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </div>

                          {/* Upload gallery */}
                          <div className="relative">
                            <button 
                              disabled={uploadingId === temp.id}
                              className="px-2.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 hover:bg-indigo-500/20 transition rounded-xl text-[10px] font-black flex items-center gap-1"
                            >
                              <ImageIcon size={10} />
                              {t('str_640')}
                            </button>
                            <input 
                              type="file" 
                              multiple
                              accept="image/*"
                              onChange={e => handleUploadClick(e, temp.id, 'gallery')}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </div>

                          {/* Sync cascades */}
                          <button 
                            onClick={async () => {
                              setLoading(true);
                              const c = await catalogSyncService.syncTemplateToProducts(temp.id);
                              showToast(t('str_641'));
                              await fetchData();
                            }}
                            className="p-1.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl hover:bg-green-500/20 transition"
                            title={t('str_642')}
                          >
                            <RefreshCw size={11} />
                          </button>

                          {/* Auto repair */}
                          <button 
                            onClick={async () => {
                              setLoading(true);
                              await assetRecoveryService.repairAsset(temp.id, true);
                              showToast(t('str_643'));
                              await fetchData();
                            }}
                            className="p-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl hover:bg-amber-500/20 transition"
                            title={t('str_644')}
                          >
                            <Activity size={11} />
                          </button>

                          {/* Clear asset */}
                          <button 
                            onClick={() => handleRemoveAsset(temp.id)}
                            className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/20 transition"
                            title={t('str_645')}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductAssetManager;
