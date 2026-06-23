import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useRef } from 'react';
import { Download, Upload, AlertCircle, CheckCircle, HelpCircle, FileText, ChevronDown, Check, X, ShieldAlert } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useProducts } from '../../hooks/useProducts';
import { excelImportService, ImportSummaryData, ImportResultRow } from '../../services/excelImport.service';
import { Product } from '../../types/product.types';
import { StockMovement } from '../../contexts/AppContext';

interface ProductImportProps {
  onClose: () => void;
}

export const ProductImport: React.FC<ProductImportProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { addStockMovement, isRTL, showToast } = useApp();
  const { products, setProducts } = useProducts();
  
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [summary, setSummary] = useState<ImportSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter store products (Assume Vendor Store 'g_1')
  const storeProducts = products.filter(p => p.storeId === 'g_1');

  // Trigger spreadsheet file parsing
  const handleFileChange = async (selectedFile: File) => {
    setLoading(true);
    setFile(selectedFile);
    try {
      const parsedSummary = await excelImportService.parseFile(selectedFile);
      
      // Post-process duplicate detection using memory context
      const processedRows = parsedSummary.rows.map(row => {
        if (row.status === 'skip') return row;

        const isDuplicateSKU = storeProducts.some(p => p.sku === row.sku);
        const isDuplicateBarcode = storeProducts.some(p => p.barcode === row.barcode);
        const isDuplicateName = storeProducts.some(p => (p.name || '').toLowerCase() === (row.name || '').toLowerCase());

        if (isDuplicateSKU || isDuplicateBarcode || isDuplicateName) {
          return {
            ...row,
            status: 'update' as const
          };
        }

        return row;
      });

      // Recalculate summary metrics
      const newImported = processedRows.filter(r => r.status === 'new').length;
      const newUpdated = processedRows.filter(r => r.status === 'update').length;

      setSummary({
        ...parsedSummary,
        importedCount: newImported,
        updatedCount: newUpdated,
        rows: processedRows
      });
      showToast(t('str_681'));
    } catch (err: any) {
      alert(t('str_682'));
      setFile(null);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
  const {} = useTranslation();

    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Perform actual import and write changes to AppContext

  const handleCommitImport = () => {
    if (!summary) return;

    const validRows = summary.rows.filter(r => r.status !== 'skip');
    if (validRows.length === 0) {
      alert(t('str_683'));
      return;
    }

    setProducts(prev => {
      let updatedProducts = [...prev];

      validRows.forEach(row => {
        // Detect matched product index to overwrite
        const idx = updatedProducts.findIndex(p => 
          p.storeId === 'g_1' && (p.sku === row.sku || p.barcode === row.barcode || (p.name || '').toLowerCase() === (row.name || '').toLowerCase())
        );

        const priceNum = row.price;
        const pPriceNum = row.costPrice;

        const newProd: Product = {
          id: idx !== -1 ? updatedProducts[idx].id : `p_g_v_import_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          storeId: 'g_1',
          cat: row.cat,
          name: row.name,
          desc: row.desc,
          price: priceNum,
          purchasePrice: pPriceNum,
          costPrice: pPriceNum,
          profitMargin: priceNum > pPriceNum ? Math.round(((priceNum - pPriceNum) / priceNum) * 100) : 0,
          currentStock: row.currentStock,
          reservedStock: idx !== -1 ? (updatedProducts[idx].reservedStock || 0) : 0,
          lowStockThreshold: idx !== -1 ? (updatedProducts[idx].lowStockThreshold || 10) : 10,
          sku: row.sku,
          barcode: row.barcode,
          productBrand: row.productBrand,
          productWeight: row.productWeight,
          unit: row.unit,
          imgUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80', // Default template img
          images: [],
          availabilityStatus: row.currentStock === 0 ? 'out_of_stock' : 'in_stock'
        };

        if (idx !== -1) {
          updatedProducts[idx] = newProd;
        } else {
          updatedProducts.unshift(newProd);
        }

        // Add Stock Ledger log
        if (row.currentStock > 0) {
          addStockMovement(newProd.id, row.currentStock, 'Purchase', t('str_684'));
        }
      });

      return updatedProducts;
    });

    showToast(t('str_685'));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in text-theme-text">
      <div className="bg-theme-card border border-theme-border rounded-[32px] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl flex flex-col gap-5 theme-transition animate-scale-up">
        {/* Title Header */}
        <div className="flex justify-between items-center pb-3 border-b border-theme-border">
          <div>
            <h3 className="font-black text-theme-text text-base">{t('str_686')}</h3>
            <p className="text-[10px] text-theme-muted font-bold mt-0.5">{t('str_687')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-theme-bg rounded-xl transition"><X size={18} /></button>
        </div>

        {/* Upload Action Zone */}
        {!file && (
          <div className="space-y-4">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition ${
                dragOver ? 'border-primary bg-primary/10' : 'border-theme-border bg-theme-bg/30 hover:border-theme-border-hover'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".xlsx,.xls,.csv" 
                onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                className="hidden" 
              />
              <Upload size={36} className="mx-auto text-theme-muted mb-3" />
              <h4 className="font-black text-xs text-theme-text mb-1">{t('str_688')}</h4>
              <p className="text-[9px] text-theme-muted font-bold">{t('str_689')}</p>
            </div>

            <div className="flex justify-between items-center bg-theme-bg p-4 rounded-2xl border border-theme-border">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                <div>
                  <h5 className="font-black text-xs text-theme-text">{t('str_690')}</h5>
                  <p className="text-[9px] text-theme-muted font-bold">{t('str_691')}</p>
                </div>
              </div>
              <button
                onClick={() => excelImportService.downloadTemplate(isRTL)}
                className="bg-primary/10 border border-primary/20 text-primary font-black px-4 py-2.5 rounded-xl text-xs hover:bg-primary/20 transition flex items-center gap-1.5"
              >
                <Download size={14} />
                {t('str_692')}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-10">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-bold text-xs text-theme-muted">{t('str_693')}</p>
          </div>
        )}

        {/* Summary & Import verification */}
        {file && summary && (
          <div className="space-y-5">
            {/* File metadata row */}
            <div className="bg-theme-bg p-3.5 rounded-2xl border border-theme-border flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                <span className="font-black text-theme-text">{file.name}</span>
                <span className="text-[10px] text-theme-muted font-bold">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button 
                onClick={() => { setFile(null); setSummary(null); }} 
                className="text-[10px] text-red-500 hover:underline font-black"
              >
                {t('str_694')}
              </button>
            </div>

            {/* Statistics Row */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl p-3">
                <span className="text-[9px] font-bold block">{t('str_695')}</span>
                <span className="text-lg font-black block mt-0.5">{summary.importedCount}</span>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-2xl p-3">
                <span className="text-[9px] font-bold block">{t('str_696')}</span>
                <span className="text-lg font-black block mt-0.5">{summary.updatedCount}</span>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-3">
                <span className="text-[9px] font-bold block">{t('str_697')}</span>
                <span className="text-lg font-black block mt-0.5">{summary.skippedCount}</span>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl p-3">
                <span className="text-[9px] font-bold block">{t('str_698')}</span>
                <span className="text-lg font-black block mt-0.5">{summary.errorsCount}</span>
              </div>
            </div>

            {/* Error logs display */}
            {summary.errorsCount > 0 && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-black text-red-500 flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  {t('str_699')}
                </h4>
                <div className="max-h-24 overflow-y-auto text-[9px] font-bold text-red-500/80 space-y-1 pr-1 font-mono">
                  {summary.rows.flatMap(r => r.errors).map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Grid Table */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-theme-text">{t('str_700')}</h4>
                <button 
                  onClick={() => setShowOnlyErrors(!showOnlyErrors)} 
                  className={`text-[9px] font-black px-2 py-1 rounded-lg border transition ${
                    showOnlyErrors ? 'bg-red-500 border-red-500 text-white' : 'border-theme-border text-theme-muted hover:text-theme-text'
                  }`}
                >
                  {t('str_701')}
                </button>
              </div>

              <div className="border border-theme-border rounded-2xl overflow-hidden max-h-48 overflow-y-auto no-scrollbar">
                <table className="w-full text-right text-[10px] border-collapse theme-transition">
                  <thead className="bg-theme-bg border-b border-theme-border text-theme-muted font-black sticky top-0">
                    <tr>
                      <th className="p-2.5">{t('str_702')}</th>
                      <th className="p-2.5">{t('str_703')}</th>
                      <th className="p-2.5">{t('str_704')}</th>
                      <th className="p-2.5">SKU</th>
                      <th className="p-2.5">{t('str_705')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/60">
                    {summary.rows
                      .filter(r => !showOnlyErrors || r.status === 'skip')
                      .map((row, idx) => (
                        <tr key={idx} className={`font-bold hover:bg-theme-bg/30 ${row.status === 'skip' ? 'bg-red-500/5' : ''}`}>
                          <td className="p-2.5 text-theme-text max-w-[150px] truncate">{row.name}</td>
                          <td className="p-2.5">{row.cat}</td>
                          <td className="p-2.5 text-theme-text font-black">{row.price} ج.م</td>
                          <td className="p-2.5 font-mono">{row.sku}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black leading-none ${
                              row.status === 'new' 
                                ? 'bg-green-500/10 text-green-500' 
                                : row.status === 'update' 
                                ? 'bg-blue-500/10 text-blue-500' 
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                              {row.status === 'new' ? (t('str_706')) : row.status === 'update' ? (t('str_513')) : (t('str_707'))}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Commit actions */}
            <div className="flex gap-2.5 pt-3 border-t border-theme-border">
              <button 
                onClick={handleCommitImport}
                disabled={summary.importedCount === 0 && summary.updatedCount === 0}
                className="flex-1 bg-primary disabled:opacity-50 hover:bg-primary-hover text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
              >
                <CheckCircle size={16} />
                {t('str_708')}
              </button>
              <button 
                onClick={onClose}
                className="bg-theme-bg hover:bg-theme-border text-theme-text font-black px-5 py-3 rounded-2xl text-xs transition"
              >
                {t('str_56')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ProductImport;
