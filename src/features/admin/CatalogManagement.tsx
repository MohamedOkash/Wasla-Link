import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, Check, FolderOpen, Tag, Database, Upload, Download, RefreshCw, BarChart } from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from '../../services/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  writeBatch, 
  query, 
  where 
} from 'firebase/firestore';
import { useApp } from '../../contexts/AppContext';
import { Product } from '../../types/product.types';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumInput } from '../../components/premium/PremiumInput';
import { PremiumBadge } from '../../components/premium/PremiumBadge';
import { categoryRepository } from "../../services/admin/repository";

export const CatalogManagement: React.FC = () => {
  const { t } = useTranslation();
  const { categories, lang, isRTL, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'categories' | 'brands' | 'templates' | 'excel'>('categories');

  // Common States
  const [loading, setLoading] = useState(false);

  // Brands States
  const [brands, setBrands] = useState<string[]>(['الضحى', 'الملكة', 'كريستال', 'جهينة', 'دومتي', 'شيبسي', 'بيبسي', 'العروسة', 'برسيل', 'بامبرز', 'أمريكانا']);
  const [newBrand, setNewBrand] = useState('');

  // Templates States
  const [templates, setTemplates] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editingTemplate, setEditingTemplate] = useState<Product | null>(null);
  const [showAddTemplate, setShowAddTemplate] = useState(false);

  // Template Form States
  const [tempNameAr, setTempNameAr] = useState('');
  const [tempNameEn, setTempNameEn] = useState('');
  const [tempCategoryId, setTempCategoryId] = useState('grocery');
  const [tempSubCat, setTempSubCat] = useState('');
  const [tempBrand, setTempBrand] = useState('');
  const [tempBarcode, setTempBarcode] = useState('');
  const [tempSku, setTempSku] = useState('');
  const [tempUnit, setTempUnit] = useState('قطعة');
  const [tempWeight, setTempWeight] = useState('');
  const [tempCostPrice, setTempCostPrice] = useState(0);
  const [tempSellingPrice, setTempSellingPrice] = useState(0);
  const [tempDesc, setTempDesc] = useState('');
  const [tempImgUrl, setTempImgUrl] = useState('');

  // Categories Form States
  const [showAddCat, setShowAddCat] = useState(false);
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [catId, setCatId] = useState('');
  const [catNameAr, setCatNameAr] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catImg, setCatImg] = useState('');

  // Bulk Excel Upload state
  const [excelPreview, setExcelPreview] = useState<any[]>([]);

  // Load productTemplates and brands from Firestore
  useEffect(() => {
    fetchTemplates();
    fetchBrands();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'productTemplates'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setTemplates(list);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const snap = await getDocs(collection(db, 'brands'));
      if (!snap.empty) {
        setBrands(snap.docs.map(d => d.id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- BRAND MANAGEMENT ACTIONS ---
  const handleAddBrand = async () => {
    if (!newBrand.trim()) return;
    const brandName = newBrand.trim();
    if (brands.includes(brandName)) {
      showToast(t('str_433'));
      return;
    }
    try {
      await import('../../services/admin/service').then(m => m.adminService.createCatalogItem('brands', brandName, { createdAt: new Date().toISOString() }));
      setBrands(prev => [...prev, brandName]);
      setNewBrand('');
      showToast(t('str_434'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBrand = async (brandName: string) => {
    if (!window.confirm(t('str_435'))) return;
    try {
      await import('../../services/admin/service').then(m => m.adminService.deleteCatalogItem('brands', brandName));
      setBrands(prev => prev.filter(b => b !== brandName));
      showToast(t('str_436'));
    } catch (err) {
      console.error(err);
    }
  };

  // --- CATEGORIES MANAGEMENT ACTIONS ---
  const handleOpenAddCat = () => {
  const {} = useTranslation();

    setCatId('');
    setCatNameAr('');
    setCatNameEn('');
    setCatImg('https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=300&q=80');
    setEditingCat(null);
    setShowAddCat(true);
  };

  const handleOpenEditCat = (cat: any) => {
    setEditingCat(cat);
    setCatId(cat.id);
    setCatNameAr(cat.nameAr || cat.name?.ar);
    setCatNameEn(cat.nameEn || cat.name?.en);
    setCatImg(cat.image || cat.imgUrl);
    setShowAddCat(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catId || !catNameAr || !catNameEn) {
      showToast(t('str_437'));
      return;
    }

    const catPayload = {
      id: catId.trim().toLowerCase(),
      name: { ar: catNameAr, en: catNameEn },
      imgUrl: catImg,
      nameAr: catNameAr,
      nameEn: catNameEn,
      image: catImg,
      icon: 'FolderOpen'
    };

    try {
      await categoryRepository.create(catPayload.id, catPayload);
      if (editingCat) {
        showToast(t('str_438'));
      } else {
        showToast(t('str_439'));
      }
      setShowAddCat(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm(t('str_440'))) return;
    try {
      await categoryRepository.delete(id);
      showToast(t('str_441'));
    } catch (err) {
      console.error(err);
    }
  };

  // --- PRODUCT TEMPLATES ACTIONS ---
  const handleOpenAddTemplate = () => {
    setEditingTemplate(null);
    setTempNameAr('');
    setTempNameEn('');
    setTempCategoryId('grocery');
    setTempSubCat('');
    setTempBrand('');
    setTempBarcode('');
    setTempSku('');
    setTempUnit('قطعة');
    setTempWeight('');
    setTempCostPrice(0);
    setTempSellingPrice(0);
    setTempDesc('');
    setTempImgUrl('https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=300&q=80');
    setShowAddTemplate(true);
  };

  const handleOpenEditTemplate = (template: Product) => {
    setEditingTemplate(template);
    setTempNameAr(template.nameAr || template.name || '');
    setTempNameEn(template.nameEn || template.name || '');
    setTempCategoryId(template.categoryId || 'grocery');
    setTempSubCat(template.cat || template.categoryName || '');
    setTempBrand(template.brand || '');
    setTempBarcode(template.barcode || '');
    setTempSku(template.sku || '');
    setTempUnit(template.unit || 'قطعة');
    setTempWeight(template.weight || '');
    setTempCostPrice(template.costPrice || 0);
    setTempSellingPrice(template.sellingPrice || template.price || 0);
    setTempDesc(template.description || template.desc || '');
    setTempImgUrl(template.imageUrl || template.imgUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=300&q=80');
    setShowAddTemplate(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempNameAr || !tempNameEn || !tempSubCat || !tempSellingPrice) {
      showToast(t('str_442'));
      return;
    }

    const tempId = editingTemplate?.id || `pt_${Date.now()}`;
    const payload: Product = {
      id: tempId,
      storeId: 'template',
      cat: tempSubCat,
      name: tempNameAr,
      desc: tempDesc,
      price: Number(tempSellingPrice),
      imgUrl: tempImgUrl,
      
      nameAr: tempNameAr,
      nameEn: tempNameEn,
      templateId: tempId,
      categoryId: tempCategoryId,
      categoryName: tempSubCat,
      brand: tempBrand,
      barcode: tempBarcode || `622_${Date.now().toString().substring(5)}`,
      sku: tempSku || `SKU-TEMP-${tempCategoryId.toUpperCase()}-${tempId.substring(3, 7)}`,
      unit: tempUnit,
      weight: tempWeight,
      costPrice: Number(tempCostPrice),
      sellingPrice: Number(tempSellingPrice),
      stock: 100,
      reservedStock: 0,
      minStock: 10,
      averageRating: editingTemplate?.averageRating || 5.0,
      isBestSeller: editingTemplate?.isBestSeller || false,
      isFeatured: editingTemplate?.isFeatured || false,
      isTrending: editingTemplate?.isTrending || false,
      viewsCount: editingTemplate?.viewsCount || 0,
      salesCount: editingTemplate?.salesCount || 0,
      favoritesCount: editingTemplate?.favoritesCount || 0,
      isTemplate: true,
      storeType: tempCategoryId,
      isActive: true,
      imageKeywords: [tempNameEn, tempBrand]
    };

    try {
      await import('../../services/admin/service').then(m => m.adminService.createCatalogItem('productTemplates', tempId, payload));
      if (editingTemplate) {
        setTemplates(prev => prev.map(item => item.id === tempId ? payload : item));
        showToast(t('str_443'));
      } else {
        setTemplates(prev => [...prev, payload]);
        showToast(t('str_444'));
      }
      setShowAddTemplate(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm(t('str_445'))) return;
    try {
      await import('../../services/admin/service').then(m => m.adminService.deleteCatalogItem('productTemplates', id));
      setTemplates(prev => prev.filter(item => item.id !== id));
      showToast(t('str_446'));
    } catch (err) {
      console.error(err);
    }
  };

  // --- EXCEL BULK OPERATIONS & SYNC ENGINE ---
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        setExcelPreview(data);
        showToast(t('str_447'));
      } catch (err) {
        console.error(err);
        showToast(t('str_448'));
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCommitExcelImports = async () => {
    if (excelPreview.length === 0) return;
    setLoading(true);
    try {
      const mappedTemplates = excelPreview.map((row, index) => {
        const tempId = row.id || `pt_ex_${Date.now()}_${index}`;
        return {
          id: tempId,
          storeId: 'template',
          cat: row.categoryName || row.cat || 'General',
          name: row.nameAr || row.name || 'Unnamed',
          desc: row.description || row.desc || '',
          price: Number(row.sellingPrice || row.price || 0),
          imgUrl: row.imageUrl || row.imgUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=300&q=80',
          nameAr: row.nameAr || row.name || 'Unnamed',
          nameEn: row.nameEn || row.name || 'Unnamed',
          templateId: tempId,
          categoryId: row.categoryId || 'grocery',
          categoryName: row.categoryName || row.cat || 'General',
          brand: row.brand || 'Local',
          barcode: row.barcode || `BAR_${Date.now()}_${index}`,
          sku: row.sku || `SKU_EX_${index}`,
          unit: row.unit || 'قطعة',
          weight: row.weight || '',
          costPrice: Number(row.costPrice || 0),
          sellingPrice: Number(row.sellingPrice || row.price || 0),
          stock: 100,
          reservedStock: 0,
          minStock: 10,
          averageRating: 5.0,
          isTemplate: true,
          storeType: row.categoryId || 'grocery',
          isActive: true
        };
      });
      await import('../../services/admin/service').then(m => m.adminService.importTemplates(mappedTemplates));
      showToast(t('str_449'));
      setExcelPreview([]);
      fetchTemplates();
    } catch (err) {
      console.error(err);
      showToast(t('str_450'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportTemplates = () => {
    if (templates.length === 0) return;
    const headers = [
      { id: 'id', title: 'Template ID' },
      { id: 'nameAr', title: 'Arabic Name' },
      { id: 'nameEn', title: 'English Name' },
      { id: 'categoryId', title: 'Parent Category ID' },
      { id: 'categoryName', title: 'Subcategory Name' },
      { id: 'brand', title: 'Brand' },
      { id: 'barcode', title: 'Barcode' },
      { id: 'sku', title: 'SKU' },
      { id: 'unit', title: 'Unit' },
      { id: 'weight', title: 'Weight' },
      { id: 'costPrice', title: 'Cost Price' },
      { id: 'sellingPrice', title: 'Selling Price' }
    ];

    const rows = templates.map(template => [
      template.id, template.nameAr, template.nameEn, template.categoryId, template.categoryName, template.brand, template.barcode, template.sku, template.unit, template.weight, template.costPrice, template.sellingPrice
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers.map(h => h.title), ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Product Templates");
    XLSX.writeFile(workbook, `MasterCatalog_Templates_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast(t('str_451'));
  };

  // Bulk Sync Engine: Updates name, description, brand, and images across live stores
  const handleBulkSyncCatalog = async () => {
    if (templates.length === 0) {
      showToast(t('str_452'));
      return;
    }
    setLoading(true);
    try {
      const liveProductsSnap = await getDocs(collection(db, 'products'));
      const liveProducts = liveProductsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      
      const toSync = liveProducts.filter(p => p.templateId !== undefined);
      
      if (toSync.length === 0) {
        showToast(t('str_453'));
        setLoading(false);
        return;
      }

      const templatesMap = new Map(templates.map(template => [template.id, template]));
      await import('../../services/admin/service').then(m => m.adminService.bulkSyncCatalog(toSync, templatesMap));
      showToast(t('str_454'));
    } catch (err) {
      console.error(err);
      showToast(t('str_455'));
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = (template.nameAr || template.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                          (template.nameEn || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                          (template.brand || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                          (template.barcode || '').includes(searchQuery);
    const matchesCategory = filterCategory === 'all' || template.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 text-theme-text pb-10">
      {/* Navigation sub-tabs */}
      <div className="bg-theme-card p-1.5 rounded-2xl border border-theme-border/60 shadow-sm flex overflow-x-auto no-scrollbar gap-1.5 theme-transition">
        {[
          { id: 'categories', label: t('str_456'), icon: FolderOpen },
          { id: 'brands', label: t('str_457'), icon: Tag },
          { id: 'templates', label: t('str_458'), icon: Database },
          { id: 'excel', label: t('str_459'), icon: Upload }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-300 ${
              activeTab === tab.id 
                ? 'bg-primary text-white shadow-sm shadow-primary/20 scale-102' 
                : 'text-theme-muted hover:text-theme-text hover:bg-theme-bg'
            }`}
          >
            <tab.icon size={13} />
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-black text-theme-text text-sm">{t('str_460')}</h3>
              <p className="text-[10px] text-theme-muted font-bold mt-0.5">{t('str_461')}</p>
            </div>
            <PremiumButton size="sm" onClick={handleOpenAddCat} leftIcon={<Plus size={14} />}>
              {t('str_462')}
            </PremiumButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(c => (
              <PremiumCard key={c.id} hoverable={false} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={c.image || c.imgUrl} className="w-12 h-12 rounded-xl object-cover border border-theme-border/40" alt={c.nameAr} />
                  <div>
                    <h4 className="font-black text-xs text-theme-text">{lang === 'ar' ? c.nameAr : c.nameEn}</h4>
                    <span className="text-[9px] text-theme-muted font-bold block uppercase mt-0.5">{c.id}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <PremiumButton variant="outline" size="sm" className="p-2 h-8 w-8 rounded-lg" onClick={() => handleOpenEditCat(c)}>
                    <Edit size={12} />
                  </PremiumButton>
                  <PremiumButton variant="danger" size="sm" className="p-2 h-8 w-8 rounded-lg bg-red-500/10 border-red-500/25 text-red-500 hover:bg-red-500/20" onClick={() => handleDeleteCategory(c.id)}>
                    <Trash2 size={12} />
                  </PremiumButton>
                </div>
              </PremiumCard>
            ))}
          </div>

          {/* Add/Edit Category Modal */}
          {showAddCat && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <PremiumCard hoverable={false} className="w-full max-w-md p-6 space-y-4">
                <h3 className="font-black text-sm text-primary">
                  {editingCat ? (t('str_463')) : (t('str_464'))}
                </h3>
                <form onSubmit={handleSaveCategory} className="space-y-4">
                  <PremiumInput 
                    type="text" 
                    placeholder={t('str_465')} 
                    value={catId}
                    onChange={(e) => setCatId(e.target.value)}
                    disabled={!!editingCat}
                  />
                  <PremiumInput 
                    type="text" 
                    placeholder={t('str_466')} 
                    value={catNameAr}
                    onChange={(e) => setCatNameAr(e.target.value)}
                  />
                  <PremiumInput 
                    type="text" 
                    placeholder={t('str_467')} 
                    value={catNameEn}
                    onChange={(e) => setCatNameEn(e.target.value)}
                  />
                  <PremiumInput 
                    type="text" 
                    placeholder={t('str_468')} 
                    value={catImg}
                    onChange={(e) => setCatImg(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end pt-3">
                    <PremiumButton variant="outline" size="sm" type="button" onClick={() => setShowAddCat(false)}>{t('str_56')}</PremiumButton>
                    <PremiumButton variant="primary" size="sm" type="submit">{t('str_469')}</PremiumButton>
                  </div>
                </form>
              </PremiumCard>
            </div>
          )}
        </div>
      )}

      {/* BRANDS TAB */}
      {activeTab === 'brands' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-black text-theme-text text-sm">{t('str_470')}</h3>
              <p className="text-[10px] text-theme-muted font-bold mt-0.5">{t('str_471')}</p>
            </div>
          </div>

          <div className="bg-theme-card p-4 rounded-2xl border border-theme-border/60 shadow-sm flex gap-3 theme-transition">
            <PremiumInput 
              type="text" 
              placeholder={t('str_472')} 
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              className="flex-1"
            />
            <PremiumButton onClick={handleAddBrand} leftIcon={<Plus size={14} />}>
              {t('str_473')}
            </PremiumButton>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {brands.map(brand => (
              <span key={brand} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-theme-card border border-theme-border/60 text-theme-text theme-transition shadow-sm">
                <span>{brand}</span>
                <button onClick={() => handleDeleteBrand(brand)} className="text-red-500 hover:text-red-600 transition">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* PRODUCT TEMPLATES TAB */}
      {activeTab === 'templates' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="font-black text-theme-text text-sm">{t('str_474')}</h3>
              <p className="text-[10px] text-theme-muted font-bold mt-0.5">{t('str_475')}</p>
            </div>
            <PremiumButton size="sm" onClick={handleOpenAddTemplate} leftIcon={<Plus size={14} />}>
              {t('str_476')}
            </PremiumButton>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <PremiumInput 
              type="text"
              placeholder={t('str_477')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-theme-card border border-theme-border/60 p-3 rounded-xl font-bold outline-none focus:border-primary text-theme-text transition w-full"
            >
              <option value="all">{t('str_478')}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{lang === 'ar' ? c.nameAr : c.nameEn}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3.5">
            {loading ? (
              <p className="text-center text-xs text-theme-muted py-8 font-bold">{t('str_479')}</p>
            ) : filteredTemplates.length === 0 ? (
              <p className="text-center text-xs text-theme-muted py-8 font-bold">{t('str_480')}</p>
            ) : (
              filteredTemplates.map(template => (
                <PremiumCard key={template.id} hoverable={false} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <img src={template.imageUrl || template.imgUrl} className="w-12 h-12 rounded-xl object-cover border border-theme-border/40" alt={template.nameAr} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-xs text-theme-text truncate">{lang === 'ar' ? template.nameAr : template.nameEn}</h4>
                        <PremiumBadge variant="neutral">{template.brand}</PremiumBadge>
                        <PremiumBadge variant="primary">{template.categoryId}</PremiumBadge>
                      </div>
                      <div className="flex gap-4 text-[9px] text-theme-muted font-bold mt-1">
                        <span>Barcode: {template.barcode}</span>
                        <span>SKU: {template.sku}</span>
                        <span>{t('str_481')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <PremiumButton variant="outline" size="sm" className="p-2 h-8 w-8 rounded-lg" onClick={() => handleOpenEditTemplate(template)}>
                      <Edit size={12} />
                    </PremiumButton>
                    <PremiumButton variant="danger" size="sm" className="p-2 h-8 w-8 rounded-lg bg-red-500/10 border-red-500/25 text-red-500 hover:bg-red-500/20" onClick={() => handleDeleteTemplate(template.id)}>
                      <Trash2 size={12} />
                    </PremiumButton>
                  </div>
                </PremiumCard>
              ))
            )}
          </div>

          {/* Add/Edit Template Modal */}
          {showAddTemplate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
              <PremiumCard hoverable={false} className="w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto pr-1 no-scrollbar my-8">
                <h3 className="font-black text-sm text-primary">
                  {editingTemplate ? (t('str_482')) : (t('str_483'))}
                </h3>
                <form onSubmit={handleSaveTemplate} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={tempCategoryId}
                      onChange={(e) => setTempCategoryId(e.target.value)}
                      className="bg-theme-bg border border-theme-border/60 p-3 rounded-xl font-bold outline-none focus:border-primary text-theme-text transition w-full text-xs"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{lang === 'ar' ? c.nameAr : c.nameEn}</option>
                      ))}
                    </select>
                    <PremiumInput 
                      type="text" 
                      placeholder={t('str_484')} 
                      value={tempSubCat}
                      onChange={(e) => setTempSubCat(e.target.value)}
                    />
                  </div>

                  <PremiumInput 
                    type="text" 
                    placeholder={t('str_466')} 
                    value={tempNameAr}
                    onChange={(e) => setTempNameAr(e.target.value)}
                  />
                  <PremiumInput 
                    type="text" 
                    placeholder={t('str_467')} 
                    value={tempNameEn}
                    onChange={(e) => setTempNameEn(e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={tempBrand}
                      onChange={(e) => setTempBrand(e.target.value)}
                      className="bg-theme-bg border border-theme-border/60 p-3 rounded-xl font-bold outline-none focus:border-primary text-theme-text transition w-full text-xs"
                    >
                      <option value="">{t('str_485')}</option>
                      {brands.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    <PremiumInput 
                      type="text" 
                      placeholder={t('str_486')} 
                      value={tempWeight}
                      onChange={(e) => setTempWeight(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <PremiumInput 
                      type="text" 
                      placeholder="Barcode" 
                      value={tempBarcode}
                      onChange={(e) => setTempBarcode(e.target.value)}
                    />
                    <PremiumInput 
                      type="text" 
                      placeholder="SKU" 
                      value={tempSku}
                      onChange={(e) => setTempSku(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <PremiumInput 
                      type="number" 
                      placeholder={t('str_487')} 
                      value={tempCostPrice || ''}
                      onChange={(e) => setTempCostPrice(Number(e.target.value))}
                    />
                    <PremiumInput 
                      type="number" 
                      placeholder={t('str_488')} 
                      value={tempSellingPrice || ''}
                      onChange={(e) => setTempSellingPrice(Number(e.target.value))}
                    />
                  </div>

                  <PremiumInput 
                    type="text" 
                    placeholder={t('str_489')} 
                    value={tempImgUrl}
                    onChange={(e) => setTempImgUrl(e.target.value)}
                  />

                  <textarea 
                    placeholder={t('str_490')} 
                    value={tempDesc}
                    onChange={(e) => setTempDesc(e.target.value)}
                    className="w-full min-h-[80px] bg-theme-bg border border-theme-border/60 p-3 rounded-xl font-bold outline-none focus:border-primary text-theme-text text-xs transition"
                  />

                  <div className="flex gap-2 justify-end pt-2">
                    <PremiumButton variant="outline" size="sm" type="button" onClick={() => setShowAddTemplate(false)}>{t('str_56')}</PremiumButton>
                    <PremiumButton variant="primary" size="sm" type="submit">{t('str_491')}</PremiumButton>
                  </div>
                </form>
              </PremiumCard>
            </div>
          )}
        </div>
      )}

      {/* EXCEL CENTER TAB */}
      {activeTab === 'excel' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-black text-theme-text text-sm">{t('str_492')}</h3>
              <p className="text-[10px] text-theme-muted font-bold mt-0.5">{t('str_493')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sync Engine Card */}
            <PremiumCard hoverable={false} className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="text-primary animate-spin-slow" size={20} />
                <h4 className="font-black text-xs text-theme-text">{t('str_494')}</h4>
              </div>
              <p className="text-[10px] text-theme-muted leading-relaxed font-bold">
                {t('str_495')}
              </p>
              <PremiumButton 
                onClick={handleBulkSyncCatalog} 
                isLoading={loading} 
                className="w-full"
                leftIcon={<RefreshCw size={14} />}
              >
                {t('str_496')}
              </PremiumButton>
            </PremiumCard>

            {/* Export Card */}
            <PremiumCard hoverable={false} className="p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Download className="text-primary" size={20} />
                  <h4 className="font-black text-xs text-theme-text">{t('str_497')}</h4>
                </div>
                <p className="text-[10px] text-theme-muted leading-relaxed font-bold mt-2">
                  {t('str_498')}
                </p>
              </div>
              <PremiumButton 
                onClick={handleExportTemplates} 
                variant="outline"
                className="w-full mt-3"
                leftIcon={<Download size={14} />}
              >
                {t('str_499')}
              </PremiumButton>
            </PremiumCard>
          </div>

          {/* Import Drag & Drop Card */}
          <PremiumCard hoverable={false} className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="text-primary" size={20} />
              <h4 className="font-black text-xs text-theme-text">{t('str_500')}</h4>
            </div>
            
            <div className="border-2 border-dashed border-theme-border/60 hover:border-primary/45 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition relative">
              <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={handleImportExcel}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload size={28} className="text-theme-muted mb-2" />
              <span className="text-xs font-black text-theme-text">{t('str_501')}</span>
              <span className="text-[9px] text-theme-muted font-bold mt-1">يجب مطابقة أعمدة: id, nameAr, nameEn, categoryId, categoryName, brand, barcode, sku, costPrice, sellingPrice</span>
            </div>

            {excelPreview.length > 0 && (
              <div className="space-y-3.5 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-theme-text">{t('str_502')}</span>
                  <div className="flex gap-2">
                    <PremiumButton variant="outline" size="sm" onClick={() => setExcelPreview([])}>{t('str_56')}</PremiumButton>
                    <PremiumButton variant="primary" size="sm" onClick={handleCommitExcelImports}>{t('str_503')}</PremiumButton>
                  </div>
                </div>

                <div className="max-h-[160px] overflow-auto border border-theme-border/40 rounded-xl">
                  <table className="w-full text-right text-[10px] font-bold">
                    <thead className="bg-theme-bg border-b border-theme-border/40 sticky top-0">
                      <tr>
                        <th className="p-2">Name (Ar)</th>
                        <th className="p-2">Category</th>
                        <th className="p-2">Brand</th>
                        <th className="p-2">Cost</th>
                        <th className="p-2">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border/20">
                      {excelPreview.slice(0, 10).map((row, idx) => (
                        <tr key={idx}>
                          <td className="p-2">{row.nameAr || row.name || 'Unnamed'}</td>
                          <td className="p-2">{row.categoryName || row.cat || 'General'}</td>
                          <td className="p-2">{row.brand || 'Local'}</td>
                          <td className="p-2">{row.costPrice || 0}</td>
                          <td className="p-2">{row.sellingPrice || row.price || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {excelPreview.length > 10 && (
                    <div className="p-2 text-center text-[9px] text-theme-muted border-t border-theme-border/20 font-bold bg-theme-bg">
                      ... {t('str_504')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </PremiumCard>
        </div>
      )}
    </div>
  );
};

export default CatalogManagement;
