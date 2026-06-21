import React, { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

export const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, setRole } = useApp();

  useEffect(() => {
    if (!currentUser) {
      setRole('login');
    } else if (currentUser.role !== 'admin') {
      setRole('customer');
    }
  }, [currentUser, setRole]);

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
