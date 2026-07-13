import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { LanguageProvider } from './contexts/LanguageProvider';
import { useTranslation } from './hooks/useTranslation';
import { AppRoutes } from './routes/AppRoutes';
import { ToastManager } from './components/premium/toast/ToastManager';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { CartConflictModal } from './components/premium/CartConflictModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';

import { App as CapacitorApp } from '@capacitor/app';
import { RefreshCw } from 'lucide-react';

import { doc, getDoc } from 'firebase/firestore';
import { db } from './services/firebase';

const CURRENT_VERSION = '1.0.0';

function isOutdated(local: string, server: string): boolean {
  const localParts = local.split('.').map(Number);
  const serverParts = server.split('.').map(Number);
  for (let i = 0; i < Math.max(localParts.length, serverParts.length); i++) {
    const l = localParts[i] || 0;
    const s = serverParts[i] || 0;
    if (s > l) return true;
    if (l > s) return false;
  }
  return false;
}

function AppContent() {
  const { role, theme, backHandlers } = useApp();
  const { isRTL } = useTranslation();
  const isDesktop = role === 'vendor' || role === 'admin';
  const [updateInfo, setUpdateInfo] = useState<{ critical: boolean; message: string; version: string; url?: string } | null>(null);
  
  useEffect(() => {
    const handleBack = () => {
      // Run handlers in reverse order (newest first)
      for (let i = backHandlers.length - 1; i >= 0; i--) {
        const handled = backHandlers[i]();
        if (handled) return;
      }
      // If nothing handled, exit the app
      CapacitorApp.exitApp();
    };

    const listener = CapacitorApp.addListener('backButton', () => {
      handleBack();
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [backHandlers]);

  useEffect(() => {
    async function checkVersion() {
      try {
        const snap = await getDoc(doc(db, 'system', 'appVersion'));
        if (snap.exists()) {
          const data = snap.data();
          const latestVersion = data.latestVersion || '1.0.0';
          const minimumVersion = data.minimumVersion || '1.0.0';
          const forceUpdate = data.forceUpdate === true || isOutdated(CURRENT_VERSION, minimumVersion);
          const changelog = data.changelog || 'New enhancements and bug fixes!';
          const playStoreUrl = data.playStoreUrl || 'https://play.google.com/store/apps';

          if (isOutdated(CURRENT_VERSION, latestVersion) || forceUpdate) {
            setUpdateInfo({
              critical: forceUpdate,
              message: changelog,
              version: latestVersion,
              url: playStoreUrl
            });
          }
        }
      } catch (err) {
        console.error('Version check failed:', err);
      }
    }
    checkVersion();
  }, []);

  const renderUpdateOverlay = () => {
    if (!updateInfo) return null;

    return (
      <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 text-center">
        <div className="bg-theme-card border border-theme-border rounded-[32px] p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-6 border border-primary/30 animate-pulse">
            <RefreshCw size={32} />
          </div>
          <h2 className="text-xl font-black mb-2 text-theme-text">{isRTL ? 'تحديث جديد متوفر' : 'New Update Available'} ({updateInfo.version})</h2>
          <p className="text-sm font-bold text-theme-muted mb-6 leading-relaxed">
            {updateInfo.message}
          </p>
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => {
                window.open(updateInfo.url || 'https://play.google.com/store/apps', '_blank');
              }}
              className="w-full bg-primary hover:bg-primary-hover text-white font-black py-3.5 rounded-xl text-sm transition shadow-md active:scale-95"
            >
              {isRTL ? 'تحديث الآن' : 'Update Now'}
            </button>
            {!updateInfo.critical && (
              <button
                onClick={() => setUpdateInfo(null)}
                className="w-full bg-theme-bg border border-theme-border text-theme-text font-black py-3 rounded-xl text-sm transition hover:bg-theme-border/30 active:scale-95"
              >
                {isRTL ? 'لاحقاً' : 'Later'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (updateInfo && updateInfo.critical) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="bg-black min-h-screen font-sans flex items-center justify-center">
        {renderUpdateOverlay()}
      </div>
    );
  }
  
  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'} 
      className={`bg-black min-h-screen font-sans theme-transition ${
        theme === 'midnight' 
          ? 'theme-midnight text-white' 
          : theme === 'purple-glass' 
          ? 'theme-purple-glass text-white' 
          : 'text-gray-950'
      }`}
    >
      <div 
        className={`${isDesktop ? 'max-w-[1200px] min-h-screen' : 'max-w-[400px] h-screen'} mx-auto bg-theme-bg theme-transition relative shadow-[0_0_50px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col`}
      >
        {theme === 'purple-glass' && (
          <>
            <div className="absolute top-[-10%] left-[-20%] w-[90%] h-[60%] rounded-full bg-purple-600/20 blur-[100px] pointer-events-none animate-pulse-slow z-0"></div>
            <div className="absolute bottom-[-10%] right-[-20%] w-[90%] h-[60%] rounded-full bg-pink-600/15 blur-[100px] pointer-events-none animate-pulse-slow-delay z-0"></div>
          </>
        )}
        <ErrorBoundary>
          <OfflineIndicator />
          <AppRoutes />
          <CartConflictModal />
          <ToastManager />
          {renderUpdateOverlay()}
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </LanguageProvider>
  );
}
