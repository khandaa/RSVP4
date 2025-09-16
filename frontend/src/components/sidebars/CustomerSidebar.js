import React from 'react';
import {
  FaUsers,
  FaUserFriends,
  FaUserPlus,
  FaUsersCog,
  FaBuilding,
  FaPlusSquare,
  FaAddressCard,
  FaTruck,
  FaCalendarAlt,
  FaCalendarPlus,
  FaUserCheck,
  FaReply,
  FaBell,
  FaTruckMoving,
  FaChartLine,
  FaPlane,
  FaBed,
  FaCar,
  FaList
} from 'react-icons/fa';

export const customerMenuItems = [
  {
    name: 'Clients',
    icon: <FaAddressCard />,
    permission: null,
    path: '/clients',
  },

  
  
  {
    name: 'Event Management',
    icon: <FaCalendarAlt />,
    permission: null,
    submenu: true,
    items: [
      {
        name: 'Events',
        path: '/events',
        icon: <FaCalendarAlt />,
        permission: null
      },
      // {
      //   name: 'Sub Events',
      //   path: '/subevents/list',
      //   icon: <FaCalendarPlus />,
      //   permission: null
      // },
      {
        name: 'Guests',
        path: '/guests/list',
        icon: <FaUserCheck />,
        permission: null
      },
      {
        name: 'Guests Gropus',
        path: '/guests/groupManagement',
        icon: <FaUserCheck />,
        permission: null
      },
      
      {
        name: 'RSVPs',
        path: '/rsvps/dashboard',
        icon: <FaReply />,
        permission: null
      },
      {
        name: 'Notifications',
        path: '/notifications',
        icon: <FaBell />,
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
      }
    ]
  },

  {
    name: 'My Team',
    submenu: true,
    icon: <FaUsers />,
    permission: null,
    items:[
      {
        name: 'Employees',
        path: '/employees/list',
        icon: <FaUserFriends />,
        permission: 'employee_view'
      },
      // {
      //   name: 'Add Employee',
      //   path: '/employees/create',
      //   icon: <FaUserPlus />,
      //   permission: 'employee_create'
      // },
      {
        name: 'Teams',
        path: '/teams/list',
        icon: <FaUsers />,
        permission: 'team_view'
      },
      // {
      //   name: 'Create Team',
      //   path: '/teams/create',
      //   icon: <FaUsersCog />,
      //   permission: 'team_create'
      // },
      {
        name: 'Departments',
        path: '/departments/list',
        icon: <FaBuilding />,
        permission: 'department_view'
      },
      // {
      //   name: 'Add Department',
      //   path: '/departments/create',
      //   icon: <FaPlusSquare />,
      //   permission: 'department_create'
      // }
    ]
  },
  {
    name: 'Venue Management',
    icon: <FaBuilding />,
    permission: null,
    path: '/venues/list',
  },
  {
    name: 'Vendor Management',
    icon: <FaTruck />,
    permission: null,
    path: '/vendors/list',
  },
];
