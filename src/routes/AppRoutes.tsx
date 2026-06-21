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
  <div className="flex items-center justify-center min-h-screen bg-theme-bg">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
