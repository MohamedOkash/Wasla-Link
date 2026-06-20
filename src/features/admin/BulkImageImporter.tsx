import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Product } from '../../types/product.types';
import { mediaService } from '../../services/media.service';
import { useApp } from '../../contexts/AppContext';
import * as XLSX from 'xlsx';
import { 
  Upload, FileSpreadsheet, Plus, X, Play, Loader2, AlertTriangle, 
  CheckCircle, Database, HelpCircle, ArrowRight, Download 
} from 'lucide-react';

export const BulkImageImporter: React.FC = () => {
  const { isRTL, showToast } = useApp();
  const [templates, setTemplates] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchingCriteria, setMatchingCriteria] = useState<'sku' | 'barcode' | 'id' | 'name'>('sku');
  
  // Selected files
  const [files, setFiles] = useState<File[]>([]);
  const [matchedAssets, setMatchedAssets] = useState<Array<{ file: File; template: Product; status: 'matched' | 'unmatched' }>>([]);

  // Upload/Import states
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [importReport, setImportReport] = useState<Array<{ filename: string; matchedId: string; status: string; error?: string }>>([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const snap = await getDocs(collection(db, 'productTemplates'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setTemplates(list);
    } catch (err) {
      console.error(err);
    }
  };

  // Perform Match Mapping
  const performMatching = (selectedFiles: File[], criteria: 'sku' | 'barcode' | 'id' | 'name') => {
    const list = selectedFiles.map(file => {
      // Strip extension
      const basename = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      
      const found = templates.find(t => {
        const val = basename.toLowerCase().trim();
        if (criteria === 'sku') {
          return (t.sku || '').toLowerCase().trim() === val;
        } else if (criteria === 'barcode') {
          return (t.barcode || '').toLowerCase().trim() === val;
        } else if (criteria === 'id') {
          return t.id.toLowerCase().trim() === val;
        } else {
          return t.name.toLowerCase().includes(val) || 
                 (t.nameAr && t.nameAr.toLowerCase().includes(val)) ||
                 (t.nameEn && t.nameEn.toLowerCase().includes(val));
        }
      });

      return {
        file,
        template: found || { id: '', name: isRTL ? 'غير معروف' : 'Unmatched', price: 0 } as any,
        status: found ? 'matched' as const : 'unmatched' as const
      };
    });

    setMatchedAssets(list);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => {
        const merged = [...prev, ...newFiles];
        performMatching(merged, matchingCriteria);
        return merged;
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      performMatching(updated, matchingCriteria);
      return updated;
    });
  };

  const handleCriteriaChange = (val: 'sku' | 'barcode' | 'id' | 'name') => {
    setMatchingCriteria(val);
    performMatching(files, val);
  };

  const handleStartImport = async () => {
    const activeMatches = matchedAssets.filter(m => m.status === 'matched');
    if (activeMatches.length === 0) {
      showToast(isRTL ? 'لا توجد صور متطابقة لبدء الاستيراد' : 'No matched assets to import');
      return;
    }

    setImporting(true);
    setProgress({ current: 0, total: activeMatches.length });
    const report: typeof importReport = [];

    for (let i = 0; i < activeMatches.length; i++) {
      const match = activeMatches[i];
      try {
        // 1. Upload to storage
        const url = await mediaService.uploadProductImage(match.file, 'productTemplates');
        
        // 2. Increment Template image version & update template document
        const version = (match.template.templateImageVersion || match.template.assetVersion || 0) + 1;
        
        await mediaService.createAssetVersion(match.template.id, url, match.template.galleryImages || [], 'admin');

        report.push({
          filename: match.file.name,
          matchedId: match.template.id,
          status: 'SUCCESS'
        });
      } catch (err: any) {
        console.error(err);
        report.push({
          filename: match.file.name,
          matchedId: match.template.id,
          status: 'FAILED',
          error: err.message || 'Storage upload error'
        });
      }
      setProgress(prev => ({ ...prev, current: i + 1 }));
    }

    setImportReport(report);
    setImporting(false);
    showToast(isRTL ? 'اكتمل استيراد الصور بنجاح!' : 'Bulk image import complete!');
  };

  const handleExportReport = () => {
    if (importReport.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(importReport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Report');
    XLSX.writeFile(workbook, `Bulk_Image_Import_Report_${Date.now()}.xlsx`);
  };

  return (
    <div className="bg-theme-card rounded-[30px] border border-theme-border/60 p-6 shadow-sm space-y-6 animate-fade-in theme-transition">
      <div>
        <h3 className="font-black text-theme-text text-sm flex items-center gap-2 border-b border-theme-border pb-2">
          <Upload size={18} className="text-primary" />
          {isRTL ? 'استيراد وربط الصور الجماعي للمستودع' : 'Master Catalog Bulk Image Importer Pro'}
        </h3>
        <p className="text-[10px] text-theme-muted font-bold mt-1 uppercase tracking-wider">
          {isRTL ? 'مربط الصور بالباركود أو رمز SKU أو المعرف تلقائياً' : 'Automated SKU/Barcode image attachment platform'}
        </p>
      </div>

      {/* Select Match Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
        <div>
          <label className="text-[10px] font-black text-theme-muted block mb-1.5">{isRTL ? 'معيار المطابقة التلقائي' : 'Image Filename Matching Rule'}</label>
          <select 
            value={matchingCriteria} 
            onChange={e => handleCriteriaChange(e.target.value as any)}
            className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-bold outline-none text-theme-text focus:border-primary"
          >
            <option value="sku">{isRTL ? 'اسم الملف = رمز SKU (مثال: SKU-100.jpg)' : 'Filename = SKU'}</option>
            <option value="barcode">{isRTL ? 'اسم الملف = الباركود (مثال: 622110.jpg)' : 'Filename = Barcode'}</option>
            <option value="id">{isRTL ? 'اسم الملف = معرف القالب (مثال: grocery_milk_1.jpg)' : 'Filename = Template ID'}</option>
            <option value="name">{isRTL ? 'اسم الملف يحتوي على اسم السلعة' : 'Filename contains Product Name'}</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-theme-muted block mb-1.5">{isRTL ? 'تحديد ملفات الصور للرفع' : 'Select Target Images'}</label>
          <div className="relative border border-theme-border rounded-xl p-3 bg-theme-bg flex items-center justify-center cursor-pointer hover:border-primary/40 transition">
            <span className="text-xs font-bold text-theme-muted flex items-center gap-1.5">
              <Upload size={14} /> {isRTL ? 'اختر ملفات (100، 500، 1000+)' : 'Choose Images (100, 500, 1000+)'}
            </span>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
          </div>
        </div>

        <div>
          <button 
            onClick={handleStartImport}
            disabled={importing || files.length === 0}
            className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white font-black py-3 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"
          >
            {importing ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
            {isRTL ? 'بدء تشغيل الاستيراد الجماعي' : 'Run Bulk Attach'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {importing && (
        <div className="bg-theme-bg p-4.5 rounded-2xl border border-theme-border/60 space-y-2">
          <div className="flex justify-between text-xs font-black">
            <span>{isRTL ? 'جاري رفع الصور وضغطها تلقائياً...' : 'Uploading & converting images...'}</span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <div className="w-full h-2 bg-theme-border rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Matches Grid List */}
      {matchedAssets.length > 0 && (
        <div className="border border-theme-border/60 rounded-3xl overflow-hidden bg-theme-bg/10 theme-transition">
          <div className="bg-theme-bg px-4.5 py-3 border-b border-theme-border/60 flex justify-between items-center text-xs font-black">
            <span>{isRTL ? 'معاينة خريطة المطابقة التلقائية' : 'Auto-Match Map Preview'}</span>
            <button onClick={() => { setFiles([]); setMatchedAssets([]); }} className="text-red-500 hover:underline">{isRTL ? 'مسح الكل' : 'Clear All'}</button>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto divide-y divide-theme-border/40 p-1">
            {matchedAssets.map((item, idx) => (
              <div key={idx} className="p-3 flex justify-between items-center text-xs font-bold gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] text-theme-muted shrink-0">#{idx + 1}</span>
                  <ImageIcon size={14} className="text-theme-muted shrink-0" />
                  <span className="text-theme-text truncate max-w-44">{item.file.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <ArrowRight size={12} className="text-theme-muted" />
                  {item.status === 'matched' ? (
                    <div className="flex items-center gap-1 text-green-500">
                      <CheckCircle size={12} />
                      <span className="truncate max-w-44">{item.template.nameAr || item.template.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-500">
                      <AlertTriangle size={12} />
                      <span>{isRTL ? 'غير مطابق' : 'Unmatched'}</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleRemoveFile(idx)}
                  className="text-theme-muted hover:text-red-500 transition"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Section */}
      {importReport.length > 0 && (
        <div className="bg-theme-bg p-4.5 rounded-2xl border border-theme-border/60 flex justify-between items-center">
          <span className="text-xs font-black text-theme-text">
            {isRTL ? 'يتوفر تقرير استيراد نشط لعملية الرفع.' : 'Asset bulk import report is ready.'}
          </span>
          <button 
            onClick={handleExportReport}
            className="bg-green-600 hover:bg-green-700 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
          >
            <Download size={14} />
            {isRTL ? 'تصدير تقرير الإكسل' : 'Export Excel Report'}
          </button>
        </div>
      )}
    </div>
  );
};

export default BulkImageImporter;
