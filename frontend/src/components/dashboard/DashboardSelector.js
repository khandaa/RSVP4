import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Dashboard from './Dashboard';
import CustomerDashboard from './CustomerDashboard';

/**
 * DashboardSelector Component
 * 
 * This component conditionally renders different dashboard types based on user role:
 * - Customer Admin users see the CustomerDashboard
 * - Other users see the standard Dashboard
 */
const DashboardSelector = () => {
  const { hasRole } = useAuth();
  
  // Check if the user has the Customer Admin role
  const isCustomerAdmin = hasRole && hasRole(['Customer Admin']);
  
  // Render the appropriate dashboard based on user role
  return isCustomerAdmin ? <CustomerDashboard /> : <Dashboard />;
};

export default DashboardSelector;
