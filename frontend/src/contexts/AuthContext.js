import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import jwt_decode from 'jwt-decode';
import axios from 'axios';
import { setAuthToken } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext({
  currentUser: null,
  token: null,
  isAuthenticated: false,
  permissions: [],
  roles: [],
  isLoading: false,
  login: () => Promise.reject('Auth context not initialized'),
  logout: () => {},
  hasPermission: () => false
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('useAuth() was called outside of AuthProvider context');
    return {
      currentUser: null,
      token: null,
      isAuthenticated: false,
      permissions: [],
      roles: [],
      isLoading: false,
      login: () => Promise.reject('Auth context not initialized'),
      logout: () => {},
      hasPermission: () => false
    };
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch (_) {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [permissions, setPermissions] = useState(() => {
    try {
      const stored = localStorage.getItem('permissions');
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });
  const [roles, setRoles] = useState(() => {
    try {
      const stored = localStorage.getItem('roles');
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();

  const logout = useCallback(() => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Reset state
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setPermissions([]);
    setRoles([]);
    
    // Remove auth header
    delete axios.defaults.headers.common['Authorization'];
    
    // Redirect to login
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    // Verify token and set authentication state
    const verifyToken = async () => {
      if (token) {
        try {
          // Set default auth header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Check if token is expired
          const decoded = jwt_decode(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp < currentTime) {
            // Token is expired
            logout();
            return;
          }
          
          // Set user information from token (fallback if localStorage missing)
          // The JWT token payload structure has user data nested under 'user'
          if (!currentUser) {
            const decodedUser = {
              id: decoded.user?.id,
              email: decoded.user?.email,
              firstName: decoded.user?.first_name,
              lastName: decoded.user?.last_name
            };
            setCurrentUser(decodedUser);
            try { localStorage.setItem('currentUser', JSON.stringify(decodedUser)); } catch (_) {}
          }
          
          // Set permissions and roles - correctly access from decoded.user
          if (!permissions || permissions.length === 0) {
            const perms = decoded.user?.permissions || [];
            setPermissions(perms);
            try { localStorage.setItem('permissions', JSON.stringify(perms)); } catch (_) {}
          }
          if (!roles || roles.length === 0) {
            const r = decoded.user?.roles || [];
            setRoles(r);
            try { localStorage.setItem('roles', JSON.stringify(r)); } catch (_) {}
          }
          
          // Debug the permissions extraction
          console.log('Token decoded:', decoded);
          console.log('User permissions:', decoded.user?.permissions);
          console.log('User roles:', decoded.user?.roles);
          
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Token verification error:', error);
          logout();
        }
      }
      
      setIsLoading(false);
    };

    verifyToken();
  }, [token, logout]);
  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/authentication/login', { username, password });
      const { token: newToken, user } = response.data;
      
      console.log('Login successful, received token:', newToken);
      
      // Store token in localStorage
      localStorage.setItem('token', newToken);
      
      // Set token in state
      setToken(newToken);
      
      // Set auth token for the API service - this updates axios defaults
      setAuthToken(newToken);
      
      // Decode token to get user info
      const decoded = jwt_decode(newToken);
      console.log('Decoded token:', decoded);
      
      // Set user info
      const hydratedUser = {
        id: user.id || decoded.user?.id,
        email: user.email || decoded.user?.email,
        firstName: user.first_name || decoded.user?.first_name,
        lastName: user.last_name || decoded.user?.last_name
      };
      setCurrentUser(hydratedUser);
      try { localStorage.setItem('currentUser', JSON.stringify(hydratedUser)); } catch (_) {}
      
      // Set permissions and roles from the decoded token
      // The JWT token payload structure has user data nested under 'user'
      const userPermissions = user.permissions || decoded.user?.permissions || [];
      const userRoles = user.roles || decoded.user?.roles || [];
      
      console.log('Setting permissions:', userPermissions);
      console.log('Setting roles:', userRoles);
      
      setPermissions(userPermissions);
      setRoles(userRoles);
      try {
        localStorage.setItem('permissions', JSON.stringify(userPermissions));
        localStorage.setItem('roles', JSON.stringify(userRoles));
      } catch (_) {}
      
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Login failed. Please check your credentials.'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/authentication/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Registration failed.'
      };
    }
  };


  const forgotPassword = async (email) => {
    try {
      const response = await axios.post('/api/authentication/forgot-password', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to process password reset request.'
      };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const response = await axios.post('/api/authentication/reset-password', { token, password });
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to reset password.'
      };
    }
  };

  // Helper method to check if user has required permissions
  const hasPermission = (requiredPermissions) => {
    // Handle null/empty permissions
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }
    
    // Safely check if user has any of the required permissions
    if (!permissions || !Array.isArray(permissions)) {
      return false; // No permissions available
    }
    
    return requiredPermissions.some(permission => 
      permissions.includes(permission)
    );
  };

  // Helper method to check if user has specific roles
  const hasRole = (requiredRoles) => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (!roles || roles.length === 0) return false;
    
    return requiredRoles.some(role => roles.includes(role));
  };

  const value = {
    currentUser,
    isAuthenticated,
    permissions,
    roles,
    isLoading,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    hasPermission,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
