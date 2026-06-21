import React from 'react';
import { AdminDashboard } from '../features/admin/AdminDashboard';
import { ProtectedAdminRoute } from './ProtectedAdminRoute';

export const AdminRoutes: React.FC = () => {
  return (
    <ProtectedAdminRoute>
      <AdminDashboard />
    </ProtectedAdminRoute>
  );
};

export default AdminRoutes;
