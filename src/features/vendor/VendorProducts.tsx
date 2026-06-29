import { useTranslation } from '../../hooks/useTranslation';
import React, { useState } from 'react';
import { Plus, Trash2, Edit, Save, X, ClipboardList, Check, TrendingUp, History, Archive, AlertTriangle, Layers, FileSpreadsheet, Image as ImageIcon, Trash, ChevronDown, Loader2, Package } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useProducts } from '../../hooks/useProducts';
import { Product } from '../../types/product.types';
import { ProductImport } from './ProductImport';
import { mediaService } from '../../services/media.service';
import { VendorTemplatePicker } from './VendorTemplatePicker';
import { doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';

import { mockService } from '../../services/mock.service';
import { productRepository } from "../../services/inventory/repository";

export const VendorProducts: React.FC = () => {
  const { t } = useTranslation();
  const { showToast, stockMovements, addStockMovement, isRTL, currentUser } = useApp();
  const { products } = useProducts();
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'movements'>('inventory');
  
  // Modals state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingStockProduct, setAdjustingStockProduct] = useState<Product | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

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

  const handleDragOver = (e: React.DragEvent) => {
  const {} = useTranslation();

    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageUpload({ target: { files: e.dataTransfer.files } } as any);
    }
  };


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

  // Filter products for Store
  const storeProducts = products.filter(p => p.storeId === currentUser?.storeId);
  const storeMovements = stockMovements.filter(m => m.storeId === currentUser?.storeId);

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
    setSku(mockService.generateSku());
    setBarcode(mockService.generateBarcode());
    setStock('50');
    setThreshold('10');
    setProductBrand('');
    setProductWeight('');
    setUnit('جرام');
    setProductImages([]);
    setActiveFormTab('info');
    setShowAddForm(true);
  };

  const handleSelectTemplate = (template: any) => {
    setShowTemplatePicker(false);
    
    setName(isRTL ? template.nameAr : template.nameEn);
    setPrice(''); // Force vendor to enter price
    setPurchasePrice('');
    setCat(isRTL ? template.category : (template.categoryEn || template.category));
    setDesc(isRTL ? (template.descriptionAr || '') : (template.descriptionEn || ''));
    setSku(template.sku || mockService.generateSku());
    setBarcode(template.barcode || mockService.generateBarcode());
    setStock('50');
    setThreshold('10');
    setProductBrand(isRTL ? template.brand : (template.brandEn || template.brand));
    setProductWeight(template.weight || '');
    setUnit(template.unit || 'قطعة');
    setProductImages(template.imageUrl ? [template.imageUrl] : (template.fallbackImageUrl ? [template.fallbackImageUrl] : []));
    
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
        showToast(t('str_894'));
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
    showToast(t('str_895'));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      alert(t('str_896'));
      return;
    }

    const priceNum = parseFloat(price);
    const pPriceNum = parseFloat(purchasePrice) || Math.round(priceNum * 0.7);
    const stockNum = parseInt(stock) || 0;
    const threshNum = parseInt(threshold) || 10;

    const newProd: Product = {
      id: `p_g_v_${Date.now()}`,
      storeId: currentUser?.storeId || '',
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
      sku: sku || mockService.generateSku(),
      barcode: barcode || mockService.generateBarcode(),
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

    try {
      await productRepository.create(newProd.id, newProd);
      if (stockNum > 0) {
        addStockMovement(newProd.id, stockNum, 'Purchase', 'الرصيد الافتتاحي للمنتج');
      }
      showToast(t('str_897'));
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ', 'error');
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const priceNum = parseFloat(price);
    const pPriceNum = parseFloat(purchasePrice) || Math.round(priceNum * 0.7);
    const threshNum = parseInt(threshold) || 10;

    try {
      const currentStock = editingProduct.currentStock || 0;
      const availabilityStatus = currentStock === 0 ? 'out_of_stock' : currentStock <= threshNum ? 'low_stock' : 'in_stock';
      
      await productRepository.update(editingProduct.id, {
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
        syncStatus: editingProduct.syncStatus || 'synced'
      });
      showToast(t('str_219'));
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ', 'error');
    }
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingStockProduct) return;

    const qtyVal = parseInt(adjustQty);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      alert(t('str_898'));
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
    showToast(t('str_899'));
    setAdjustingStockProduct(null);
  };

  const handleArchiveProduct = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      try {
        const nextStatus = product.availabilityStatus === 'archived' ? 'in_stock' : 'archived';
        await productRepository.update(id, { availabilityStatus: nextStatus });
        showToast(t('str_900'));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm(t('str_901'))) {
      try {
        await productRepository.delete(id);
        showToast(t('str_902'));
      } catch (err) {
        console.error(err);
      }
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

  const handleBulkDelete = async () => {
    if (confirm(t('str_903'))) {
      try {
        await import('../../services/vendor/service').then(m => m.vendorService.bulkDeleteProducts(selectedIds));
        setSelectedIds([]);
        showToast(t('str_904'));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleBulkArchive = async () => {
    try {
      await import('../../services/vendor/service').then(m => m.vendorService.bulkArchiveProducts(selectedIds));
      setSelectedIds([]);
      showToast(t('str_905'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkCategoryChange = async () => {
    try {
      await import('../../services/vendor/service').then(m => m.vendorService.bulkUpdateCategory(selectedIds, bulkCategory));
      setSelectedIds([]);
      setShowBulkCategoryMenu(false);
      showToast(t('str_906'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkStockUpdate = async () => {
    const qtyVal = parseInt(bulkStockVal);
    if (isNaN(qtyVal) || qtyVal < 0) {
      alert(t('str_898'));
      return;
    }

    try {
      const updates = selectedIds.map(id => {
        const product = products.find(p => p.id === id);
        if (product) {
          addStockMovement(id, qtyVal - (product.currentStock || 0), 'Adjustment', t('str_907'));
        }
        const availabilityStatus = qtyVal === 0 ? 'out_of_stock' : qtyVal <= ((product?.lowStockThreshold) || 10) ? 'low_stock' : 'in_stock';
        return { id, currentStock: qtyVal, availabilityStatus };
      });
      await import('../../services/vendor/service').then(m => m.vendorService.bulkUpdateStock(updates));
      
      setSelectedIds([]);
      setBulkStockVal('');
      setShowBulkStockMenu(false);
      showToast(t('str_908'));
    } catch (err) {
      console.error(err);
    }
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
      case 'out_of_stock': return t('str_909');
      case 'low_stock': return t('str_910');
      case 'archived': return t('str_911');
      default: return t('str_912');
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
          {t('str_913')}
        </button>
        <button 
          onClick={() => setActiveSubTab('movements')}
          className={`pb-1 border-b-2 transition ${activeSubTab === 'movements' ? 'border-transparent text-theme-muted hover:text-theme-text' : 'border-primary text-primary'}`}
        >
          {t('str_914')}
        </button>
      </div>

      {activeSubTab === 'inventory' && (
        <div className="space-y-5">
          {/* Header Action Bar */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h3 className="font-black text-theme-text text-sm">{t('str_915')}</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowImportModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <FileSpreadsheet size={16} />
                {t('str_916')}
              </button>
              <button 
                onClick={() => setShowTemplatePicker(true)}
                className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Package size={16} /> {t('addFromCatalog')}
              </button>
              <button 
                onClick={handleOpenAdd}
                className="bg-primary hover:bg-primary-hover text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus size={16} strokeWidth={3} /> {t('str_917')}
              </button>
            </div>
          </div>

          {/* Selection Stats */}
          {selectedIds.length > 0 && (
            <div className="bg-theme-card p-3 rounded-2xl border border-primary/20 text-xs font-black text-primary flex justify-between items-center animate-fade-in theme-transition">
              <span>{t('str_918')}</span>
              <button onClick={() => setSelectedIds([])} className="text-[10px] underline">{t('str_919')}</button>
            </div>
          )}

          {/* Products List Grid */}
          <div className="space-y-4">
            {storeProducts.length === 0 ? (
              <div className="bg-theme-card rounded-[24px] p-8 border border-theme-border text-center text-theme-muted font-bold shadow-sm theme-transition">
                <ClipboardList size={32} className="mx-auto mb-2 text-theme-muted" />
                <p className="text-xs">{t('str_920')}</p>
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
                          {product.cat} • SKU: {product.sku} • {t('str_921')}: {product.barcode}
                        </p>
                        {product.productBrand && (
                          <p className="text-[9px] text-theme-muted font-bold mt-0.5">
                            {t('str_922')} • {product.productWeight} {product.unit}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${getStatusBadgeColor(product.availabilityStatus)}`}>
                            {getStatusBadgeLabel(product.availabilityStatus)}: {product.currentStock || 0}
                          </span>
                          <span className="text-[9px] font-black bg-blue-500/10 border border-blue-500/20 text-blue-600 px-2 py-0.5 rounded-lg">
                            {t('str_923')}: {product.reservedStock || 0}
                          </span>
                          {product.currentStock !== undefined && product.currentStock <= (product.lowStockThreshold || 10) && product.availabilityStatus !== 'archived' && (
                            <span className="text-[9px] font-black text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-lg flex items-center gap-0.5 animate-pulse">
                              <AlertTriangle size={10} /> {t('str_924')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer price and actions */}
                    <div className="flex justify-between items-center pt-3 border-t border-theme-border/60 text-xs">
                      <div className="flex gap-4">
                        <div>
                          <span className="text-[9px] text-theme-muted block font-bold">{t('str_925')}</span>
                          <span className="font-bold text-theme-text">{product.costPrice || product.purchasePrice || Math.round(product.price * 0.7)} {t('currencyEGP')}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-theme-muted block font-bold">{t('str_704')}</span>
                          <span className="font-black text-primary">{product.price} {t('currencyEGP')}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-theme-muted block font-bold">{t('str_926')}</span>
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
                          {t('str_927')}
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
              {t('str_928')}
            </h3>
          </div>

          {/* Filters Bar */}
          <div className="bg-theme-card p-4 rounded-[24px] border border-theme-border shadow-sm grid grid-cols-3 gap-2.5 theme-transition">
            <div>
              <label className="text-[8px] font-black text-theme-muted block mb-1">{t('str_980')}</label>
              <input 
                type="date" 
                value={filterDate} 
                onChange={e => setFilterDate(e.target.value)} 
                className="w-full bg-theme-bg border border-theme-border rounded-xl p-2 text-[10px] font-bold outline-none text-theme-text focus:border-primary" 
              />
            </div>
            <div>
              <label className="text-[8px] font-black text-theme-muted block mb-1">{t('str_981')}</label>
              <select 
                value={filterProduct} 
                onChange={e => setFilterProduct(e.target.value)} 
                className="w-full bg-theme-bg border border-theme-border rounded-xl p-2 text-[10px] font-bold outline-none text-theme-text focus:border-primary"
              >
                <option value="all" className="bg-theme-card text-theme-text">{t('str_982')}</option>
                {storeProducts.map(p => (
                  <option key={p.id} value={p.id} className="bg-theme-card text-theme-text">{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[8px] font-black text-theme-muted block mb-1">{t('str_983')}</label>
              <select 
                value={filterType} 
                onChange={e => setFilterType(e.target.value)} 
                className="w-full bg-theme-bg border border-theme-border rounded-xl p-2 text-[10px] font-bold outline-none text-theme-text focus:border-primary"
              >
                <option value="all" className="bg-theme-card text-theme-text">{t('str_984')}</option>
                {['Purchase', 'Sale', 'Return', 'Damage', 'Adjustment', 'Transfer'].map(type => (
                  <option key={type} value={type} className="bg-theme-card text-theme-text">{type}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            {filteredMovements.length === 0 ? (
              <p className="text-xs text-theme-muted text-center py-6 font-bold">{t('str_985')}</p>
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
              {t('str_929')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Change */}
            <div className="relative">
              <button 
                onClick={() => { setShowBulkCategoryMenu(!showBulkCategoryMenu); setShowBulkStockMenu(false); }}
                className="bg-theme-bg border border-theme-border text-theme-text font-black px-3 py-2 rounded-xl text-[10px] flex items-center gap-1 hover:bg-theme-border transition"
              >
                {t('str_930')}
                <ChevronDown size={12} />
              </button>
              {showBulkCategoryMenu && (
                <div className="absolute bottom-11 right-0 bg-theme-card border border-theme-border p-3.5 rounded-2xl shadow-xl w-48 space-y-2.5 z-[60] theme-transition">
                  <label className="text-[9px] font-black text-theme-muted block">{t('str_931')}</label>
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
                    {t('str_932')}
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
                {t('str_933')}
                <ChevronDown size={12} />
              </button>
              {showBulkStockMenu && (
                <div className="absolute bottom-11 right-0 bg-theme-card border border-theme-border p-3.5 rounded-2xl shadow-xl w-48 space-y-2.5 z-[60] theme-transition">
                  <label className="text-[9px] font-black text-theme-muted block">{t('str_934')}</label>
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
                    {t('str_932')}
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={handleBulkArchive}
              className="bg-amber-500/10 border border-amber-500/20 text-amber-500 font-black px-3 py-2 rounded-xl text-[10px] hover:bg-amber-500/20 transition flex items-center gap-1"
            >
              <Archive size={12} />
              {t('str_935')}
            </button>
            
            <button 
              onClick={handleBulkDelete}
              className="bg-red-500/10 border border-red-500/20 text-red-500 font-black px-3 py-2 rounded-xl text-[10px] hover:bg-red-500/20 transition flex items-center gap-1"
            >
              <Trash2 size={12} />
              {t('str_936')}
            </button>
          </div>
        </div>
      )}
      {/* Template Picker Modal */}
      {showTemplatePicker && (
        <VendorTemplatePicker 
          onClose={() => setShowTemplatePicker(false)}
          onSelect={handleSelectTemplate}
        />
      )}

      {/* Add Product Modal Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-fade-in">
          <form 
            onSubmit={handleAddProduct}
            className="bg-theme-card border border-theme-border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto no-scrollbar theme-transition"
          >
            <div className="flex justify-between items-center pb-2 border-b border-theme-border">
              <h4 className="font-black text-theme-text text-sm">{t('str_917')}</h4>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-theme-muted hover:text-theme-text"><X size={20} /></button>
            </div>

            {/* Tabs Bar */}
            <div className="flex border-b border-theme-border pb-1 gap-4 text-xs font-black">
              <button
                type="button"
                onClick={() => setActiveFormTab('info')}
                className={`pb-1 border-b-2 transition ${activeFormTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-theme-muted hover:text-theme-text'}`}
              >
                {t('str_937')}
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('media')}
                className={`pb-1 border-b-2 transition ${activeFormTab === 'media' ? 'border-primary text-primary' : 'border-transparent text-theme-muted hover:text-theme-text'}`}
              >
                {t('str_938')}
              </button>
            </div>

            {activeFormTab === 'info' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_939')}</label>
                  <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder={t('str_940')} />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_629')}</label>
                    <input type="text" value={productBrand} onChange={e=>setProductBrand(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-2.5 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder={t('str_941')} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_942')}</label>
                    <input type="text" value={productWeight} onChange={e=>setProductWeight(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-2.5 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="1000" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_943')}</label>
                    <select value={unit} onChange={e=>setUnit(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-2.5 text-xs font-bold outline-none focus:border-primary text-theme-text">
                      <option value={t('str_944')}>{t('str_944')}</option>
                      <option value={t('str_987')}>{t('str_945')}</option>
                      <option value={t('str_946')}>{t('str_946')}</option>
                      <option value={t('str_947')}>{t('str_947')}</option>
                      <option value={t('str_948')}>{t('str_948')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_949')}</label>
                    <input type="number" value={purchasePrice} onChange={e=>setPurchasePrice(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="30" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_950')}</label>
                    <input type="number" value={price} onChange={e=>setPrice(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="42" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_951')}</label>
                    <input type="number" value={stock} onChange={e=>setStock(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_952')}</label>
                    <input type="number" value={threshold} onChange={e=>setThreshold(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="10" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_986')}</label>
                    <input type="text" value={sku} onChange={e=>setSku(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="SKU-XXXX" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_953')}</label>
                    <input type="text" value={barcode} onChange={e=>setBarcode(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder="622XXXXXXXX" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_954')}</label>
                  <select value={cat} onChange={e=>setCat(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text">
                    {['ألبان وأجبان', 'سناكس وشيبسي', 'مشروبات', 'مخبوزات', 'منظفات', 'معلبات'].map(c => (
                      <option key={c} value={c} className="bg-theme-card text-theme-text">{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_955')}</label>
                  <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary h-16 resize-none text-theme-text" placeholder={t('str_988')} />
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in py-2">
                <div className="flex justify-between items-center bg-theme-bg p-3 rounded-2xl border border-theme-border">
                  <span className="text-[10px] font-black text-theme-muted uppercase">{t('str_956')}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${productImages.length > 0 ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20'}`}>
                    {productImages.length > 0 ? (t('str_161')) : (t('str_638'))}
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
                  <p className="text-xs font-black text-theme-text">{t('str_957')}</p>
                  <p className="text-[9px] font-bold text-theme-muted mt-1">{t('str_958')}</p>
                </div>

                {uploading && (
                  <div className="flex items-center gap-2 justify-center text-[10px] text-primary font-black animate-pulse">
                    <Loader2 size={12} className="animate-spin" />
                    <span>{t('str_959')}</span>
                  </div>
                )}

                {productImages.length > 0 ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-theme-muted block">{t('str_960')}</label>
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
                                title={t('str_961')}
                              >
                                <Check size={8} />
                              </button>
                            )}
                            <button 
                              type="button" 
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1 bg-red-500 hover:scale-105 rounded text-white"
                              title={t('str_514')}
                            >
                              <Trash size={8} />
                            </button>
                          </div>
                          {idx === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-primary text-[7px] font-black text-white text-center leading-tight py-0.5 z-10">
                              {t('str_360')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-theme-border/60 rounded-2xl bg-theme-bg/5">
                    <p className="text-[11px] text-theme-muted font-bold">{t('str_962')}</p>
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-black py-3.5 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"><Check size={16} strokeWidth={3} /> {t('str_963')}</button>
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
              <h4 className="font-black text-theme-text text-sm">{t('str_964')}</h4>
              <button type="button" onClick={() => setEditingProduct(null)} className="text-theme-muted hover:text-theme-text"><X size={20} /></button>
            </div>

            {/* Tabs Bar */}
            <div className="flex border-b border-theme-border pb-1 gap-4 text-xs font-black">
              <button
                type="button"
                onClick={() => setActiveFormTab('info')}
                className={`pb-1 border-b-2 transition ${activeFormTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-theme-muted hover:text-theme-text'}`}
              >
                {t('str_937')}
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('media')}
                className={`pb-1 border-b-2 transition ${activeFormTab === 'media' ? 'border-primary text-primary' : 'border-transparent text-theme-muted hover:text-theme-text'}`}
              >
                {t('str_938')}
              </button>
            </div>

            {activeFormTab === 'info' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_939')}</label>
                  <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder={t('str_939')} />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_629')}</label>
                    <input type="text" value={productBrand} onChange={e=>setProductBrand(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-2.5 text-xs font-bold outline-none focus:border-primary text-theme-text" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_942')}</label>
                    <input type="text" value={productWeight} onChange={e=>setProductWeight(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-2.5 text-xs font-bold outline-none focus:border-primary text-theme-text" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_943')}</label>
                    <select value={unit} onChange={e=>setUnit(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-2.5 text-xs font-bold outline-none focus:border-primary text-theme-text">
                      <option value={t('str_944')}>{t('str_944')}</option>
                      <option value={t('str_987')}>{t('str_945')}</option>
                      <option value={t('str_946')}>{t('str_946')}</option>
                      <option value={t('str_947')}>{t('str_947')}</option>
                      <option value={t('str_948')}>{t('str_948')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_965')}</label>
                    <input type="number" value={purchasePrice} onChange={e=>setPurchasePrice(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder={t('str_989')} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_966')}</label>
                    <input type="number" value={price} onChange={e=>setPrice(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" placeholder={t('str_990')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_986')}</label>
                    <input type="text" value={sku} onChange={e=>setSku(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_952')}</label>
                    <input type="number" value={threshold} onChange={e=>setThreshold(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_953')}</label>
                  <input type="text" value={barcode} onChange={e=>setBarcode(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_954')}</label>
                  <select value={cat} onChange={e=>setCat(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text">
                    {['ألبان وأجبان', 'سناكس وشيبسي', 'مشروبات', 'مخبوزات', 'منظفات', 'معلبات'].map(c => (
                      <option key={c} value={c} className="bg-theme-card text-theme-text">{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_967')}</label>
                  <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary h-16 resize-none text-theme-text" placeholder={t('str_991')} />
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in py-2">
                <div className="flex justify-between items-center bg-theme-bg p-3 rounded-2xl border border-theme-border">
                  <span className="text-[10px] font-black text-theme-muted uppercase">{t('str_956')}</span>
                  <div className="flex gap-2 items-center">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${productImages.length > 0 ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20'}`}>
                      {productImages.length > 0 ? (t('str_161')) : (t('str_638'))}
                    </span>
                    {editingProduct.syncStatus === 'outdated' && (
                      <span className="text-[9px] font-black bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded-lg animate-pulse">
                        {t('str_968')}
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
                  <p className="text-xs font-black text-theme-text">{t('str_957')}</p>
                  <p className="text-[9px] font-bold text-theme-muted mt-1">{t('str_958')}</p>
                </div>

                {uploading && (
                  <div className="flex items-center gap-2 justify-center text-[10px] text-primary font-black animate-pulse">
                    <Loader2 size={12} className="animate-spin" />
                    <span>{t('str_959')}</span>
                  </div>
                )}

                {productImages.length > 0 ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-theme-muted block">{t('str_960')}</label>
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
                                title={t('str_961')}
                              >
                                <Check size={8} />
                              </button>
                            )}
                            <button 
                              type="button" 
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1 bg-red-500 hover:scale-105 rounded text-white"
                              title={t('str_514')}
                            >
                              <Trash size={8} />
                            </button>
                          </div>
                          {idx === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-primary text-[7px] font-black text-white text-center leading-tight py-0.5 z-10">
                              {t('str_360')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-theme-border/60 rounded-2xl bg-theme-bg/5">
                    <p className="text-[11px] text-theme-muted font-bold">{t('str_962')}</p>
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-black py-3.5 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"><Check size={16} strokeWidth={3} /> {t('str_413')}</button>
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
                <h4 className="font-black text-theme-text text-sm">{t('str_969')}</h4>
                <p className="text-[10px] text-theme-muted font-bold mt-0.5">{adjustingStockProduct.name}</p>
              </div>
              <button type="button" onClick={() => setAdjustingStockProduct(null)} className="text-theme-muted hover:text-theme-text"><X size={20} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_970')}</label>
                <select 
                  value={adjustType} 
                  onChange={e=>setAdjustType(e.target.value as any)} 
                  className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text"
                >
                  <option value="in" className="bg-theme-card text-theme-text">{t('str_971')}</option>
                  <option value="out" className="bg-theme-card text-theme-text">{t('str_972')}</option>
                  <option value="adjustment" className="bg-theme-card text-theme-text">{t('str_973')}</option>
                  <option value="audit" className="bg-theme-card text-theme-text">{t('str_974')}</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_975')}</label>
                <input 
                  type="number" 
                  value={adjustQty} 
                  onChange={e=>setAdjustQty(e.target.value)} 
                  className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" 
                  placeholder={t('str_976')} 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-theme-muted block mb-1">{t('str_977')}</label>
                <input 
                  type="text" 
                  value={adjustReason} 
                  onChange={e=>setAdjustReason(e.target.value)} 
                  className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none focus:border-primary text-theme-text" 
                  placeholder={t('str_978')} 
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-black py-3.5 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5">
              {t('str_979')}
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
