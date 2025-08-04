import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Set the JWT token for authenticated requests
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Initialize token from localStorage if it exists
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

// Add a request interceptor to ensure token is included in every request
api.interceptors.request.use(
  config => {
    // Ensure token is added to each request
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common error scenarios
    const { response } = error;

    if (response) {
      // Handle specific status codes
      switch (response.status) {
        case 401:
          // Unauthorized - token expired or invalid
          console.log('Authentication error:', error);
          
          // Only redirect if not a background API check
          const isBackgroundRequest = error.config.url.includes('/check-auth') || 
                                      error.config.headers['X-Background-Request'] === 'true';
          
          if (!isBackgroundRequest) {
            toast.error('Authentication session expired. Please log in again.');
            // Clear token and redirect to login
            setAuthToken(null);
            window.location.href = '/login';
          } else {
            console.log('Background authentication request failed, not redirecting');
          }
          break;
        case 403:
          // Forbidden - insufficient permissions
          toast.error('You do not have permission to perform this action.');
          break;
        case 404:
          // Not found
          console.error(`API 404 Error: ${error.config.url} not found`);
          toast.error(`Resource not found: ${error.config.url.split('/').pop()}`, {
            autoClose: 5000,
            position: toast.POSITION.BOTTOM_RIGHT
          });
          break;
        case 422:
          // Validation errors
          if (response.data?.errors) {
            const errors = response.data.errors;
            errors.forEach(err => toast.error(err.msg));
          } else {
            toast.error('Validation error. Please check your input.');
          }
          break;
        case 500:
          // Server error
          toast.error('Server error. Please try again later or contact support.');
          break;
        default:
          // Other errors
          toast.error(response.data?.error || 'An error occurred. Please try again.');
      }
    } else {
      // Network error or server not responding
      toast.error('Unable to connect to server. Please check your internet connection.');
    }

    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (credentials) => api.post('/authentication/login', credentials),
  register: (userData) => api.post('/authentication/register', userData),
  forgotPassword: (email) => api.post('/authentication/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/authentication/reset-password', { token, password }),
};

// User Management API
export const userAPI = {
  getUsers: (params) => api.get('/user_management/users', { params }),
  getUser: (id) => api.get(`/user_management/users/${id}`),
  createUser: (userData) => api.post('/user_management/users', userData),
  updateUser: (id, userData) => api.put(`/user_management/users/${id}`, userData),
  toggleUserStatus: (id, isActive) => api.patch(`/user_management/users/${id}/status`, { is_active: isActive }),
  deleteUser: (id) => api.delete(`/user_management/users/${id}`),
  uploadBulkUsers: (formData) => api.post('/user_management/users/bulk', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  downloadUserTemplate: () => api.get('/user_management/users/template', {
    responseType: 'blob'
  }),
};

// Role Management API
export const roleAPI = {
  getRoles: () => api.get('/role_management/roles'),
  getRole: (id) => api.get(`/role_management/roles/${id}`),
  createRole: (roleData) => api.post('/role_management/roles', roleData),
  updateRole: (id, roleData) => api.put(`/role_management/roles/${id}`, roleData),
  deleteRole: (id) => api.delete(`/role_management/roles/${id}`),
  uploadBulkRoles: (formData, onUploadProgress) => {
    return api.post('/role_management/roles/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    });
  },
  downloadRoleTemplate: () => {
    return api.get('/role_management/roles/template', {
      responseType: 'blob'
    }).then(response => {
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'role-template.csv');
      
      // Append to html page
      document.body.appendChild(link);
      
      // Force download
      link.click();
      
      // Clean up and remove the link
      link.parentNode.removeChild(link);
    });
  }
};

// Permission Management API
export const permissionAPI = {
  getPermissions: () => api.get('/permission_management/permissions'),
  getPermission: (id) => api.get(`/permission_management/permissions/${id}`),
  createPermission: (permissionData) => api.post('/permission_management/permissions', permissionData),
  updatePermission: (id, permissionData) => api.put(`/permission_management/permissions/${id}`, permissionData),
  assignPermissions: (roleId, permissions) => api.post('/permission_management/assign', { role_id: roleId, permissions }),
};

// Logging API
export const loggingAPI = {
  getLogs: (params) => api.get('/logging/activity', { params }),
  getActionTypes: () => api.get('/logging/actions'),
  getEntityTypes: () => api.get('/logging/entities'),
  getStats: () => api.get('/logging/stats'),
};

// Customer Management API
export const customerAPI = {
  getCustomers: (params) => api.get('/customers', { params }),
  getCustomer: (id) => api.get(`/customers/${id}`),
  createCustomer: (customerData) => api.post('/customers', customerData),
  updateCustomer: (id, customerData) => api.put(`/customers/${id}`, customerData),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
  uploadBulkCustomers: (formData) => api.post('/customers/bulk', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  downloadCustomerTemplate: () => api.get('/customers/template', {
    responseType: 'blob'
  }).then(response => {
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'customer-template.csv');
    
    // Append to html page
    document.body.appendChild(link);
    
    // Force download
    link.click();
    
    // Clean up and remove the link
    link.parentNode.removeChild(link);
  })
};

// Client Management API
export const clientAPI = {
  getClients: (params) => api.get('/clients', { params }),
  getClient: (id) => api.get(`/clients/${id}`),
  createClient: (clientData) => api.post('/clients', clientData),
  updateClient: (id, clientData) => api.put(`/clients/${id}`, clientData),
  deleteClient: (id) => api.delete(`/clients/${id}`),
  uploadBulkClients: (formData) => api.post('/clients/bulk', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  downloadClientTemplate: () => api.get('/clients/template', {
    responseType: 'blob'
  }).then(response => {
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'client-template.csv');
    
    // Append to html page
    document.body.appendChild(link);
    
    // Force download
    link.click();
    
    // Clean up and remove the link
    link.parentNode.removeChild(link);
  })
};

// Event Management API
export const eventAPI = {
  getEvents: (params) => api.get('/events', { params }),
  getEvent: (id) => api.get(`/events/${id}`),
  createEvent: (eventData) => api.post('/events', eventData),
  updateEvent: (id, eventData) => api.put(`/events/${id}`, eventData),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  getEventsByClient: (clientId) => api.get(`/clients/${clientId}/events`),
  // Fixed endpoint for event schedule - using correct path from comprehensive-crud
  getEventSchedule: (eventId) => api.get(`/comprehensive-crud/event-schedule/${eventId}`),
  getEventStats: (eventId) => api.get(`/events/${eventId}/stats`)
};

// Feature Toggles API
export const featureToggleAPI = {
  getToggles: () => api.get('/feature-toggles'),
  getToggle: (name) => api.get(`/feature-toggles/${name}`),
  updateToggle: (name, isEnabled) => api.patch('/feature-toggles/update', { name, is_enabled: isEnabled })
};

// Payment API
export const paymentAPI = {
  // QR Code operations
  getQrCodes: () => api.get('/payment/qr-codes'),
  getQrCode: (id) => api.get(`/payment/qr-codes/${id}`),
  deleteQrCode: (id) => api.delete(`/payment/qr-codes/${id}`),
  activateQrCode: (id) => api.post(`/payment/qr-codes/${id}/activate`),
  // Transactions
  getTransactions: (params) => api.get('/payment/transactions', { params }),
  getTransaction: (id) => api.get(`/payment/transactions/${id}`),
  // Special handling for file uploads with authentication
  uploadQrCode: (formData) => {
    const token = localStorage.getItem('token');
    return api.post('/payment/qr-codes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
  },
  // Feature toggle status
  getPaymentStatus: () => api.get('/payment/status')
};

// Subevent API
export const subeventAPI = {
  getSubevents: (params) => api.get('/comprehensive-crud/subevents', { params }),
  getSubevent: (id) => api.get(`/comprehensive-crud/subevents/${id}`),
  getSubeventsByEvent: (eventId) => api.get(`/comprehensive-crud/subevents?event_id=${eventId}`),
  createSubevent: (subeventData) => api.post('/comprehensive-crud/subevents', subeventData),
  updateSubevent: (id, subeventData) => api.put(`/comprehensive-crud/subevents/${id}`, subeventData),
  deleteSubevent: (id) => api.delete(`/comprehensive-crud/subevents/${id}`)
};

// RSVP API
export const rsvpAPI = {
  // RSVP operations
  getRsvps: (params) => api.get('/comprehensive-crud/guest-rsvp', { params }),
  getRsvp: (id) => api.get(`/comprehensive-crud/guest-rsvp/${id}`),
  createRsvp: (rsvpData) => api.post('/comprehensive-crud/guest-rsvp', rsvpData),
  updateRsvp: (id, rsvpData) => api.put(`/comprehensive-crud/guest-rsvp/${id}`, rsvpData),
  deleteRsvp: (id) => api.delete(`/comprehensive-crud/guest-rsvp/${id}`),
  
  // RSVP statistics
  getRsvpStats: (eventId) => api.get(`/rsvp/stats/${eventId}`),
  getRsvpStatsByEvent: () => api.get('/rsvp/stats'),
  getGuestsByRsvpStatus: (eventId, status) => api.get(`/rsvp/guests/${eventId}?status=${status}`),
  
  // Bulk operations
  bulkUpdateRsvp: (rsvpData) => api.post('/rsvp/bulk-update', rsvpData),
  sendRsvpReminders: (guestIds) => api.post('/rsvp/send-reminders', { guest_ids: guestIds }),
  exportRsvpData: (eventId) => api.get(`/rsvp/export/${eventId}`, {
    responseType: 'blob'
  }),
  importRsvpData: (eventId, formData) => {
    const token = localStorage.getItem('token');
    return api.post(`/rsvp/import/${eventId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
  }
};

// Logistics API for room allocation and travel arrangements
export const logisticsAPI = {
  // Accommodation operations for room allocation
  getAccommodations: (params) => api.get('/logistics/accommodations', { params }),
  getAccommodation: (id) => api.get(`/logistics/accommodations/${id}`),
  createAccommodation: (data) => api.post('/logistics/accommodations', data),
  updateAccommodation: (id, data) => api.put(`/logistics/accommodations/${id}`, data),
  deleteAccommodation: (id) => api.delete(`/logistics/accommodations/${id}`),
  
  // Room allocation operations for guests
  getRoomAllocations: (params) => api.get('/logistics/room-allocations', { params }),
  getRoomAllocationsByGuest: (guestId) => api.get(`/logistics/room-allocations/guest/${guestId}`),
  getRoomAllocationsByEvent: (eventId) => api.get(`/logistics/room-allocations/event/${eventId}`),
  allocateRoom: (allocationData) => api.post('/logistics/room-allocations', allocationData),
  updateRoomAllocation: (id, allocationData) => api.put(`/logistics/room-allocations/${id}`, allocationData),
  removeRoomAllocation: (id) => api.delete(`/logistics/room-allocations/${id}`),
  bulkAllocateRooms: (allocations) => api.post('/logistics/room-allocations/bulk', allocations),
  
  // Travel arrangement operations
  getTravelArrangements: (params) => api.get('/logistics/travel-arrangements', { params }),
  getTravelArrangementsByGuest: (guestId) => api.get(`/logistics/travel-arrangements/guest/${guestId}`),
  getTravelArrangementsByEvent: (eventId) => api.get(`/logistics/travel-arrangements/event/${eventId}`),
  createTravelArrangement: (data) => api.post('/logistics/travel-arrangements', data),
  updateTravelArrangement: (id, data) => api.put(`/logistics/travel-arrangements/${id}`, data),
  deleteTravelArrangement: (id) => api.delete(`/logistics/travel-arrangements/${id}`),
  bulkCreateTravelArrangements: (arrangements) => api.post('/logistics/travel-arrangements/bulk', arrangements),
  
  // Vehicle allocation operations
  getVehicles: (params) => api.get('/logistics/vehicles', { params }),
  getVehicle: (id) => api.get(`/logistics/vehicles/${id}`),
  createVehicle: (vehicleData) => api.post('/logistics/vehicles', vehicleData),
  updateVehicle: (id, vehicleData) => api.put(`/logistics/vehicles/${id}`, vehicleData),
  deleteVehicle: (id) => api.delete(`/logistics/vehicles/${id}`),
  allocateVehicle: (allocationData) => api.post('/logistics/vehicle-allocations', allocationData),
  getVehicleAllocations: (params) => api.get('/logistics/vehicle-allocations', { params }),
  
  // Logistics reports
  getLogisticsReports: (params) => api.get('/logistics/reports', { params }),
  getLogisticsReportsByType: (type, params) => api.get(`/logistics/reports/${type}`, { params }),
  exportLogisticsReport: (type, params) => api.get(`/logistics/reports/${type}/export`, {
    params,
    responseType: 'blob'
  }),
  
  // Logistics dashboard data
  getDashboardData: (params) => api.get('/logistics/dashboard', { params }),
  getDashboardSummary: (eventId) => api.get(`/logistics/dashboard/summary/${eventId}`),
  getScheduleOverview: (date, eventId) => api.get(`/logistics/dashboard/schedule`, {
    params: { date, event_id: eventId }
  })
};

// Team and Employee Management API
export const teamAPI = {
  getTeams: (params) => api.get('/employee-management/teams', { params }),
  getTeam: (id) => api.get(`/employee-management/teams/${id}`),
  createTeam: (teamData) => api.post('/employee-management/teams', teamData),
  updateTeam: (id, teamData) => api.put(`/employee-management/teams/${id}`, teamData),
  deleteTeam: (id) => api.delete(`/employee-management/teams/${id}`),
  getTeamMembers: (teamId) => api.get(`/employee-management/teams/${teamId}/members`),
  addTeamMember: (teamId, employeeId) => api.post(`/employee-management/teams/${teamId}/members`, { employee_id: employeeId }),
  removeTeamMember: (teamId, employeeId) => api.delete(`/employee-management/teams/${teamId}/members/${employeeId}`)
};

export const employeeAPI = {
  getEmployees: (params) => api.get('/employee-management/employees', { params }),
  getEmployee: (id) => api.get(`/employee-management/employees/${id}`),
  createEmployee: (employeeData) => api.post('/employee-management/employees', employeeData),
  updateEmployee: (id, employeeData) => api.put(`/employee-management/employees/${id}`, employeeData),
  deleteEmployee: (id) => api.delete(`/employee-management/employees/${id}`),
  getDepartments: () => api.get('/employee-management/departments'),
  createDepartment: (departmentData) => api.post('/employee-management/departments', departmentData),
  updateDepartment: (id, departmentData) => api.put(`/employee-management/departments/${id}`, departmentData),
  deleteDepartment: (id) => api.delete(`/employee-management/departments/${id}`)
};

// Vendor Management API
export const vendorAPI = {
  getVendors: (params) => api.get('/vendors', { params }),
  getVendor: (id) => api.get(`/vendors/${id}`),
  createVendor: (vendorData) => api.post('/vendors', vendorData),
  updateVendor: (id, vendorData) => api.put(`/vendors/${id}`, vendorData),
  deleteVendor: (id) => api.delete(`/vendors/${id}`),
  getVendorTypes: () => api.get('/vendors/types')
};

// Venue Management API
export const venueAPI = {
  // Basic CRUD operations
  getAllVenues: (params) => api.get('/venues', { params }),
  getCustomerVenues: (customerId, params) => api.get(`/venues/customer/${customerId}`, { params }),
  getVenue: (id) => api.get(`/venues/${id}`),
  createVenue: (venueData) => api.post('/venues', venueData),
  updateVenue: (id, venueData) => api.put(`/venues/${id}`, venueData),
  deleteVenue: (id) => api.delete(`/venues/${id}`),
  
  // Additional operations
  getVenueEvents: (venueId) => api.get(`/venues/${venueId}/events`),
  checkVenueAvailability: (venueId, startDate, endDate) => api.get(`/venues/${venueId}/availability`, { params: { start_date: startDate, end_date: endDate } }),
  getCustomers: () => api.get('/customers')
};

export default api;
