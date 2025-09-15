import React from 'react';
import {
  FaUsers,
  FaUserTag,
  FaShieldAlt,
  FaList,
  FaChartLine,
  FaToggleOn,
  FaCreditCard,
  FaBuilding,
  FaAddressCard,
} from 'react-icons/fa';

export const adminMenuItems = [
  {
    name: 'SuperAdmin Menu',
    icon: <FaAddressCard />,
    permission: null,
    submenu: true,
    items: [
      {
        name: 'Base Users',
        path: '/users',
        icon: <FaUsers />,
        permission: 'user_view'
      },
      {
        name: 'Roles',
        path: '/roles',
        icon: <FaUserTag />,
        permission: 'role_view'
      },
      {
        name: 'Permissions',
        path: '/permissions',
        icon: <FaShieldAlt />,
        permission: 'permission_view'
      },
      {
        name: 'Payment',
        path: '/payment',
        icon: <FaCreditCard />,
        permission: 'payment_view',
        featureToggle: 'payment_integration'
      },
      {
        name: 'Activity Logs',
        path: '/logs',
        icon: <FaList />,
        permission: 'permission_view'
      },
      {
        name: 'Analytics',
        path: '/analytics',
        icon: <FaChartLine />,
        permission: 'dashboard_view'
      },
      {
        name: 'Feature Toggles',
        path: '/roles/feature-toggles',
        icon: <FaToggleOn />,
        permission: null
      },
      {
        name: 'File Upload Settings',
        path: '/admin/file-upload-settings',
        icon: <FaCreditCard />,
        permission: 'role_view'
      }
    ]
  },
  {
    name: 'Manage Customers',
    icon: <FaBuilding />,
    path: '/customers',
    permission: null,
  }
];
