import React, { useState } from 'react';
import { Plus, Trash2, Edit, Save, X, ClipboardList, Check, TrendingUp, History, Archive, AlertTriangle, Layers, FileSpreadsheet, Image as ImageIcon, Trash, ChevronDown, Loader2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Product } from '../../types/product.types';
import { ProductImport } from './ProductImport';
import { mediaService } from '../../services/media.service';

export const VendorProducts: React.FC = () => {
  const { products, setProducts, showToast, stockMovements, addStockMovement, isRTL } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'movements'>('inventory');
  
  // Modals state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingStockProduct, setAdjustingStockProduct] = useState<Product | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [cat, setCat] = useState('ألبان وأجبان');
  const [desc, setDesc] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [stock, setStock] = useState('50');
  const [threshold, setThreshold] = useState('10');
  
  // Real product specs
  const [productBrand, setProductBrand] = useState('');
  const [productWeight, setProductWeight] = useState('');
  const [unit, setUnit] = useState('جرام');
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'info' | 'media'>('info');


  // Stock Adjustment Form states
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'adjustment' | 'audit'>('in');
  const [adjustReason, setAdjustReason] = useState('توريد سلع جديدة');

  // Movements Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Multi select / Bulk actions state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState('ألبان وأجبان');
  const [bulkStockVal, setBulkStockVal] = useState('');
  const [showBulkCategoryMenu, setShowBulkCategoryMenu] = useState(false);
  const [showBulkStockMenu, setShowBulkStockMenu] = useState(false);

  // Filter products for Store g_1
  const storeProducts = products.filter(p => p.storeId === 'g_1');
  const storeMovements = stockMovements.filter(m => m.storeId === 'g_1');

  const filteredMovements = storeMovements.filter(m => {
    if (filterDate && new Date(m.createdAt).toDateString() !== new Date(filterDate).toDateString()) return false;
    if (filterProduct !== 'all' && m.productId !== filterProduct) return false;
    if (filterType !== 'all' && m.type !== filterType) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setName('');
    setPrice('');
    setPurchasePrice('');
    setCat('ألبان وأجبان');
    setDesc('');
    setSku(`SKU-${Math.floor(100000 + Math.random() * 900000)}`);
    setBarcode(`622${Math.floor(100000000 + Math.random() * 900000000)}`);
    setStock('50');
    setThreshold('10');
    setProductBrand('');
    setProductWeight('');
    setUnit('جرام');
    setProductImages([]);
    setActiveFormTab('info');
    setShowAddForm(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setPrice(p.price.toString());
    setPurchasePrice((p.purchasePrice || Math.round(p.price * 0.7)).toString());
    setCat(p.cat);
    setDesc(p.desc);
    setSku(p.sku || '');
    setBarcode(p.barcode || '');
    setThreshold((p.lowStockThreshold || 10).toString());
    setProductBrand(p.productBrand || '');
    setProductWeight(p.productWeight || '');
    setUnit(p.unit || 'جرام');
    setProductImages(p.galleryImages || p.images || (p.imgUrl ? [p.imgUrl] : []));
    setActiveFormTab('info');
  };

  const handleOpenAdjust = (p: Product) => {
    setAdjustingStockProduct(p);
    setAdjustQty('');
    setAdjustType('in');
    setAdjustReason('شراء وتوريد مخزون');
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true);
      try {
        const compressed = await mediaService.uploadImage(e.target.files[0]);
        setProductImages(prev => [...prev, compressed]);
        showToast(isRTL ? 'تم رفع الصورة وضغطها بنجاح' : 'Image uploaded & compressed');
      } catch (err: any) {
        alert(err.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemoveImage = (idx: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSetPrimaryImage = (idx: number) => {
    if (idx === 0) return;
    setProductImages(prev => {
      const copy = [...prev];
      const target = copy[idx];
      copy.splice(idx, 1);
      return [target, ...copy];
    });
    showToast(isRTL ? 'تم تعيين الصورة كصورة رئيسية' : 'Set as primary image');
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      alert(isRTL ? 'الرجاء إدخال اسم وسعر المنتج' : 'Please enter product name & price');
      return;
    }

    const priceNum = parseFloat(price);
    const pPriceNum = parseFloat(purchasePrice) || Math.round(priceNum * 0.7);
    const stockNum = parseInt(stock) || 0;
    const threshNum = parseInt(threshold) || 10;

    const newProd: Product = {
      id: `p_g_v_${Date.now()}`,
      storeId: 'g_1',
      cat,
      name,
      desc: desc || 'منتج جديد من البائع المعتمد',
      price: priceNum,
      purchasePrice: pPriceNum,
      costPrice: pPriceNum,
      profitMargin: priceNum > pPriceNum ? Math.round(((priceNum - pPriceNum) / priceNum) * 100) : 0,
      currentStock: stockNum,
      reservedStock: 0,
      lowStockThreshold: threshNum,
      sku: sku || `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
      barcode: barcode || `622${Math.floor(100000000 + Math.random() * 900000000)}`,
      productBrand,
      productWeight,
      unit,
      images: productImages,
      galleryImages: productImages,
      primaryImage: productImages[0] || '',
      imgUrl: productImages[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
      imageUrl: productImages[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
      availabilityStatus: stockNum === 0 ? 'out_of_stock' : stockNum <= threshNum ? 'low_stock' : 'in_stock',
      assetStatus: productImages[0] ? 'ready' : 'missing',
      syncStatus: 'synced',
      assetVersion: 1
    };

    setProducts(prev => [newProd, ...prev]);
    
    if (stockNum > 0) {
      addStockMovement(newProd.id, stockNum, 'Purchase', 'الرصيد الافتتاحي للمنتج');
    }

    showToast(isRTL ? 'تمت إضافة المنتج بنجاح' : 'Product created successfully');
    setShowAddForm(false);
  };

  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const priceNum = parseFloat(price);
    const pPriceNum = parseFloat(purchasePrice) || Math.round(priceNum * 0.7);
    const threshNum = parseInt(threshold) || 10;

    setProducts(prev => prev.map(p => {
      if (p.id === editingProduct.id) {
        const currentStock = p.currentStock || 0;
        const availabilityStatus = currentStock === 0 ? 'out_of_stock' : currentStock <= threshNum ? 'low_stock' : 'in_stock';
        return {
          ...p,
          name,
          price: priceNum,
          purchasePrice: pPriceNum,
          costPrice: pPriceNum,
          profitMargin: priceNum > pPriceNum ? Math.round(((priceNum - pPriceNum) / priceNum) * 100) : 0,
          cat,
          desc,
          sku,
          barcode,
          productBrand,
          productWeight,
          unit,
          images: productImages,
          galleryImages: productImages,
          primaryImage: productImages[0] || '',
          imgUrl: productImages[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
          imageUrl: productImages[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
          lowStockThreshold: threshNum,
          availabilityStatus,
          assetStatus: productImages[0] ? 'ready' : 'missing',
          syncStatus: p.syncStatus || 'synced'
        };
      }
      return p;
    }));

    showToast(isRTL ? 'تم حفظ التعديلات بنجاح' : 'Product details updated');
    setEditingProduct(null);
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingStockProduct) return;

    const qtyVal = parseInt(adjustQty);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      alert(isRTL ? 'الرجاء إدخال كمية صحيحة' : 'Please enter a valid quantity');
      return;
    }

    let diff = qtyVal;
    let type: 'Purchase' | 'Sale' | 'Return' | 'Damage' | 'Adjustment' | 'Transfer' = 'Adjustment';

    if (adjustType === 'out') {
      diff = -qtyVal;
      type = 'Damage'; // Assume damage or scrap
    } else if (adjustType === 'in') {
      type = 'Purchase';
    } else if (adjustType === 'audit') {
      const current = adjustingStockProduct.currentStock || 0;
      diff = qtyVal - current;
      type = 'Adjustment';
    }

    addStockMovement(adjustingStockProduct.id, diff, type, adjustReason);
    showToast(isRTL ? 'تم تعديل كمية المخزن وتسجيل المعاملة' : 'Stock quantity updated & logged');
    setAdjustingStockProduct(null);
  };

  const handleArchiveProduct = (id: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.availabilityStatus === 'archived' ? 'in_stock' : 'archived';
        return { ...p, availabilityStatus: nextStatus as any };
      }
      return p;
    }));
    showToast(isRTL ? 'تم تغيير حالة الأرشفة للمنتج' : 'Product archive status toggled');
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm(isRTL ? 'هل أنت متأكد من حذف هذا المنتج نهائياً؟' : 'Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast(isRTL ? 'تم حذف المنتج بنجاح' : 'Product deleted successfully');
    }
  };

  // Bulk Operations Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(storeProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(isRTL ? `هل أنت متأكد من حذف عدد ${selectedIds.length} منتج نهائياً؟` : `Are you sure you want to delete ${selectedIds.length} products?`)) {
      setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      showToast(isRTL ? 'تم حذف المنتجات المحددة' : 'Selected products deleted successfully');
    }
  };

  const handleBulkArchive = () => {
    setProducts(prev => prev.map(p => {
      if (selectedIds.includes(p.id)) {
        return {
          ...p,
          availabilityStatus: 'archived' as const
        };
      }
      return p;
    }));
    setSelectedIds([]);
    showToast(isRTL ? 'تم أرشفة المنتجات المحددة' : 'Selected products archived');
  };

  const handleBulkCategoryChange = () => {
    setProducts(prev => prev.map(p => {
      if (selectedIds.includes(p.id)) {
        return {
          ...p,
          cat: bulkCategory
        };
      }
      return p;
    }));
    setSelectedIds([]);
    setShowBulkCategoryMenu(false);
    showToast(isRTL ? 'تم تعديل أقسام المنتجات المحددة' : 'Bulk category updated');
  };

  const handleBulkStockUpdate = () => {
    const qtyVal = parseInt(bulkStockVal);
    if (isNaN(qtyVal) || qtyVal < 0) {
      alert(isRTL ? 'الرجاء إدخال كمية صحيحة' : 'Please enter a valid quantity');
      return;
    }

    setProducts(prev => prev.map(p => {
      if (selectedIds.includes(p.id)) {
        // Log movement
        addStockMovement(p.id, qtyVal - (p.currentStock || 0), 'Adjustment', isRTL ? 'تعديل مخزون جماعي' : 'Bulk stock adjustment');
        return {
          ...p,
          currentStock: qtyVal,
          availabilityStatus: qtyVal === 0 ? 'out_of_stock' as const : qtyVal <= (p.lowStockThreshold || 10) ? 'low_stock' as const : 'in_stock' as const
        };
      }
      return p;
    }));
    setSelectedIds([]);
    setBulkStockVal('');
    setShowBulkStockMenu(false);
    showToast(isRTL ? 'تم تحديث مخزون المنتجات المحددة' : 'Bulk stock updated');
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'out_of_stock': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'low_stock': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'archived': return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
      default: return 'text-green-500 bg-green-500/10 border-green-500/20';
    }
  };

  const getStatusBadgeLabel = (status?: string) => {
    switch (status) {
      case 'out_of_stock': return isRTL ? 'نفد المخزون' : 'Out of Stock';
      case 'low_stock': return isRTL ? 'مخزون منخفض' : 'Low Stock';
      case 'archived': return isRTL ? 'مؤرشف' : 'Archived';
      default: return isRTL ? 'متوفر' : 'In Stock';
    }
  };

  return (
    <div className="space-y-5 text-theme-text pb-20 relative">
      {/* Sub Tabs Bar */}
      <div className="flex border-b border-theme-border/60 pb-1.5 gap-4 text-xs font-black">
        <button 
          onClick={() => setActiveSubTab('inventory')}
          className={`pb-1 border-b-2 transition ${activeSubTab === 'inventory' ? 'border-primary text-primary' : 'border-transparent text-theme-muted hover:text-theme-text'}`}
        >
          {isRTL ? 'إدارة السلع والمستودع' : 'Inventory Warehouse'}
        </button>
        <button 
          onClick={() => setActiveSubTab('movements')}
          className={`pb-1 border-b-2 transition ${activeSubTab === 'movements' ? 'border-transparent text-theme-muted hover:text-theme-text' : 'border-primary text-primary'}`}
        >
          {isRTL ? 'حركة المعاملات والواردات' : 'Stock Movement Logs'}
        </button>
      </div>

      {activeSubTab === 'inventory' && (
        <div className="space-y-5">
          {/* Header Action Bar */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h3 className="font-black text-theme-text text-sm">{isRTL ? 'السلع المسجلة' : 'Registered Catalog Catalog'}</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowImportModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <FileSpreadsheet size={16} />
                {isRTL ? 'استيراد إكسل / CSV' : 'Import Excel/CSV'}
              </button>
              <button 
                onClick={handleOpenAdd}
                className="bg-primary hover:bg-primary-hover text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus size={16} strokeWidth={3} /> {isRTL ? 'إضافة منتج جديد' : 'Add New Item'}
              </button>
            </div>
          </div>

          {/* Selection Stats */}
          {selectedIds.length > 0 && (
            <div className="bg-theme-card p-3 rounded-2xl border border-primary/20 text-xs font-black text-primary flex justify-between items-center animate-fade-in theme-transition">
              <span>{isRTL ? `تم تحديد عدد ${selectedIds.length} سلعة` : `Selected ${selectedIds.length} items`}</span>
              <button onClick={() => setSelectedIds([])} className="text-[10px] underline">{isRTL ? 'إلغاء التحديد' : 'Deselect All'}</button>
            </div>
          )}

          {/* Products List Grid */}
          <div className="space-y-4">
            {storeProducts.length === 0 ? (
              <div className="bg-theme-card rounded-[24px] p-8 border border-theme-border text-center text-theme-muted font-bold shadow-sm theme-transition">
                <ClipboardList size={32} className="mx-auto mb-2 text-theme-muted" />
                <p className="text-xs">{isRTL ? 'لا توجد منتجات مسجلة حالياً في فرعك.' : 'No products found. Add or import your stock catalog.'}</p>
              </div>
            ) : (
              storeProducts.map(product => {
                const isSelected = selectedIds.includes(product.id);
                return (
                  <div 
                    key={product.id} 
                    className={`bg-theme-card rounded-[26px] p-4 border shadow-sm flex flex-col gap-3 relative theme-transition animate-card-entrance ${
                      isSelected ? 'border-primary/45 ring-2 ring-primary/10' : 'border-theme-border'
                    }`}
                  >
                    {/* Checkbox select */}
                    <div className="absolute top-4 left-4 z-10">
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(product.id)}
                        className="w-4 h-4 rounded border-theme-border text-primary focus:ring-primary cursor-pointer accent-primary" 
                      />
                    </div>

                    {/* Header card info */}
                    <div className="flex gap-3 pr-6">
                      <img src={product.imgUrl} className="w-14 h-14 rounded-xl object-cover bg-theme-bg border border-theme-border flex-shrink-0" alt={product.name} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-sm text-theme-text truncate pr-2">{product.name}</h4>
                        <p className="text-[10px] text-theme-muted font-bold mt-0.5">
                          {product.cat} • SKU: {product.sku} • {isRTL ? 'باركود' : 'Barcode'}: {product.barcode}
                        </p>
                        {product.productBrand && (
                          <p className="text-[9px] text-theme-muted font-bold mt-0.5">
                            {isRTL ? `الماركة: ${product.productBrand}` : `Brand: ${product.productBrand}`} • {product.productWeight} {product.unit}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${getStatusBadgeColor(product.availabilityStatus)}`}>
                            {getStatusBadgeLabel(product.availabilityStatus)}: {product.currentStock || 0}
                          </span>
                          <span className="text-[9px] font-black bg-blue-500/10 border border-blue-500/20 text-blue-600 px-2 py-0.5 rounded-lg">
                            {isRTL ? 'المحجوز' : 'Reserved'}: {product.reservedStock || 0}
                          </span>
                          {product.currentStock !== undefined && product.currentStock <= (product.lowStockThreshold || 10) && product.availabilityStatus !== 'archived' && (
                            <span className="text-[9px] font-black text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-lg flex items-center gap-0.5 animate-pulse">
                              <AlertTriangle size={10} /> {isRTL ? 'كمية حرجة' : 'Critical Stock'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer price and actions */}
                    <div className="flex justify-between items-center pt-3 border-t border-theme-border/60 text-xs">
                      <div className="flex gap-4">
                        <div>
                          <span className="text-[9px] text-theme-muted block font-bold">{isRTL ? 'التكلفة' : 'Cost'}</span>
                          <span className="font-bold text-theme-text">{product.costPrice || product.purchasePrice || Math.round(product.price * 0.7)} ج.م</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-theme-muted block font-bold">{isRTL ? 'سعر البيع' : 'Selling'}</span>
                          <span className="font-black text-primary">{product.price} ج.م</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-theme-muted block font-bold">{isRTL ? 'الهامش' : 'Margin'}</span>
                          <span className="font-bold text-green-600">
                            %{product.profitMargin !== undefined ? product.profitMargin : (product.price > (product.costPrice || product.purchasePrice || 0) ? Math.round(((product.price - (product.costPrice || product.purchasePrice || 0)) / product.price) * 100) : 0)}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleOpenAdjust(product)}
                          className="px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl font-black text-[10px] hover:bg-blue-500/20 transition"
                        >
                          {isRTL ? 'تعديل المخزن' : 'Adjust Stock'}
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 bg-theme-bg border border-theme-border rounded-xl text-theme-text hover:bg-theme-border-hover hover:text-primary transition"
                        >
                          <Edit size={12} />
                        </button>
                        <button 
                          onClick={() => handleArchiveProduct(product.id)}
                          className={`p-1.5 border rounded-xl transition ${
                            product.availabilityStatus === 'archived' 
                              ? 'bg-amber-500/20 border-amber-500/30 text-amber-500' 
                              : 'bg-theme-bg border-theme-border text-theme-muted hover:bg-theme-border-hover'
                          }`}
                        >
                          <Archive size={12} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500/20 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'movements' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-theme-text text-sm flex items-center gap-2">
              <History size={16} className="text-primary" />
              {isRTL ? 'سجل حركة السلع بالمخازن' : 'Stock Movements History Ledger'}
            </h3>
          </div>

          {/* Filters Bar */}
          <div className="bg-theme-card p-4 rounded-[24px] border border-theme-border shadow-sm grid grid-cols-3 gap-2.5 theme-transition">
            <div>
              <label className="text-[8px] font-black text-theme-muted block mb-1">تصفية بالتاريخ</label>
              <input 
                type="date" 
                value={filterDate} 
                onChange={e => setFilterDate(e.target.value)} 
                className="w-full bg-theme-bg border border-theme-border rounded-xl p-2 text-[10px] font-bold outline-none text-theme-text focus:border-primary" 
              />
            </div>
            <div>
              <label className="text-[8px] font-black text-theme-muted block mb-1">تصفية بالمنتج</label>
              <select 
                value={filterProduct} 
                onChange={e => setFilterProduct(e.target.value)} 
                className="w-full bg-theme-bg border border-theme-border rounded-xl p-2 text-[10px] font-bold outline-none text-theme-text focus:border-primary"
              >
                <option value="all" className="bg-theme-card text-theme-text">كل السلع</option>
                {storeProducts.map(p => (
                  <option key={p.id} value={p.id} className="bg-theme-card text-theme-text">{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[8px] font-black text-theme-muted block mb-1">تصفية بنوع الحركة</label>
              <select 
                value={filterType} 
                onChange={e => setFilterType(e.target.value)} 
                className="w-full bg-theme-bg border border-theme-border rounded-xl p-2 text-[10px] font-bold outline-none text-theme-text focus:border-primary"
              >
                <option value="all" className="bg-theme-card text-theme-text">كل الأنواع</option>
                {['Purchase', 'Sale', 'Return', 'Damage', 'Adjustment', 'Transfer'].map(t => (
                  <option key={t} value={t} className="bg-theme-card text-theme-text">{t}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            {filteredMovements.length === 0 ? (
              <p className="text-xs text-theme-muted text-center py-6 font-bold">لا توجد عمليات مخزن تطابق التصفية</p>
            ) : (
              filteredMovements.map(mov => (
                <div key={mov.id} className="bg-theme-card p-4 rounded-2xl border border-theme-border shadow-sm flex justify-between items-center text-xs font-bold theme-transition">
                  <div>
                    <h4 className="font-black text-theme-text">{mov.productName}</h4>
                    <p className="text-[10px] text-theme-muted font-bold mt-1">
                      {mov.reason} • نوع الحركة: {mov.type}
                    </p>
                    <p className="text-[8px] text-theme-muted font-bold mt-0.5">
                      {new Date(mov.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                    mov.quantity > 0 
                      ? 'bg-green-500/10 text-green-500 border-green-500/20'
                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}>
                    {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating Bulk Operations Toolbar */}
      {selectedIds.length > 0 && activeSubTab === 'inventory' && (
        <div className="fixed bottom-[max(4.5rem,env(safe-area-inset-bottom)+3.5rem)] left-4 right-4 bg-theme-card/95 backdrop-blur border border-primary/20 shadow-2xl p-4 rounded-3xl flex flex-wrap items-center justify-between gap-3 z-50 theme-transition animate-slide-up">
          <div className="flex items-center gap-2">
            <Layers className="text-primary animate-pulse" size={16} />
            <span className="font-black text-xs text-theme-text">
              {isRTL ? `العمليات الجماعية على ${selectedIds.length} منتج` : `Bulk Actions (${selectedIds.length} items)`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Change */}
            <div className="relative">
              <button 
                onClick={() => { setShowBulkCategoryMenu(!showBulkCategoryMenu); setShowBulkStockMenu(false); }}
                className="bg-theme-bg border border-theme-border text-theme-text font-black px-3 py-2 rounded-xl text-[10px] flex items-center gap-1 hover:bg-theme-border transition"
              >
                {isRTL ? 'تعديل القسم جماعياً' : 'Set Category'}
                <ChevronDown size={12} />
              </button>
              {showBulkCategoryMenu && (
                <div className="absolute bottom-11 right-0 bg-theme-card border border-theme-border p-3.5 rounded-2xl shadow-xl w-48 space-y-2.5 z-[60] theme-transition">
                  <label className="text-[9px] font-black text-theme-muted block">{isRTL ? 'اختر القسم الجديد' : 'Select Category'}</label>
                  <select 
                    value={bulkCategory} 
                    onChange={e => setBulkCategory(e.target.value)}
                    className="w-full bg-theme-bg border border-theme-border rounded-xl p-2 text-[10px] font-bold outline-none text-theme-text focus:border-primary"
                  >
                    {['ألبان وأجبان', 'سناكس وشيبسي', 'مشروبات', 'مخبوزات', 'منظفات', 'معلبات'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleBulkCategoryChange}
                    className="w-full bg-primary text-white text-[9px] font-black py-2 rounded-xl"
                  >
                    {isRTL ? 'تطبيق التعديل' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* Stock Quantity Update */}
            <div className="relative">
              <button 
                onClick={() => { setShowBulkStockMenu(!showBulkStockMenu); setShowBulkCategoryMenu(false); }}
                className="bg-theme-bg border border-theme-border text-theme-text font-black px-3 py-2 rounded-xl text-[10px] flex items-center gap-1 hover:bg-theme-border transition"
              >
                {isRTL ? 'تعديل الكمية جماعياً' : 'Update Stock'}
                <ChevronDown size={12} />
              </button>
              {showBulkStockMenu && (
                <div className="absolute bottom-11 right-0 bg-theme-card border border-theme-border p-3.5 rounded-2xl shadow-xl w-48 space-y-2.5 z-[60] theme-transition">
                  <label className="text-[9px] font-black text-theme-muted block">{isRTL ? 'الكمية الجديدة للمخزن' : 'New Stock Quantity'}</label>
                  <input 
                    type="number" 
                    value={bulkStockVal} 
                    onChange={e => setBulkStockVal(e.target.value)} 
                    placeholder="0"
                    className="w-full bg-theme-bg border border-theme-border rounded-xl p-2 text-[10px] font-bold outline-none text-theme-text focus:border-primary" 
                  />
                  <button 
                    onClick={handleBulkStockUpdate}
                    className="w-full bg-primary text-white text-[9px] font-black py-2 rounded-xl"
                  >
                    {isRTL ? 'تطبيق التعديل' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={handleBulkArchive}
              className="bg-amber-500/10 border border-amber-500/20 text-amber-500 font-black px-3 py-2 rounded-xl text-[10px] hover:bg-amber-500/20 transition flex items-center gap-1"
            >
              <Archive size={12} />
              {isRTL ? 'أرشفة المحددة' : 'Archive'}
            </button>
            
            <button 
              onClick={handleBulkDelete}
              className="bg-red-500/10 border border-red-500/20 text-red-500 font-black px-3 py-2 rounded-xl text-[10px] hover:bg-red-500/20 transition flex items-center gap-1"
            >
              <Trash2 size={12} />
              {isRTL ? 'حذف المحددة' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      {/* Add Product Modal Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-fade-in">
          <form 
            onSubmit={handleAddProduct}
            className="bg-theme-card border border-theme-border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto no-scrollbar theme-transition"
          >
            <div className="flex justify-between items-center pb-2 border-b border-theme-border">
              <h4 className="font-black text-theme-text text-sm">{isRTL ? 'إضافة منتج جديد' : 'Add New Product'}</h4>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-theme-muted hover:text-theme-text"><X size={20} /></button>
            </div>

            {/* Tabs Bar */}
            <div className="flex border-b border-theme-border pb-1 gap-4 text-xs font-black">
              <button
                type="button"
                onClick={() => setActiveFormTab('info')}
                className={`pb-1 border-b-2 transition ${activeFormTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-theme-muted hover:text-theme-text'}`}
              >
                {isRTL ? 'البيانات الأساسية' : 'Basic Info'}
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('media')}
                className={`pb-1 border-b-2 transition ${activeFormTab === 'media' ? 'border-primary text-primary' : 'border-transparent text-theme-muted hover:text-theme-text'}`}
              >
                {isRTL ? 'الوسائط والصور' : 'Product Media'}
              </button>
            </div>

            {activeFormTab === 'info' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'اسم المنتج' : 'Product Name'}</label>
                  <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder={isRTL ? 'حليب جهينة 1 لتر' : 'Product Name'} />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'الماركة' : 'Brand'}</label>
                    <input type="text" value={productBrand} onChange={e=>setProductBrand(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-2.5 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder={isRTL ? 'جهينة' : 'e.g. Nestle'} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'الوزن' : 'Weight'}</label>
                    <input type="text" value={productWeight} onChange={e=>setProductWeight(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-2.5 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="1000" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'الوحدة' : 'Unit'}</label>
                    <select value={unit} onChange={e=>setUnit(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-2.5 text-xs font-bold outline-none focus:border-primary text-theme-text">
                      <option value="جرام">{isRTL ? 'جرام' : 'g'}</option>
                      <option value="كيلو">{isRTL ? 'كجم' : 'kg'}</option>
                      <option value="مل">{isRTL ? 'مل' : 'ml'}</option>
                      <option value="لتر">{isRTL ? 'لتر' : 'L'}</option>
                      <option value="وحدة">{isRTL ? 'وحدة' : 'Unit'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'سعر الشراء / التكلفة (ج.م)' : 'Cost Price'}</label>
                    <input type="number" value={purchasePrice} onChange={e=>setPurchasePrice(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="30" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'سعر البيع للعميل (ج.م)' : 'Sell Price'}</label>
                    <input type="number" value={price} onChange={e=>setPrice(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="42" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'الرصيد الافتتاحي' : 'Opening Stock'}</label>
                    <input type="number" value={stock} onChange={e=>setStock(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'حد الخطر (تنبيه المخزون)' : 'Low Stock Alarm'}</label>
                    <input type="number" value={threshold} onChange={e=>setThreshold(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="10" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">رمز SKU</label>
                    <input type="text" value={sku} onChange={e=>setSku(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="SKU-XXXX" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'رقم الباركود' : 'Barcode EAN'}</label>
                    <input type="text" value={barcode} onChange={e=>setBarcode(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="622XXXXXXXX" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'القسم' : 'Category Tag'}</label>
                  <select value={cat} onChange={e=>setCat(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text">
                    {['ألبان وأجبان', 'سناكس وشيبسي', 'مشروبات', 'مخبوزات', 'منظفات', 'معلبات'].map(c => (
                      <option key={c} value={c} className="bg-theme-card text-theme-text">{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'الوصف التفصيلي للسلعة' : 'Product Description'}</label>
                  <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary h-16 resize-none text-theme-text" placeholder="المواصفات وتفاصيل العبوة..." />
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in py-2">
                <div className="flex justify-between items-center bg-theme-bg p-3 rounded-2xl border border-theme-border">
                  <span className="text-[10px] font-black text-theme-muted uppercase">{isRTL ? 'حالة الصورة والوسائط' : 'Media Asset Status'}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${productImages.length > 0 ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20'}`}>
                    {productImages.length > 0 ? (isRTL ? 'جاهز' : 'Ready') : (isRTL ? 'مفقود' : 'Missing')}
                  </span>
                </div>

                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-theme-border hover:border-primary rounded-3xl p-6 text-center transition bg-theme-bg/10 relative cursor-pointer group"
                >
                  <input 
                    type="file" 
                    multiple
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={handleImageUpload} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                  <ImageIcon size={28} className="mx-auto mb-2 text-theme-muted group-hover:text-primary transition" />
                  <p className="text-xs font-black text-theme-text">{isRTL ? 'اسحب الصور هنا أو اضغط للاختيار' : 'Drag & Drop Images Here'}</p>
                  <p className="text-[9px] font-bold text-theme-muted mt-1">{isRTL ? 'يدعم JPEG, PNG, WebP حتى 5 ميجابايت (تلقائياً WebP)' : 'Supports JPEG, PNG, WebP up to 5MB (auto WebP)'}</p>
                </div>

                {uploading && (
                  <div className="flex items-center gap-2 justify-center text-[10px] text-primary font-black animate-pulse">
                    <Loader2 size={12} className="animate-spin" />
                    <span>{isRTL ? 'جاري ضغط ورفع الصور...' : 'Uploading & processing images...'}</span>
                  </div>
                )}

                {productImages.length > 0 ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-theme-muted block">{isRTL ? 'الصور الحالية (اضغط لتغيير الترتيب)' : 'Active Images (Click to reorder)'}</label>
                    <div className="grid grid-cols-4 gap-2.5">
                      {productImages.map((imgUrl, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border border-theme-border bg-theme-bg">
                          <img src={imgUrl} className="w-full h-full object-cover" alt="Gallery thumb" />
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 z-10">
                            {idx > 0 && (
                              <button 
                                type="button" 
                                onClick={() => handleSetPrimaryImage(idx)}
                                className="p-1 bg-green-500 hover:scale-105 rounded text-white" 
                                title={isRTL ? 'تعيين كرئيسية' : 'Set Cover'}
                              >
                                <Check size={8} />
                              </button>
                            )}
                            <button 
                              type="button" 
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1 bg-red-500 hover:scale-105 rounded text-white"
                              title={isRTL ? 'حذف' : 'Delete'}
                            >
                              <Trash size={8} />
                            </button>
                          </div>
                          {idx === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-primary text-[7px] font-black text-white text-center leading-tight py-0.5 z-10">
                              {isRTL ? 'الرئيسية' : 'Primary'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-theme-border/60 rounded-2xl bg-theme-bg/5">
                    <p className="text-[11px] text-theme-muted font-bold">{isRTL ? 'لم يتم رفع صور لهذا المنتج بعد' : 'No images added yet'}</p>
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-black py-3.5 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"><Check size={16} strokeWidth={3} /> {isRTL ? 'حفظ وتأكيد السلعة' : 'Save & Publish Product'}</button>
          </form>
        </div>
      )}

      {/* Edit Product Modal Overlay */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-fade-in">
          <form 
            onSubmit={handleEditProduct}
            className="bg-theme-card border border-theme-border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto no-scrollbar theme-transition"
          >
            <div className="flex justify-between items-center pb-2 border-b border-theme-border">
              <h4 className="font-black text-theme-text text-sm">{isRTL ? 'تعديل بيانات المنتج' : 'Edit Product details'}</h4>
              <button type="button" onClick={() => setEditingProduct(null)} className="text-theme-muted hover:text-theme-text"><X size={20} /></button>
            </div>

            {/* Tabs Bar */}
            <div className="flex border-b border-theme-border pb-1 gap-4 text-xs font-black">
              <button
                type="button"
                onClick={() => setActiveFormTab('info')}
                className={`pb-1 border-b-2 transition ${activeFormTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-theme-muted hover:text-theme-text'}`}
              >
                {isRTL ? 'البيانات الأساسية' : 'Basic Info'}
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('media')}
                className={`pb-1 border-b-2 transition ${activeFormTab === 'media' ? 'border-primary text-primary' : 'border-transparent text-theme-muted hover:text-theme-text'}`}
              >
                {isRTL ? 'الوسائط والصور' : 'Product Media'}
              </button>
            </div>

            {activeFormTab === 'info' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'اسم المنتج' : 'Product Name'}</label>
                  <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="اسم المنتج" />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'الماركة' : 'Brand'}</label>
                    <input type="text" value={productBrand} onChange={e=>setProductBrand(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-2.5 text-xs font-bold outline-none focus:border-primary text-theme-text" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'الوزن' : 'Weight'}</label>
                    <input type="text" value={productWeight} onChange={e=>setProductWeight(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-2.5 text-xs font-bold outline-none focus:border-primary text-theme-text" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'الوحدة' : 'Unit'}</label>
                    <select value={unit} onChange={e=>setUnit(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-2.5 text-xs font-bold outline-none focus:border-primary text-theme-text">
                      <option value="جرام">{isRTL ? 'جرام' : 'g'}</option>
                      <option value="كيلو">{isRTL ? 'كجم' : 'kg'}</option>
                      <option value="مل">{isRTL ? 'مل' : 'ml'}</option>
                      <option value="لتر">{isRTL ? 'لتر' : 'L'}</option>
                      <option value="وحدة">{isRTL ? 'وحدة' : 'Unit'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'سعر الشراء (ج.م)' : 'Cost Price'}</label>
                    <input type="number" value={purchasePrice} onChange={e=>setPurchasePrice(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="شراء" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'سعر البيع (ج.م)' : 'Sell Price'}</label>
                    <input type="number" value={price} onChange={e=>setPrice(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="بيع" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">رمز SKU</label>
                    <input type="text" value={sku} onChange={e=>setSku(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'حد الخطر (تنبيه المخزون)' : 'Low Stock Alarm'}</label>
                    <input type="number" value={threshold} onChange={e=>setThreshold(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'رقم الباركود' : 'Barcode EAN'}</label>
                  <input type="text" value={barcode} onChange={e=>setBarcode(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'القسم' : 'Category Tag'}</label>
                  <select value={cat} onChange={e=>setCat(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text">
                    {['ألبان وأجبان', 'سناكس وشيبسي', 'مشروبات', 'مخبوزات', 'منظفات', 'معلبات'].map(c => (
                      <option key={c} value={c} className="bg-theme-card text-theme-text">{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'الوصف' : 'Description'}</label>
                  <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary h-16 resize-none text-theme-text" placeholder="وصف السلعة..." />
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in py-2">
                <div className="flex justify-between items-center bg-theme-bg p-3 rounded-2xl border border-theme-border">
                  <span className="text-[10px] font-black text-theme-muted uppercase">{isRTL ? 'حالة الصورة والوسائط' : 'Media Asset Status'}</span>
                  <div className="flex gap-2 items-center">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${productImages.length > 0 ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20'}`}>
                      {productImages.length > 0 ? (isRTL ? 'جاهز' : 'Ready') : (isRTL ? 'مفقود' : 'Missing')}
                    </span>
                    {editingProduct.syncStatus === 'outdated' && (
                      <span className="text-[9px] font-black bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded-lg animate-pulse">
                        {isRTL ? 'تحديث معلق' : 'Needs Update'}
                      </span>
                    )}
                  </div>
                </div>

                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-theme-border hover:border-primary rounded-3xl p-6 text-center transition bg-theme-bg/10 relative cursor-pointer group"
                >
                  <input 
                    type="file" 
                    multiple
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={handleImageUpload} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                  <ImageIcon size={28} className="mx-auto mb-2 text-theme-muted group-hover:text-primary transition" />
                  <p className="text-xs font-black text-theme-text">{isRTL ? 'اسحب الصور هنا أو اضغط للاختيار' : 'Drag & Drop Images Here'}</p>
                  <p className="text-[9px] font-bold text-theme-muted mt-1">{isRTL ? 'يدعم JPEG, PNG, WebP حتى 5 ميجابايت (تلقائياً WebP)' : 'Supports JPEG, PNG, WebP up to 5MB (auto WebP)'}</p>
                </div>

                {uploading && (
                  <div className="flex items-center gap-2 justify-center text-[10px] text-primary font-black animate-pulse">
                    <Loader2 size={12} className="animate-spin" />
                    <span>{isRTL ? 'جاري ضغط ورفع الصور...' : 'Uploading & processing images...'}</span>
                  </div>
                )}

                {productImages.length > 0 ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-theme-muted block">{isRTL ? 'الصور الحالية (اضغط لتغيير الترتيب)' : 'Active Images (Click to reorder)'}</label>
                    <div className="grid grid-cols-4 gap-2.5">
                      {productImages.map((imgUrl, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border border-theme-border bg-theme-bg">
                          <img src={imgUrl} className="w-full h-full object-cover" alt="Gallery thumb" />
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 z-10">
                            {idx > 0 && (
                              <button 
                                type="button" 
                                onClick={() => handleSetPrimaryImage(idx)}
                                className="p-1 bg-green-500 hover:scale-105 rounded text-white" 
                                title={isRTL ? 'تعيين كرئيسية' : 'Set Cover'}
                              >
                                <Check size={8} />
                              </button>
                            )}
                            <button 
                              type="button" 
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1 bg-red-500 hover:scale-105 rounded text-white"
                              title={isRTL ? 'حذف' : 'Delete'}
                            >
                              <Trash size={8} />
                            </button>
                          </div>
                          {idx === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-primary text-[7px] font-black text-white text-center leading-tight py-0.5 z-10">
                              {isRTL ? 'الرئيسية' : 'Primary'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-theme-border/60 rounded-2xl bg-theme-bg/5">
                    <p className="text-[11px] text-theme-muted font-bold">{isRTL ? 'لم يتم رفع صور لهذا المنتج بعد' : 'No images added yet'}</p>
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-black py-3.5 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"><Check size={16} strokeWidth={3} /> {isRTL ? 'حفظ التعديلات' : 'Save Changes'}</button>
          </form>
        </div>
      )}

      {/* Stock Adjustment Modal Overlay */}
      {adjustingStockProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-fade-in">
          <form 
            onSubmit={handleAdjustStock}
            className="bg-theme-card border border-theme-border rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-slide-up theme-transition"
          >
            <div className="flex justify-between items-center pb-2 border-b border-theme-border">
              <div>
                <h4 className="font-black text-theme-text text-sm">{isRTL ? 'تعديل مخزون السلعة' : 'Adjust Stock'}</h4>
                <p className="text-[10px] text-theme-muted font-bold mt-0.5">{adjustingStockProduct.name}</p>
              </div>
              <button type="button" onClick={() => setAdjustingStockProduct(null)} className="text-theme-muted hover:text-theme-text"><X size={20} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'نوع المعاملة' : 'Transaction Type'}</label>
                <select 
                  value={adjustType} 
                  onChange={e=>setAdjustType(e.target.value as any)} 
                  className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text"
                >
                  <option value="in" className="bg-theme-card text-theme-text">{isRTL ? 'إضافة مخزون (+)' : 'Add Stock (+)'}</option>
                  <option value="out" className="bg-theme-card text-theme-text">{isRTL ? 'سحب مخزون (-)' : 'Deduct Stock (-)'}</option>
                  <option value="adjustment" className="bg-theme-card text-theme-text">{isRTL ? 'تسوية يدوية' : 'Manual Adjustment'}</option>
                  <option value="audit" className="bg-theme-card text-theme-text">{isRTL ? 'جرد دوري للمخزن' : 'Periodical Stock Audit'}</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'الكمية' : 'Quantity'}</label>
                <input 
                  type="number" 
                  value={adjustQty} 
                  onChange={e=>setAdjustQty(e.target.value)} 
                  className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" 
                  placeholder={isRTL ? 'أدخل عدد الوحدات' : 'Units count'} 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{isRTL ? 'السبب / الملاحظة' : 'Audit Reason'}</label>
                <input 
                  type="text" 
                  value={adjustReason} 
                  onChange={e=>setAdjustReason(e.target.value)} 
                  className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" 
                  placeholder={isRTL ? 'مثال: توريد شحنة جديدة' : 'e.g. New stock delivery'} 
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-black py-3.5 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5">
              {isRTL ? 'تحديث وحفظ المعاملة' : 'Update Stock Quantity'}
            </button>
          </form>
        </div>
      )}

      {/* Spreadsheet excel importer overlay */}
      {showImportModal && (
        <ProductImport onClose={() => setShowImportModal(false)} />
      )}
    </div>
  );
};

export default VendorProducts;
