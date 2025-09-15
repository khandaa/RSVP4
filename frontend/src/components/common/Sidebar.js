import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/Sidebar.css';
import {
  FaCaretDown,
  FaCaretUp,
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { featureToggleAPI } from '../../services/api';
import { baseMenuItems } from '../sidebars/DefaultSidebar';
import { adminMenuItems } from '../sidebars/AdminSidebar';
import { customerMenuItems } from '../sidebars/CustomerSidebar';
import { clientMenuItems } from '../sidebars/ClientSidebar';
import { rsvpMenuItems } from '../sidebars/RSVPSidebar';

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
        const togglesMap = {};
        response.data.forEach(toggle => {
          const name = toggle.feature_name || toggle.name;
          const isEnabled = toggle.enabled === 1 || toggle.enabled === true;
          togglesMap[name] = isEnabled;
        });
        setFeatureToggles(togglesMap);
      } catch (error) {
        console.error('Failed to fetch feature toggles:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token && (hasRole(['Admin', 'admin', 'full_access']) || hasPermission(['feature_toggle_view']))) {
      fetchFeatureToggles();
    } else {
      setLoading(false);
    }
  }, [token, hasRole, hasPermission]);
  
  // Initialize final menu items array
  const [finalMenuItems, setFinalMenuItems] = useState([]);

    
    
  
  useEffect(() => {
    const getMenuItems = () => {
      let menuItems = [...baseMenuItems];

      console.log('hasRole:', hasRole);

      if (hasRole(['Admin', 'admin', 'full_access'])) {
        menuItems = [...menuItems, ...adminMenuItems, ...customerMenuItems];
      } else if (hasRole(['Customer Admin'])) {
        menuItems = [...menuItems, ...customerMenuItems];
      } else if (hasRole(['client_admin'])) {
        menuItems = [...menuItems, ...clientMenuItems];
      } else if (hasRole(['rsvp_user'])) { // Example role for RSVP
        menuItems = [...menuItems, ...rsvpMenuItems];
      }

      return menuItems;
    };

    setFinalMenuItems(getMenuItems());
  }, [hasRole]);
  

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
