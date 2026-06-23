import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, Timestamp, query, where, orderBy, limit } from 'firebase/firestore';
import { assetRecoveryService } from '../../services/assetRecovery.service';
import { useApp } from '../../contexts/AppContext';
import { Shield, Play, Loader2, CheckCircle, AlertTriangle, ListFilter, History } from 'lucide-react';

export const AssetRecoveryPanel: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL, showToast } = useApp();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ scanned: number; repaired: number } | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const snap = await getDocs(query(collection(db, 'assets'), orderBy('createdAt', 'desc'), limit(15)));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLogs(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRunScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await assetRecoveryService.runRecoveryScan();
      setScanResult({ scanned: res.totalScanned, repaired: res.totalRepaired });
      showToast(t('str_392'));
      await fetchLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="bg-theme-card rounded-[30px] border border-theme-border/60 p-6 shadow-sm space-y-6 animate-fade-in theme-transition">
      <div>
        <h3 className="font-black text-theme-text text-sm flex items-center gap-2 border-b border-theme-border pb-2">
          <Shield size={18} className="text-indigo-600" />
          {t('str_393')}
        </h3>
        <p className="text-[10px] text-theme-muted font-bold mt-1 uppercase tracking-wider">
          {t('str_394')}
        </p>
      </div>

      <div className="bg-theme-bg p-5 rounded-2xl border border-theme-border/60 flex flex-col md:flex-row gap-5 justify-between items-center">
        <div className="space-y-1 text-xs font-bold text-theme-muted text-center md:text-right">
          <p className="text-theme-text font-black text-sm">{t('str_395')}</p>
          <p>{t('str_396')}</p>
        </div>
        
        <button 
          onClick={handleRunScan}
          disabled={scanning}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black px-6 py-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition shrink-0"
        >
          {scanning ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
          {scanning ? (t('str_397')) : (t('str_398'))}
        </button>
      </div>

      {scanResult && (
        <div className="bg-green-500/10 border border-green-500/20 p-4.5 rounded-2xl flex items-center gap-3 animate-fade-in text-xs font-bold text-green-600">
          <CheckCircle size={20} className="shrink-0" />
          <div>
            <p className="font-black">{t('str_399')}</p>
            <p className="mt-0.5 text-[11px] text-theme-muted">
              {isRTL 
                ? `تم فحص عدد ${scanResult.scanned} أصل صورة بنجاح، وإصلاح ${scanResult.repaired} صورة تالفة ومكسورة.` 
                : `Successfully verified ${scanResult.scanned} image resources and healed ${scanResult.repaired} broken URLs.`
              }
            </p>
          </div>
        </div>
      )}

      {/* Recovery Logs */}
      <div className="space-y-3">
        <h4 className="font-black text-xs text-theme-text flex items-center gap-1.5">
          <History size={14} className="text-theme-muted" />
          {t('str_400')}
        </h4>

        {loadingLogs ? (
          <div className="text-center py-6 text-theme-muted font-bold animate-pulse text-xs">
            {t('str_401')}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-theme-border/60 rounded-2xl text-theme-muted text-xs font-bold">
            {t('str_402')}
          </div>
        ) : (
          <div className="border border-theme-border/60 rounded-3xl overflow-hidden divide-y divide-theme-border/40 bg-theme-bg/10 theme-transition">
            {logs.map((log) => (
              <div key={log.id} className="p-3.5 flex justify-between items-center text-xs font-bold gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${log.uploadedBy === 'system_recovery' ? 'bg-indigo-500' : 'bg-primary'}`} />
                  <div className="min-w-0">
                    <span className="text-theme-text block truncate max-w-64">
                      {log.description || (t('str_403'))}
                    </span>
                    <span className="text-[9px] text-theme-muted font-bold block mt-0.5">
                      {t('str_404')} • v{log.version}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-theme-muted block">
                    {log.createdAt?.toDate ? new Date(log.createdAt.toDate()).toLocaleTimeString() : new Date().toLocaleTimeString()}
                  </span>
                  <span className="text-[9px] text-theme-muted block font-mono">
                    {log.uploadedBy}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetRecoveryPanel;
