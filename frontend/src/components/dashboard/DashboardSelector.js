import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Dashboard from './Dashboard';
import CustomerDashboard from './CustomerDashboard';
import ClientDashboard from './ClientDashboard';

/**
 * DashboardSelector Component
 * 
 * This component conditionally renders different dashboard types based on user role:
 * - Customer Admin users see the CustomerDashboard
 * - Client Admin users see the ClientDashboard
 * - Other users see the standard Dashboard
 */
const DashboardSelector = () => {
  const { hasRole } = useAuth();
  
  // Check if the user has specific admin roles
  const isCustomerAdmin = hasRole && hasRole(['Customer Admin']);
  const isClientAdmin = hasRole && hasRole(['Client Admin']);
  
  // Render the appropriate dashboard based on user role
  if (isCustomerAdmin) {
    return <CustomerDashboard />;
  } else if (isClientAdmin) {
    return <ClientDashboard />;
  } else {
    return <Dashboard />;
  }
};

export default DashboardSelector;
