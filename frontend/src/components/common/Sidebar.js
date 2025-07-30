import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/Sidebar.css';
import { 
  FaHome, 
  FaUsers, 
  FaUserTag, 
  FaShieldAlt, 
  FaList, 
  FaChartLine, 
  FaToggleOn,
  FaCreditCard,
  FaBuilding,
  FaAddressCard,
  FaUserFriends,
  FaCalendarAlt,
  FaCalendarPlus,
  FaUserCheck,
  FaReply,
  FaTruckMoving,
  FaBell,
  FaPlane,
  FaBed,
  FaCaretDown,
  FaCaretUp
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { featureToggleAPI } from '../../services/api';

const Sidebar = ({ collapsed }) => {
  const location = useLocation();
  const { hasPermission, hasRole, currentUser } = useAuth();
  const token = localStorage.getItem('token');
  const [featureToggles, setFeatureToggles] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState({});
  
  // Toggle submenu expansion
  const toggleSubmenu = (menuName) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };
  
  // Fetch feature toggles when component mounts
  useEffect(() => {
    const fetchFeatureToggles = async () => {
      try {
        const response = await featureToggleAPI.getToggles();
        
        console.log('Feature toggles response:', response.data);
        
        // Convert to a map for easier checking
        const togglesMap = {};
        response.data.forEach(toggle => {
          // Check if the toggle has feature_name or name property
          const name = toggle.feature_name || toggle.name;
          const isEnabled = toggle.enabled === 1 || toggle.enabled === true;
          console.log(`Toggle ${name} is ${isEnabled ? 'enabled' : 'disabled'}`);
          togglesMap[name] = isEnabled;
        });
        
        console.log('Feature toggles map:', togglesMap);
        setFeatureToggles(togglesMap);
      } catch (error) {
        console.error('Failed to fetch feature toggles:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchFeatureToggles();
    }
  }, [token]);
  
  // Define base menu items that will be available to everyone with permissions
  const baseMenuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <FaHome />,
      permission: null // Everyone can access dashboard
    },
    {
      name: 'Customers',
      path: '/customers',
      icon: <FaBuilding />,
      permission: 'customer_view',
      featureToggle: 'customer_management'
    },
    {
      name: 'Clients',
      path: '/clients',
      icon: <FaAddressCard />,
      permission: 'client_view',
      featureToggle: 'client_management'
    },
    {
      name: 'Events',
      path: '/events',
      icon: <FaCalendarAlt />,
      permission: 'event_view',
      featureToggle: 'event_management'
    },
    {
      name: 'Users',
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
      name: 'File Upload Settings',
      path: '/admin/file-upload-settings',
      icon: <FaCreditCard />,
      permission: 'role_view'
    },
    {
      name: 'Permissions',
      path: '/permissions',
      icon: <FaShieldAlt />,
      permission: 'permission_view'
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
    }
  ];
  
  // Start with base menu items
  const menuItems = [...baseMenuItems];
  
  // Always show customer, client, and event modules to admin users
  if (hasRole && hasRole(['Admin', 'admin', 'full_access'])) {
    // Override feature toggle checks for admin/full_access users
    menuItems.forEach(item => {
      if (item.name === 'Customers' || item.name === 'Clients' || item.name === 'Events') {
        // Remove feature toggle dependency for these items
        delete item.featureToggle;
      }
    });
    console.log('Admin/full_access user detected - customer, client, and event management should be visible regardless of feature toggles');
  }
  
  // Clear base menu items and define role-specific menu items
  if (hasRole) {
    // For Admin and full_access users - all capabilities should be visible
    if (hasRole(['Admin', 'admin', 'full_access'])) {
      console.log('Admin or full_access user detected - showing all capabilities');
      // Base items are already included - just add all additional items
      
      // Add Manage Events menu with submenu items
      menuItems.push({
        name: 'Manage Events',
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
            name: 'RSVPs',
            path: '/rsvps/dashboard',
            icon: <FaReply />,
            permission: null
          },
          {
            name: 'Travel',
            path: '/travel/list',
            icon: <FaPlane />,
            permission: null
          },
          {
            name: 'Accommodation',
            path: '/accommodation/list',
            icon: <FaBed />,
            permission: null
          },
          {
            name: 'Communications',
            path: '/communications',
            icon: <FaBell />,
            permission: null
          }
        ]
      });
      
      // Add Notifications module
      menuItems.push({
        name: 'Notifications',
        path: '/notifications',
        icon: <FaBell />,
        permission: null
      });
    }
    
    // For Customer Admin users
    else if (hasRole(['Customer Admin'])) {
      console.log('Customer Admin user detected - showing customer admin specific menu');
      // Start with an empty menu and add only what's needed
      menuItems.length = 0;
      
      // Add Dashboard
      menuItems.push({
        name: 'Dashboard',
        path: '/dashboard',
        icon: <FaHome />,
        permission: null
      });
      
      // Add Clients module
      menuItems.push({
        name: 'Clients',
        path: '/clients',
        icon: <FaAddressCard />,
        permission: null
      });
      
      // Add Manage Events menu with submenu items for Customer Admin
      menuItems.push({
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
            name: 'RSVPs',
            path: '/rsvps/dashboard',
            icon: <FaReply />,
            permission: null
          },
          {
            name: 'Travel',
            path: '/travel/list',
            icon: <FaPlane />,
            permission: null
          },
          {
            name: 'Accommodation',
            path: '/accommodation/list',
            icon: <FaBed />,
            permission: null
          },
          {
            name: 'Communications',
            path: '/communications',
            icon: <FaBell />,
            permission: null
          }
        ]
      });
      
      // Add Team module
      menuItems.push({
        name: 'Team',
        path: '/team',
        icon: <FaUsers />,
        permission: null
      });
      
      // Add Employees module
      menuItems.push({
        name: 'Employees',
        path: '/employees',
        icon: <FaUserFriends />,
        permission: null
      });
    }
    
    // For Client Admin users
    else if (hasRole(['Client Admin'])) {
      console.log('Client Admin user detected - showing client admin specific menu');
      // Start with an empty menu and add only what's needed
      menuItems.length = 0;
      
      // Add Dashboard
      menuItems.push({
        name: 'Dashboard',
        path: '/dashboard',
        icon: <FaHome />,
        permission: null
      });
      
      // Add Manage Events menu with submenu items for Client Admin
      menuItems.push({
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
            name: 'RSVPs',
            path: '/rsvps/dashboard',
            icon: <FaReply />,
            permission: null
          },
          {
            name: 'Travel',
            path: '/travel/list',
            icon: <FaPlane />,
            permission: null
          },
          {
            name: 'Accommodation',
            path: '/accommodation/list',
            icon: <FaBed />,
            permission: null
          }
        ]
      });
    }
  }
  
  // Always add Feature Toggles menu item for admin for admin users only
  if (hasRole && hasRole(['Admin', 'admin'])) {
    menuItems.push({
      name: 'Feature Toggles',
      path: '/roles/feature-toggles',
      icon: <FaToggleOn />,
      permission: null
    });
  }
  
  // For non-admin users who have payment_view permission, show payment module if feature toggle is enabled
  if (hasPermission(['payment_view']) && featureToggles['payment_integration']) {
    console.log('Non-admin user with payment_view permission - adding Payment module');
    menuItems.push({
      name: 'Payment',
      path: '/payment',
      icon: <FaCreditCard />,
      permission: 'payment_view',
      featureToggle: 'payment_integration'
    });
  }
  
  // Add Feature Toggles for full_access users who are not admins
  if (hasRole && hasRole(['full_access']) && !hasRole(['Admin', 'admin'])) {
    menuItems.push({
      name: 'Feature Toggles',
      path: '/roles/feature-toggles',
      icon: <FaToggleOn />,
      permission: null
    });
  }

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        {!collapsed && <h4 className="m-0">EmployDEX</h4>}
        {collapsed && <h4 className="m-0">E</h4>}
      </div>
      <div className="sidebar-menu">
        {menuItems
          .filter(item => !loading && (!item.featureToggle || featureToggles[item.featureToggle]))
          .filter(item => !item.permission || hasPermission([item.permission]))
          .map((item, index) => (
            item.submenu ? (
              <div key={index} className="sidebar-submenu-container">
                <div 
                  className={`sidebar-link ${item.items?.some(subItem => location.pathname === subItem.path) ? 'active' : ''}`}
                  onClick={() => toggleSubmenu(item.name)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="sidebar-text">{item.name}</span>
                      <span className="submenu-icon">
                        {expandedMenus[item.name] ? <FaCaretUp /> : <FaCaretDown />}
                      </span>
                    </>
                  )}
                </div>
                {expandedMenus[item.name] && !collapsed && (
                  <div className="sidebar-submenu">
                    {item.items.map((subItem, subIndex) => (
                      <Link
                        key={`${index}-${subIndex}`}
                        to={subItem.path}
                        className={`sidebar-link submenu-link ${
                          location.pathname === subItem.path ? 'active' : ''
                        }`}
                      >
                        <span className="sidebar-icon">{subItem.icon}</span>
                        <span className="sidebar-text">{subItem.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link 
                key={index} 
                to={item.path} 
                className={`sidebar-link ${
                  location.pathname === item.path ? 'active' : ''
                }`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                {!collapsed && <span className="sidebar-text">{item.name}</span>}
              </Link>
            )
          ))
        }
      </div>
      <div className="sidebar-footer">
        {!collapsed && <span>EmployDEX &copy; 2025</span>}
      </div>
    </div>
  );
};

export default Sidebar;
