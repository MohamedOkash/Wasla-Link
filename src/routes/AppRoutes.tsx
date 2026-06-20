import React from 'react';
import { useApp } from '../contexts/AppContext';

// Router & Screens
import { SplashScreen } from '../features/auth/SplashScreen';
import { AuthScreen } from '../features/auth/AuthScreen';
import { CustomerRoutes } from './CustomerRoutes';
import { VendorRoutes } from './VendorRoutes';
import { DriverRoutes } from './DriverRoutes';
import { AdminRoutes } from './AdminRoutes';

export const AppRoutes: React.FC = () => {
  const { role } = useApp();

  switch (role) {
    case 'splash':
      return <SplashScreen />;
    case 'login':
      return <AuthScreen />;
    case 'customer':
      return <CustomerRoutes />;
    case 'vendor':
      return <VendorRoutes />;
    case 'driver':
      return <DriverRoutes />;
    case 'admin':
      return <AdminRoutes />;
    default:
      return <AuthScreen />;
  }
};
export default AppRoutes;
