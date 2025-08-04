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
  FaCaretUp,
  FaHandMiddleFinger,
  FaUserPlus,
  FaUsersCog,
  FaPlusSquare,
  FaTag,
  FaTruck
} from 'react-icons/fa';
import {FaCar} from 'react-icons/fa';
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
  
  // Initialize final menu items array
  const [finalMenuItems, setFinalMenuItems] = useState([]);

  // Define base menu items that will be available to everyone with permissions
  const baseMenuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <FaHome />,
      permission: null // Everyone can access dashboard
    },
    {
      name: 'Pricing',
      path: '/pricing',
      icon: <FaTag />,
      permission: null // Everyone can access pricing
    },
    
];
    // Start with base menu items
    const superAdminMenuItems = []; 
    
    // Override feature toggle checks for admin/full_access users
    superAdminMenuItems.push({
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
  });
    // Add Manage Customers menu with submenu items
    superAdminMenuItems.push({
  name: 'Manage Customers',
  icon: <FaBuilding />,
  path: '/customers',
  permission: null,

    })
  ;
  
      // Base items are already included - just add all additional items
            const customerMenuItems = [];
              // Add Team module
              customerMenuItems.push({
                name: 'Manage Team',
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
                  {
                    name: 'Add Employee',
                    path: '/employees/create',
                    icon: <FaUserPlus />,
                    permission: 'employee_create'
                  },
                  {
                    name: 'Teams',
                    path: '/teams/list',
                    icon: <FaUsers />,
                    permission: 'team_view'
                  },
                  {
                    name: 'Create Team',
                    path: '/teams/create',
                    icon: <FaUsersCog />,
                    permission: 'team_create'
                  },
                  {
                    name: 'Departments',
                    path: '/departments/list',
                    icon: <FaBuilding />,
                    permission: 'department_view'
                  },
                  {
                    name: 'Add Department',
                    path: '/departments/create',
                    icon: <FaPlusSquare />,
                    permission: 'department_create'
                  }
                ]
              });
            
            // Add Manage Clients menu with submenu items
            customerMenuItems.push({
              name: 'Manage Clients',
              icon: <FaAddressCard />,
              permission: null,
              path: '/clients',
            });
            
            // Add Venue Management menu item (only for admin and customer_admin)
            
              customerMenuItems.push({
                name: 'Venue Management',
                icon: <FaBuilding />,
                permission: null,
                path: '/venues/list',
              });
            
            
            // Add Vendor Management menu item (only for admin and customer_admin)
            
              customerMenuItems.push({
                name: 'Vendor Management',
                icon: <FaTruck />,
                permission: null,
                path: '/vendors/list',
              });
            
      
      // Add Manage Events menu with submenu items
      customerMenuItems.push({
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
          // Add Notifications module
        {
        name: 'Notifications',
        path: '/notifications',
        icon: <FaBell />,
        permission: null
      }
        ]
      });
      
      
      // Add Logistics menu with submenu items
      customerMenuItems.push({
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
            name: 'Manage Travel',
            path: '/logistics/travel',
            icon: <FaPlane />,
            permission: null
          },
          {
            name: 'Manage Accommodation',
            path: '/logistics/accommodation',
            icon: <FaBed />,
            permission: null
          },
          {
            name: 'Manage Vehicle Allocations',
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
      });
    
      // Base items are already included - just add all additional items
      const clientMenuItems = [];
      
      // Add Manage Events menu with submenu items for Client Admin
      clientMenuItems.push({
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
      });
    
    
  
  // Super simplified approach - always show all menus to everyone
  // This breaks the infinite loop by not using any state that changes frequently
  useEffect(() => {
    // Set a basic menu to start with - just show the baseMenuItems
    // This avoids any dependency on hasRole which seems to be causing the issue
    setFinalMenuItems([...baseMenuItems]);
    
    // Wait a brief moment to let React stabilize, then update menu based on role
    const timer = setTimeout(() => {
      if (hasRole) {
        try {
          // Determine which items to show based on role
          if (hasRole(['Admin', 'admin', 'full_access'])) {
            setFinalMenuItems([...baseMenuItems, ...superAdminMenuItems, ...customerMenuItems]);
          } else if (hasRole(['customer_admin'])) {
            setFinalMenuItems([...baseMenuItems, ...customerMenuItems]);
          } else if (hasRole(['client_admin'])) {
            setFinalMenuItems([...baseMenuItems, ...clientMenuItems]);
          }
          // If none of the above, we've already set baseMenuItems
        } catch (error) {
          console.error('Error setting menu items:', error);
        }
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []); // Run once on mount
  

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        {!collapsed && <h4 className="m-0">EmployDEX</h4>}
        {collapsed && <h4 className="m-0">E</h4>}
      </div>
      <div className="sidebar-menu">
        {finalMenuItems
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
