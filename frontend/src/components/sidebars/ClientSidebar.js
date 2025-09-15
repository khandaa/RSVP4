import React from 'react';
import {
  FaCalendarAlt,
  FaCalendarPlus,
  FaUserCheck
} from 'react-icons/fa';

export const clientMenuItems = [
  {
    name: 'Manage Events',
    icon: <FaCalendarAlt />,
    permission: null,
    submenu: true,
    items: [
      {
        name: 'Events',
        path: '/events/list',
        icon: <FaCalendarAlt />,
        permission: null
      },
      {
        name: 'Sub Events',
        path: '/subevents/list',
        icon: <FaCalendarPlus />,
        permission: null
      },
      {
        name: 'Guests',
        path: '/guests/list',
        icon: <FaUserCheck />,
        permission: null
      }
    ]
  }
];
