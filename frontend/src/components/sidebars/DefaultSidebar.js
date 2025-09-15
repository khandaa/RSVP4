import React from 'react';
import {
  FaHome,
  FaTag
} from 'react-icons/fa';

export const baseMenuItems = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: <FaHome />,
    permission: null
  },
  {
    name: 'Pricing',
    path: '/pricing',
    icon: <FaTag />,
    permission: null
  },
];
