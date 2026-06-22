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
      showToast(isRTL ? 'فشل تحميل بيانات الأصول' : 'Failed to fetch asset data');
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
        showToast(isRTL ? 'تم رفع الصورة وتحديث الإصدار' : 'Uploaded primary image and updated version');
      } else {
        const files = Array.from(e.target.files);
        const urls = await mediaService.uploadGalleryImages(files, 'productTemplates');
        
        const temp = templates.find(t => t.id === templateId);
        const primary = temp?.primaryImage || temp?.imageUrl || temp?.imgUrl || '';
        const currentGallery = temp?.galleryImages || temp?.images || [];
        const newGallery = [...currentGallery, ...urls];
        
        await mediaService.createAssetVersion(templateId, primary, newGallery, 'admin');
        showToast(isRTL ? 'تم رفع صور المعرض وتحديث الإصدار' : 'Uploaded gallery images and updated version');
      }
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingId(null);
    }
  };

  const handleRemoveAsset = async (templateId: string) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من مسح جميع أصول هذا القالب البصرية؟' : 'Are you sure you want to remove visual assets for this template?')) return;
    setLoading(true);
    try {
      const tempRef = doc(db, 'productTemplates', templateId);
      await updateDoc(tempRef, {
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
      });
      showToast(isRTL ? 'تم مسح الأصول بنجاح' : 'Assets cleared successfully');
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
      showToast(isRTL ? `تم تحديث ومزامنة ${synced} نسخة من المنتجات` : `Synced ${synced} product instances`);
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
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف صور القوالب المحددة؟' : 'Are you sure you want to delete assets for selected templates?')) return;
    setLoading(true);
    try {
      for (const id of selectedIds) {
        const tempRef = doc(db, 'productTemplates', id);
        await updateDoc(tempRef, {
          primaryImage: '',
          imageUrl: '',
          imgUrl: '',
          galleryImages: [],
          images: [],
          gallery: [],
          templateImageVersion: 0,
          assetVersion: 0,
          assetStatus: 'missing'
        });
      }
      showToast(isRTL ? 'تم مسح أصول القوالب المحددة' : 'Cleared selected templates assets');
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
      showToast(isRTL ? `تم فحص وإصلاح ${repaired} قالب` : `Repaired ${repaired} templates`);
      setSelectedIds([]);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          <h5 className="text-[10px] text-theme-muted font-bold uppercase">{isRTL ? 'إجمالي القوالب' : 'Total Templates'}</h5>
          <p className="text-lg font-black mt-1">{totalTemplates}</p>
        </div>

        <div className="bg-theme-card p-4 rounded-3xl border border-theme-border/60 shadow-sm theme-transition">
          <CheckCircle size={16} className="text-green-500 mb-2" />
          <h5 className="text-[10px] text-theme-muted font-bold uppercase">{isRTL ? 'قوالب بصور جاهزة' : 'With Images'}</h5>
          <p className="text-lg font-black text-green-500 mt-1">{templatesWithImages}</p>
        </div>

        <div className="bg-theme-card p-4 rounded-3xl border border-theme-border/60 shadow-sm theme-transition">
          <AlertTriangle size={16} className="text-red-500 mb-2" />
          <h5 className="text-[10px] text-theme-muted font-bold uppercase">{isRTL ? 'قوالب بدون صور' : 'Missing Images'}</h5>
          <p className="text-lg font-black text-red-500 mt-1">{templatesMissingImages}</p>
        </div>

        <div className="bg-theme-card p-4 rounded-3xl border border-theme-border/60 shadow-sm theme-transition">
          <Sparkles size={16} className="text-indigo-500 mb-2" />
          <h5 className="text-[10px] text-theme-muted font-bold uppercase">{isRTL ? 'تغطية المعرض %' : 'Gallery Coverage'}</h5>
          <p className="text-lg font-black text-indigo-500 mt-1">{galleryCoverage}%</p>
        </div>

        <div className="bg-theme-card p-4 rounded-3xl border border-theme-border/60 shadow-sm theme-transition">
          <Layers size={16} className="text-amber-500 mb-2" />
          <h5 className="text-[10px] text-theme-muted font-bold uppercase">{isRTL ? 'المساحة التقديرية' : 'Est Storage'}</h5>
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
              placeholder={isRTL ? 'ابحث في القوالب...' : 'Search master templates...'}
              className="bg-theme-bg border border-theme-border/60 rounded-xl pl-3.5 pr-9 py-2 text-xs font-bold outline-none focus:border-primary text-theme-text w-48"
            />
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
          </div>

          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
            className="bg-theme-bg border border-theme-border/60 rounded-xl px-3 py-2 text-xs font-bold outline-none text-theme-text focus:border-primary"
          >
            <option value="all">{isRTL ? 'كل التصنيفات' : 'All Classes'}</option>
            <option value="grocery">{isRTL ? 'بقالة وسوبرماركت' : 'Supermarket / Grocery'}</option>
            <option value="mobile">{isRTL ? 'موبايلات وإلكترونيات' : 'Mobile / Tech'}</option>
            <option value="pharmacy">{isRTL ? 'صيدلية ورعاية' : 'Pharmacy'}</option>
            <option value="library">{isRTL ? 'مكتبة وأدوات مكتبية' : 'Library / Stationery'}</option>
            <option value="electrical">{isRTL ? 'أجهزة كهربائية' : 'Electrical'}</option>
          </select>

          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-theme-bg border border-theme-border/60 rounded-xl px-3 py-2 text-xs font-bold outline-none text-theme-text focus:border-primary"
          >
            <option value="all">{isRTL ? 'كل الحالات' : 'All Statuses'}</option>
            <option value="ready">{isRTL ? 'جاهز (بصور)' : 'Ready (With Image)'}</option>
            <option value="missing">{isRTL ? 'مفقود (بدون صور)' : 'Missing Image'}</option>
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
            {scanning ? (isRTL ? 'جاري الفحص...' : 'Scanning...') : (isRTL ? 'تشغيل فحص الإصلاح' : 'Run Recovery Scan')}
          </button>

          <button 
            onClick={fetchData}
            disabled={loading}
            className="bg-theme-bg border border-theme-border hover:bg-theme-border-hover text-theme-text font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {isRTL ? 'تحديث البيانات' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Bulk Operations Selection bar */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border border-primary/20 p-3.5 rounded-2xl flex justify-between items-center animate-fade-in">
          <span className="text-xs font-black text-primary">
            {isRTL ? `تم تحديد ${selectedIds.length} قالب` : `Selected ${selectedIds.length} templates`}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handleBulkSync}
              className="bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-lg hover:scale-102 transition"
            >
              {isRTL ? 'مزامنة مع المتاجر' : 'Sync Vendors'}
            </button>
            <button 
              onClick={handleBulkRecover}
              className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg hover:scale-102 transition"
            >
              {isRTL ? 'تشغيل إصلاح تلقائي' : 'Auto Repair'}
            </button>
            <button 
              onClick={handleBulkDelete}
              className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg hover:scale-102 transition"
            >
              {isRTL ? 'مسح الأصول' : 'Delete Assets'}
            </button>
            <button 
              onClick={() => setSelectedIds([])}
              className="text-[10px] text-theme-muted hover:text-theme-text font-bold px-2"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
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
                <th className="p-4">{isRTL ? 'اسم السلعة / القالب' : 'Product Template'}</th>
                <th className="p-4">{isRTL ? 'نوع النشاط' : 'Store Type'}</th>
                <th className="p-4">{isRTL ? 'الماركة' : 'Brand'}</th>
                <th className="p-4">{isRTL ? 'إصدار الأصول' : 'Asset Version'}</th>
                <th className="p-4">{isRTL ? 'حالة التزامن (المتاجر)' : 'Sync Status (Vendors)'}</th>
                <th className="p-4">{isRTL ? 'حالة الصور' : 'Asset Status'}</th>
                <th className="p-4 text-center">{isRTL ? 'إجراءات إدارة الأصول' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/40 font-bold">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-theme-muted font-bold animate-pulse">
                    {isRTL ? 'جاري تحميل بيانات الأصول...' : 'Loading master assets catalog...'}
                  </td>
                </tr>
              ) : filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-theme-muted font-bold">
                    {isRTL ? 'لم يتم العثور على قوالب تطابق خيارات التصفية.' : 'No templates found.'}
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
                            {isRTL ? `مستقر: ${syncedCount}` : `Synced: ${syncedCount}`}
                          </span>
                          {outdatedCount > 0 && (
                            <span className="text-[10px] text-red-500 block animate-pulse font-black">
                              {isRTL ? `معلق مزامنة: ${outdatedCount}` : `Outdated: ${outdatedCount}`}
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
                          {hasImage ? (isRTL ? 'جاهز' : 'Ready') : (isRTL ? 'مفقود' : 'Missing')}
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
                              {isRTL ? 'رفع رئيسية' : 'Cover'}
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
                              {isRTL ? 'رفع ألبوم' : 'Gallery'}
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
                              showToast(isRTL ? `تمت مزامنة وتحديث ${c} نسخة` : `Synced ${c} vendor copies`);
                              await fetchData();
                            }}
                            className="p-1.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl hover:bg-green-500/20 transition"
                            title={isRTL ? 'دفع التحديثات للمتاجر' : 'Sync Vendors'}
                          >
                            <RefreshCw size={11} />
                          </button>

                          {/* Auto repair */}
                          <button 
                            onClick={async () => {
                              setLoading(true);
                              await assetRecoveryService.repairAsset(temp.id, true);
                              showToast(isRTL ? 'تم فحص وإصلاح القالب' : 'Template repaired');
                              await fetchData();
                            }}
                            className="p-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl hover:bg-amber-500/20 transition"
                            title={isRTL ? 'تشغيل استرداد الأصول' : 'Recover Assets'}
                          >
                            <Activity size={11} />
                          </button>

                          {/* Clear asset */}
                          <button 
                            onClick={() => handleRemoveAsset(temp.id)}
                            className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/20 transition"
                            title={isRTL ? 'حذف الأصول' : 'Delete Assets'}
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
