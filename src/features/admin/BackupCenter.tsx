import React, { useState } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { Download, Upload, FileText, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export function BackupCenter() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const collections = [
    { id: 'products', label: 'Products / المنتجات' },
    { id: 'orders', label: 'Orders / الطلبات' },
    { id: 'stores', label: 'Stores / المتاجر' },
    { id: 'users', label: 'Users / المستخدمين' },
    { id: 'categories', label: 'Categories / الأقسام' },
    { id: 'coupons', label: 'Coupons / الكوبونات' },
    { id: 'tickets', label: 'Support Tickets / التذاكر' }
  ];

  const handleExport = async (collName: string, format: 'json' | 'csv') => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const snap = await getDocs(collection(db, collName));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (list.length === 0) {
        setStatusMsg({ text: `No records found in collection: ${collName}`, type: 'error' });
        setLoading(false);
        return;
      }

      if (format === 'json') {
        const jsonStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(list, null, 2))}`;
        triggerDownload(jsonStr, `${collName}_backup.json`);
      } else {
        // Build CSV keys
        const firstItem = list[0] as any;
        const keys = Object.keys(firstItem).filter(k => typeof firstItem[k] !== 'object');
        const csvRows = list.map((row: any) => {
          return keys.map(k => {
            const val = row[k] === undefined ? '' : String(row[k]);
            return `"${val.replace(/"/g, '""')}"`;
          }).join(',');
        });

        const csvContent = `data:text/csv;charset=utf-8,\uFEFF${encodeURIComponent([keys.join(','), ...csvRows].join('\n'))}`;
        triggerDownload(csvContent, `${collName}_backup.csv`);
      }

      setStatusMsg({ text: `Successfully exported ${list.length} records from ${collName}!`, type: 'success' });
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ text: `Export failed: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = (uri: string, filename: string) => {
    const link = document.createElement('a');
    link.setAttribute('href', uri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>, collName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        let importedList: any[] = [];
        
        if (file.name.endsWith('.json')) {
          importedList = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n').filter(Boolean);
          if (lines.length < 2) throw new Error('Invalid CSV file header structure.');
          
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          importedList = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const row: any = {};
            headers.forEach((h, idx) => {
              row[h] = values[idx] || '';
            });
            return row;
          });
        } else {
          throw new Error('Unsupported file format. Please upload JSON or CSV.');
        }

        if (!Array.isArray(importedList)) {
          throw new Error('Imported structure must be an array of objects.');
        }

        // Validate and Restore database records
        let count = 0;
        for (const item of importedList) {
          const docId = item.id || doc(collection(db, collName)).id;
          const cleanItem = { ...item };
          delete cleanItem.id;
          
          await setDoc(doc(db, collName, docId), cleanItem);
          count++;
        }

        setStatusMsg({ text: `Successfully restored ${count} documents into ${collName}!`, type: 'success' });
      } catch (err: any) {
        console.error(err);
        setStatusMsg({ text: `Import failed: ${err.message}`, type: 'error' });
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="bg-theme-card border border-theme-border rounded-[28px] p-6 shadow-sm">
        <h2 className="text-base font-black flex items-center gap-2 mb-2 text-theme-text">
          <Database className="text-primary" size={20} />
          <span>Backup & Restore Center / مركز النسخ الاحتياطي</span>
        </h2>
        <p className="text-xs text-theme-muted mb-6 leading-relaxed">
          Manage system databases backup files. You can export complete collections to CSV or JSON formats, or restore database documents from locally saved templates.
        </p>

        {statusMsg && (
          <div className={`p-4 rounded-xl flex items-center gap-3 text-xs mb-6 border ${
            statusMsg.type === 'success' 
              ? 'bg-green-500/10 text-green-500 border-green-500/20' 
              : 'bg-red-500/10 text-red-500 border-red-500/20'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span className="font-bold">{statusMsg.text}</span>
          </div>
        )}

        <div className="space-y-4">
          {collections.map(coll => (
            <div key={coll.id} className="p-4 rounded-2xl bg-theme-bg border border-theme-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-black text-xs text-theme-text">{coll.label}</h4>
                <p className="text-[10px] text-theme-muted mt-0.5">Target: {coll.id} collection</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  disabled={loading}
                  onClick={() => handleExport(coll.id, 'json')}
                  className="px-3 py-1.5 rounded-xl bg-theme-card border border-theme-border text-[10px] font-black text-theme-text flex items-center gap-1.5 hover:border-primary/30 disabled:opacity-50 transition active:scale-95"
                >
                  <Download size={12} />
                  <span>Export JSON</span>
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleExport(coll.id, 'csv')}
                  className="px-3 py-1.5 rounded-xl bg-theme-card border border-theme-border text-[10px] font-black text-theme-text flex items-center gap-1.5 hover:border-primary/30 disabled:opacity-50 transition active:scale-95"
                >
                  <FileText size={12} />
                  <span>Export CSV</span>
                </button>

                <label className="px-3 py-1.5 rounded-xl bg-primary text-white text-[10px] font-black cursor-pointer flex items-center gap-1.5 hover:bg-primary-hover shadow transition active:scale-95">
                  <Upload size={12} />
                  <span>Import Data</span>
                  <input
                    disabled={loading}
                    type="file"
                    accept=".csv,.json"
                    onChange={(e) => handleImportFile(e, coll.id)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
