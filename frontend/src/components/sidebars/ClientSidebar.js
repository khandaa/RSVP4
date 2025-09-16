import React from 'react';
import {
  FaCalendarAlt,
  FaCalendarPlus,
  FaUserCheck,
  FaTruckMoving,
  FaPlane,
  FaBed,
  FaCar,
  FaList,
  FaChartLine,
  FaUserFriends
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
      },
      {
        name: 'Guest Groups',
        path: '/guests/groups',
        icon: <FaList />,
        permission: null
      }
          ]
        },
        {
          name: 'Logistics',
          icon: <FaTruckMoving />,
          permission: null,
          submenu: true,
          items: [
            {
              name: 'Logistics Dashboard',
              path: '/logistics/dashboard',
              icon: <FaChartLine />,
              permission: null
            },
            {
              name: 'Travel',
              path: '/logistics/travel',
              icon: <FaPlane />,
              permission: null
            },
            {
              name: 'Accommodation',
              path: '/logistics/accommodation',
              icon: <FaBed />,
              permission: null
            },
            {
              name: 'Vehicle Allocations',
              path: '/logistics/vehicles',
              icon: <FaCar />,
              permission: null
            },
            {
              name: 'Logistics Reports',
              path: '/logistics/reports',
              icon: <FaList />,
              permission: null
            },
          
    ]
  }
];
