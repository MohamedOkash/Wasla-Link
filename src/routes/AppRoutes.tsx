import React, { Suspense } from 'react';
import { useApp } from '../contexts/AppContext';

// Router & Screens (Eager)
import { SplashScreen } from '../features/auth/SplashScreen';
import { AuthScreen } from '../features/auth/AuthScreen';

// Lazy Loaded Routes
const CustomerRoutes = React.lazy(() => import('./CustomerRoutes'));
const VendorRoutes = React.lazy(() => import('./VendorRoutes'));
const DriverRoutes = React.lazy(() => import('./DriverRoutes'));
const AdminRoutes = React.lazy(() => import('./AdminRoutes'));

const LoadingFallback = () => (
  <div className="flex-1 flex flex-col p-6 space-y-6 bg-theme-bg min-h-screen animate-fade-in font-sans">
    {/* Mock Premium Header Shimmer */}
    <div className="flex justify-between items-center pb-4 border-b border-theme-border/40">
      <div className="w-12 h-12 rounded-[18px] bg-theme-border/30 shimmer-effect shrink-0"></div>
      <div className="flex-1 mx-4 space-y-2">
        <div className="h-3 w-1/3 bg-theme-border/35 shimmer-effect rounded"></div>
        <div className="h-2 w-1/2 bg-theme-border/30 shimmer-effect rounded"></div>
      </div>
      <div className="w-10 h-10 rounded-xl bg-theme-border/30 shimmer-effect shrink-0"></div>
    </div>
    
    {/* Mock Banner Shimmer */}
    <div className="h-36 w-full rounded-[24px] bg-theme-border/25 shimmer-effect"></div>
    
    {/* Mock List Items Shimmer */}
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 w-full rounded-2xl bg-theme-border/25 shimmer-effect p-3 flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-theme-border/30 shrink-0"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-2.5 w-1/4 bg-theme-border/30 rounded"></div>
            <div className="h-2 w-1/2 bg-theme-border/30 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const AppRoutes: React.FC = () => {
  const { role } = useApp();

  if (role === 'splash') return <SplashScreen />;
  if (role === 'login') return <AuthScreen />;

  return (
    <Suspense fallback={<LoadingFallback />}>
      {role === 'customer' && <CustomerRoutes />}
      {role === 'vendor' && <VendorRoutes />}
      {role === 'driver' && <DriverRoutes />}
      {role === 'admin' && <AdminRoutes />}
    </Suspense>
  );
};
export default AppRoutes;
