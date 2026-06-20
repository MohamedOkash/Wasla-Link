import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { AppRoutes } from './routes/AppRoutes';
import { Toast } from './components/common/Toast';

function AppContent() {
  const { isRTL, role, theme } = useApp();
  const isDesktop = role === 'vendor' || role === 'admin';
  
  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'} 
      className={`bg-black min-h-screen font-sans theme-transition ${theme === 'midnight' ? 'theme-midnight text-white' : 'text-gray-950'}`}
    >
      <div 
        className={`${isDesktop ? 'max-w-[1200px] min-h-screen' : 'max-w-[400px] h-screen'} mx-auto bg-theme-bg theme-transition relative shadow-[0_0_50px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col`}
      >
        <AppRoutes />
        <Toast />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
