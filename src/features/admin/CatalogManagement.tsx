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

export const CatalogManagement: React.FC = () => {
  const { categories, setCategories, lang, isRTL, showToast } = useApp();
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
      showToast(isRTL ? 'البراند موجود بالفعل' : 'Brand already exists');
      return;
    }
    try {
      await setDoc(doc(db, 'brands', brandName), { createdAt: new Date().toISOString() });
      setBrands(prev => [...prev, brandName]);
      setNewBrand('');
      showToast(isRTL ? 'تمت إضافة البراند بنجاح' : 'Brand added successfully');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBrand = async (brandName: string) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا البراند؟' : 'Are you sure you want to delete this brand?')) return;
    try {
      await deleteDoc(doc(db, 'brands', brandName));
      setBrands(prev => prev.filter(b => b !== brandName));
      showToast(isRTL ? 'تم حذف البراند بنجاح' : 'Brand deleted successfully');
    } catch (err) {
      console.error(err);
    }
  };

  // --- CATEGORIES MANAGEMENT ACTIONS ---
  const handleOpenAddCat = () => {
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
      showToast(isRTL ? 'يرجى تعبئة كافة الحقول المطلوبة' : 'Please fill all required fields');
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
      await setDoc(doc(db, 'categories', catPayload.id), catPayload);
      if (editingCat) {
        setCategories(prev => prev.map(c => c.id === catPayload.id ? catPayload : c));
        showToast(isRTL ? 'تم تحديث القسم بنجاح' : 'Category updated successfully');
      } else {
        setCategories(prev => [...prev, catPayload]);
        showToast(isRTL ? 'تمت إضافة القسم الجديد بنجاح' : 'Category added successfully');
      }
      setShowAddCat(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا القسم؟ قد يؤثر ذلك على المتاجر المرتبطة به.' : 'Are you sure you want to delete this category?')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      setCategories(prev => prev.filter(c => c.id !== id));
      showToast(isRTL ? 'تم حذف القسم بنجاح' : 'Category deleted successfully');
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

  const handleOpenEditTemplate = (t: Product) => {
    setEditingTemplate(t);
    setTempNameAr(t.nameAr || t.name || '');
    setTempNameEn(t.nameEn || t.name || '');
    setTempCategoryId(t.categoryId || 'grocery');
    setTempSubCat(t.cat || t.categoryName || '');
    setTempBrand(t.brand || '');
    setTempBarcode(t.barcode || '');
    setTempSku(t.sku || '');
    setTempUnit(t.unit || 'قطعة');
    setTempWeight(t.weight || '');
    setTempCostPrice(t.costPrice || 0);
    setTempSellingPrice(t.sellingPrice || t.price || 0);
    setTempDesc(t.description || t.desc || '');
    setTempImgUrl(t.imageUrl || t.imgUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=300&q=80');
    setShowAddTemplate(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempNameAr || !tempNameEn || !tempSubCat || !tempSellingPrice) {
      showToast(isRTL ? 'يرجى تعبئة اسم الصنف الفرعي والأسماء والأسعار' : 'Please fill all required inputs');
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
      await setDoc(doc(db, 'productTemplates', tempId), payload);
      if (editingTemplate) {
        setTemplates(prev => prev.map(t => t.id === tempId ? payload : t));
        showToast(isRTL ? 'تم تحديث قالب المنتج بنجاح' : 'Product template updated successfully');
      } else {
        setTemplates(prev => [...prev, payload]);
        showToast(isRTL ? 'تمت إضافة القالب الجديد بنجاح' : 'Product template added successfully');
      }
      setShowAddTemplate(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا القالب؟' : 'Are you sure you want to delete this template?')) return;
    try {
      await deleteDoc(doc(db, 'productTemplates', id));
      setTemplates(prev => prev.filter(t => t.id !== id));
      showToast(isRTL ? 'تم حذف القالب بنجاح' : 'Template deleted successfully');
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
        showToast(isRTL ? `تم قراءة ${data.length} صف من الملف` : `Parsed ${data.length} rows from file`);
      } catch (err) {
        console.error(err);
        showToast(isRTL ? 'فشل تحليل ملف Excel' : 'Failed to parse Excel file');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCommitExcelImports = async () => {
    if (excelPreview.length === 0) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      excelPreview.forEach((row, index) => {
        const tempId = row.id || `pt_ex_${Date.now()}_${index}`;
        const payload: Product = {
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
        batch.set(doc(db, 'productTemplates', tempId), payload);
      });
      await batch.commit();
      showToast(isRTL ? 'تم رفع وحفظ قوالب المنتجات بنجاح!' : 'Excel templates uploaded and saved successfully!');
      setExcelPreview([]);
      fetchTemplates();
    } catch (err) {
      console.error(err);
      showToast(isRTL ? 'فشل حفظ البيانات المستوردة' : 'Failed to save imported templates');
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

    const rows = templates.map(t => [
      t.id, t.nameAr, t.nameEn, t.categoryId, t.categoryName, t.brand, t.barcode, t.sku, t.unit, t.weight, t.costPrice, t.sellingPrice
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers.map(h => h.title), ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Product Templates");
    XLSX.writeFile(workbook, `MasterCatalog_Templates_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast(isRTL ? 'تم تصدير ملف الإكسيل بنجاح' : 'Catalog exported successfully');
  };

  // Bulk Sync Engine: Updates name, description, brand, and images across live stores
  const handleBulkSyncCatalog = async () => {
    if (templates.length === 0) {
      showToast(isRTL ? 'لا توجد قوالب للمزامنة' : 'No templates loaded to sync');
      return;
    }
    setLoading(true);
    try {
      const liveProductsSnap = await getDocs(collection(db, 'products'));
      const liveProducts = liveProductsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      
      const toSync = liveProducts.filter(p => p.templateId !== undefined);
      
      if (toSync.length === 0) {
        showToast(isRTL ? 'لا توجد منتجات شريكة مرتبطة بالقوالب حالياً' : 'No partner products are linked to templates');
        setLoading(false);
        return;
      }

      const templatesMap = new Map(templates.map(t => [t.id, t]));
      const batchLimit = 400;
      let count = 0;

      for (let i = 0; i < toSync.length; i += batchLimit) {
        const batch = writeBatch(db);
        const chunk = toSync.slice(i, i + batchLimit);
        
        chunk.forEach(p => {
          const matchingTemplate = templatesMap.get(p.templateId!);
          if (matchingTemplate) {
            batch.update(doc(db, 'products', p.id), {
              name: matchingTemplate.nameAr || matchingTemplate.name,
              nameAr: matchingTemplate.nameAr,
              nameEn: matchingTemplate.nameEn,
              brand: matchingTemplate.brand,
              desc: matchingTemplate.description || matchingTemplate.desc,
              description: matchingTemplate.description || matchingTemplate.desc,
              imgUrl: matchingTemplate.imgUrl || matchingTemplate.imageUrl,
              imageUrl: matchingTemplate.imageUrl || matchingTemplate.imgUrl,
              categoryName: matchingTemplate.categoryName,
              cat: matchingTemplate.cat,
              updatedAt: new Date().toISOString()
            });
            count++;
          }
        });
        await batch.commit();
      }
      showToast(isRTL ? `تمت مزامنة ${count} منتج شريك بنجاح!` : `Synced ${count} partner products successfully!`);
    } catch (err) {
      console.error(err);
      showToast(isRTL ? 'فشل تشغيل محرك المزامنة' : 'Failed to execute sync engine');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = (t.nameAr || t.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                          (t.nameEn || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                          (t.brand || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                          (t.barcode || '').includes(searchQuery);
    const matchesCategory = filterCategory === 'all' || t.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 text-theme-text pb-10">
      {/* Navigation sub-tabs */}
      <div className="bg-theme-card p-1.5 rounded-2xl border border-theme-border/60 shadow-sm flex overflow-x-auto no-scrollbar gap-1.5 theme-transition">
        {[
          { id: 'categories', label: isRTL ? 'إدارة الأقسام' : 'Categories', icon: FolderOpen },
          { id: 'brands', label: isRTL ? 'العلامات التجارية' : 'Brands', icon: Tag },
          { id: 'templates', label: isRTL ? 'قوالب المنتجات' : 'Templates', icon: Database },
          { id: 'excel', label: isRTL ? 'مركز البيانات' : 'Excel Center', icon: Upload }
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
              <h3 className="font-black text-theme-text text-sm">{isRTL ? 'إقسام المتاجر الكلية' : 'Global Store Types'}</h3>
              <p className="text-[10px] text-theme-muted font-bold mt-0.5">{isRTL ? 'إدارة الأنشطة والأنواع الرئيسية بالمنصة' : 'Configure main storefront profiles'}</p>
            </div>
            <PremiumButton size="sm" onClick={handleOpenAddCat} leftIcon={<Plus size={14} />}>
              {isRTL ? 'إضافة نشاط' : 'Add Category'}
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
                  {editingCat ? (isRTL ? 'تعديل قسم' : 'Edit Category') : (isRTL ? 'إضافة قسم جديد' : 'New Category')}
                </h3>
                <form onSubmit={handleSaveCategory} className="space-y-4">
                  <PremiumInput 
                    type="text" 
                    placeholder={isRTL ? 'معرف القسم (أحرف إنجليزية فقط)' : 'Category ID (letters only)'} 
                    value={catId}
                    onChange={(e) => setCatId(e.target.value)}
                    disabled={!!editingCat}
                  />
                  <PremiumInput 
                    type="text" 
                    placeholder={isRTL ? 'الاسم باللغة العربية' : 'Arabic Name'} 
                    value={catNameAr}
                    onChange={(e) => setCatNameAr(e.target.value)}
                  />
                  <PremiumInput 
                    type="text" 
                    placeholder={isRTL ? 'الاسم باللغة الإنجليزية' : 'English Name'} 
                    value={catNameEn}
                    onChange={(e) => setCatNameEn(e.target.value)}
                  />
                  <PremiumInput 
                    type="text" 
                    placeholder={isRTL ? 'رابط صورة الغلاف' : 'Cover Image URL'} 
                    value={catImg}
                    onChange={(e) => setCatImg(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end pt-3">
                    <PremiumButton variant="outline" size="sm" type="button" onClick={() => setShowAddCat(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</PremiumButton>
                    <PremiumButton variant="primary" size="sm" type="submit">{isRTL ? 'حفظ الحقول' : 'Save Changes'}</PremiumButton>
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
              <h3 className="font-black text-theme-text text-sm">{isRTL ? 'العلامات التجارية المعتمدة' : 'Master Catalog Brands'}</h3>
              <p className="text-[10px] text-theme-muted font-bold mt-0.5">{isRTL ? 'إدارة ماركات السلع المتاحة بالكتالوج' : 'Configure recognized product brands'}</p>
            </div>
          </div>

          <div className="bg-theme-card p-4 rounded-2xl border border-theme-border/60 shadow-sm flex gap-3 theme-transition">
            <PremiumInput 
              type="text" 
              placeholder={isRTL ? 'اسم الماركة الجديدة...' : 'New brand name...'} 
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              className="flex-1"
            />
            <PremiumButton onClick={handleAddBrand} leftIcon={<Plus size={14} />}>
              {isRTL ? 'إضافة براند' : 'Add Brand'}
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
              <h3 className="font-black text-theme-text text-sm">{isRTL ? 'قوالب المنتجات الكلية' : 'Global Product Templates'}</h3>
              <p className="text-[10px] text-theme-muted font-bold mt-0.5">{isRTL ? 'سجل السلع الأساسي لإمداد مخزون التجار الجدد' : 'Master items cloned during onboarding'}</p>
            </div>
            <PremiumButton size="sm" onClick={handleOpenAddTemplate} leftIcon={<Plus size={14} />}>
              {isRTL ? 'قالب منتج جديد' : 'New Template'}
            </PremiumButton>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <PremiumInput 
              type="text"
              placeholder={isRTL ? 'البحث بالاسم، الباركود أو الماركة...' : 'Search name, barcode or brand...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-theme-card border border-theme-border/60 p-3 rounded-xl font-bold outline-none focus:border-primary text-theme-text transition w-full"
            >
              <option value="all">{isRTL ? 'تصفح كل المتاجر' : 'All Categories'}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{lang === 'ar' ? c.nameAr : c.nameEn}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3.5">
            {loading ? (
              <p className="text-center text-xs text-theme-muted py-8 font-bold">{isRTL ? 'جاري تحميل قالب البيانات...' : 'Loading templates...'}</p>
            ) : filteredTemplates.length === 0 ? (
              <p className="text-center text-xs text-theme-muted py-8 font-bold">{isRTL ? 'لا توجد قوالب مطابقة' : 'No templates match your filters'}</p>
            ) : (
              filteredTemplates.map(t => (
                <PremiumCard key={t.id} hoverable={false} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <img src={t.imageUrl || t.imgUrl} className="w-12 h-12 rounded-xl object-cover border border-theme-border/40" alt={t.nameAr} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-xs text-theme-text truncate">{lang === 'ar' ? t.nameAr : t.nameEn}</h4>
                        <PremiumBadge variant="neutral">{t.brand}</PremiumBadge>
                        <PremiumBadge variant="primary">{t.categoryId}</PremiumBadge>
                      </div>
                      <div className="flex gap-4 text-[9px] text-theme-muted font-bold mt-1">
                        <span>Barcode: {t.barcode}</span>
                        <span>SKU: {t.sku}</span>
                        <span>{isRTL ? `سعر التوصية: ${t.sellingPrice} ج.م` : `Rec Price: ${t.sellingPrice} EGP`}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <PremiumButton variant="outline" size="sm" className="p-2 h-8 w-8 rounded-lg" onClick={() => handleOpenEditTemplate(t)}>
                      <Edit size={12} />
                    </PremiumButton>
                    <PremiumButton variant="danger" size="sm" className="p-2 h-8 w-8 rounded-lg bg-red-500/10 border-red-500/25 text-red-500 hover:bg-red-500/20" onClick={() => handleDeleteTemplate(t.id)}>
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
                  {editingTemplate ? (isRTL ? 'تعديل قالب منتج' : 'Edit Product Template') : (isRTL ? 'إضافة قالب منتج جديد' : 'New Product Template')}
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
                      placeholder={isRTL ? 'الصنف الفرعي (مثال: ألبان)' : 'Subcategory Name (e.g. Dairy)'} 
                      value={tempSubCat}
                      onChange={(e) => setTempSubCat(e.target.value)}
                    />
                  </div>

                  <PremiumInput 
                    type="text" 
                    placeholder={isRTL ? 'الاسم باللغة العربية' : 'Arabic Name'} 
                    value={tempNameAr}
                    onChange={(e) => setTempNameAr(e.target.value)}
                  />
                  <PremiumInput 
                    type="text" 
                    placeholder={isRTL ? 'الاسم باللغة الإنجليزية' : 'English Name'} 
                    value={tempNameEn}
                    onChange={(e) => setTempNameEn(e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={tempBrand}
                      onChange={(e) => setTempBrand(e.target.value)}
                      className="bg-theme-bg border border-theme-border/60 p-3 rounded-xl font-bold outline-none focus:border-primary text-theme-text transition w-full text-xs"
                    >
                      <option value="">{isRTL ? 'حدد العلامة التجارية' : 'Select Brand'}</option>
                      {brands.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    <PremiumInput 
                      type="text" 
                      placeholder={isRTL ? 'الوزن (مثال: ١ كجم)' : 'Weight (e.g. 1kg)'} 
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
                      placeholder={isRTL ? 'سعر التكلفة' : 'Cost Price'} 
                      value={tempCostPrice || ''}
                      onChange={(e) => setTempCostPrice(Number(e.target.value))}
                    />
                    <PremiumInput 
                      type="number" 
                      placeholder={isRTL ? 'سعر البيع المقترح' : 'Selling Price'} 
                      value={tempSellingPrice || ''}
                      onChange={(e) => setTempSellingPrice(Number(e.target.value))}
                    />
                  </div>

                  <PremiumInput 
                    type="text" 
                    placeholder={isRTL ? 'رابط الصورة' : 'Image URL'} 
                    value={tempImgUrl}
                    onChange={(e) => setTempImgUrl(e.target.value)}
                  />

                  <textarea 
                    placeholder={isRTL ? 'وصف قالب المنتج...' : 'Template description...'} 
                    value={tempDesc}
                    onChange={(e) => setTempDesc(e.target.value)}
                    className="w-full min-h-[80px] bg-theme-bg border border-theme-border/60 p-3 rounded-xl font-bold outline-none focus:border-primary text-theme-text text-xs transition"
                  />

                  <div className="flex gap-2 justify-end pt-2">
                    <PremiumButton variant="outline" size="sm" type="button" onClick={() => setShowAddTemplate(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</PremiumButton>
                    <PremiumButton variant="primary" size="sm" type="submit">{isRTL ? 'حفظ قالب البيانات' : 'Save Template'}</PremiumButton>
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
              <h3 className="font-black text-theme-text text-sm">{isRTL ? 'مركز استيراد وتصدير البيانات المجمع' : 'Bulk Excel & Sync Center'}</h3>
              <p className="text-[10px] text-theme-muted font-bold mt-0.5">{isRTL ? 'إدارة كتالوج المنصة وتحديث فروع التجار بضغطة واحدة' : 'Bulk manage inventory templates and sync partner stores'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sync Engine Card */}
            <PremiumCard hoverable={false} className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="text-primary animate-spin-slow" size={20} />
                <h4 className="font-black text-xs text-theme-text">{isRTL ? 'محرك المزامنة المجمع' : 'Platform Bulk Sync Engine'}</h4>
              </div>
              <p className="text-[10px] text-theme-muted leading-relaxed font-bold">
                {isRTL ? 'عند تعديل اسم المنتج، العلامة التجارية أو الصورة بالقالـب الأساسي، اضغط هنا لتعميم البيانات فوراً على جميع فروع المتاجر مع الاحتفاظ بأسعارهم ومخزونهم الخاص.' 
                       : 'Synchronize master modifications (names, brand, desc, images) to all merchant listings in real-time, preserving their unique selling prices, stock levels, and ratings.'}
              </p>
              <PremiumButton 
                onClick={handleBulkSyncCatalog} 
                isLoading={loading} 
                className="w-full"
                leftIcon={<RefreshCw size={14} />}
              >
                {isRTL ? 'مزامنة الكتالوج الموحد' : 'Sync Live Store Catalogs'}
              </PremiumButton>
            </PremiumCard>

            {/* Export Card */}
            <PremiumCard hoverable={false} className="p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Download className="text-primary" size={20} />
                  <h4 className="font-black text-xs text-theme-text">{isRTL ? 'تصدير القوالب الحالية' : 'Export Master Catalog'}</h4>
                </div>
                <p className="text-[10px] text-theme-muted leading-relaxed font-bold mt-2">
                  {isRTL ? 'قم بتصدير جميع قوالب السلع المسجلة على المنصة كملف إكسيل (.xlsx) لإجراء تعديلات خارجية.' 
                         : 'Download all master catalog product templates as a structured Excel ledger (.xlsx) for offline audits or batch updates.'}
                </p>
              </div>
              <PremiumButton 
                onClick={handleExportTemplates} 
                variant="outline"
                className="w-full mt-3"
                leftIcon={<Download size={14} />}
              >
                {isRTL ? 'تصدير إكسيل' : 'Export Templates'}
              </PremiumButton>
            </PremiumCard>
          </div>

          {/* Import Drag & Drop Card */}
          <PremiumCard hoverable={false} className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="text-primary" size={20} />
              <h4 className="font-black text-xs text-theme-text">{isRTL ? 'استيراد قوالب جماعية' : 'Import Product Templates (.xlsx)'}</h4>
            </div>
            
            <div className="border-2 border-dashed border-theme-border/60 hover:border-primary/45 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition relative">
              <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={handleImportExcel}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload size={28} className="text-theme-muted mb-2" />
              <span className="text-xs font-black text-theme-text">{isRTL ? 'اسحب ملف الإكسيل هنا أو تصفح الملفات' : 'Drag & Drop Excel file or browse'}</span>
              <span className="text-[9px] text-theme-muted font-bold mt-1">يجب مطابقة أعمدة: id, nameAr, nameEn, categoryId, categoryName, brand, barcode, sku, costPrice, sellingPrice</span>
            </div>

            {excelPreview.length > 0 && (
              <div className="space-y-3.5 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-theme-text">{isRTL ? `معاينة البيانات (${excelPreview.length} صنف جاهز)` : `Data Preview (${excelPreview.length} items ready)`}</span>
                  <div className="flex gap-2">
                    <PremiumButton variant="outline" size="sm" onClick={() => setExcelPreview([])}>{isRTL ? 'إلغاء' : 'Cancel'}</PremiumButton>
                    <PremiumButton variant="primary" size="sm" onClick={handleCommitExcelImports}>{isRTL ? 'حفظ وتأكيد الرفع' : 'Commit & Import'}</PremiumButton>
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
                      ... {isRTL ? `و ${excelPreview.length - 10} صنف إضافي` : `and ${excelPreview.length - 10} more rows`}
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
