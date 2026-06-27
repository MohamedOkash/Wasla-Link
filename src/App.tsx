import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { LanguageProvider } from './context/LanguageProvider';
import { useTranslation } from './hooks/useTranslation';
import { AppRoutes } from './routes/AppRoutes';
import { ToastManager } from './components/premium/toast/ToastManager';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { CartConflictModal } from './components/premium/CartConflictModal';

function AppContent() {
  const { role, theme } = useApp();
  const { isRTL } = useTranslation();
  const isDesktop = role === 'vendor' || role === 'admin';
  
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
          <AppRoutes />
          <CartConflictModal />
          <ToastManager />
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
