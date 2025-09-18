import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Nav } from 'react-bootstrap';

// Layout Components
import MainLayout from './components/common/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
// import Unauthorized from './components/common/Unauthorized';

// Authentication Components
import Login from './components/authentication/Login';
import Register from './components/authentication/Register';
import ForgotPassword from './components/authentication/ForgotPassword';
import ResetPassword from './components/authentication/ResetPassword';

// Dashboard Components
// import Dashboard from './components/dashboard/Dashboard';
import DashboardSelector from './components/dashboard/DashboardSelector';

// Customer Management Components
import CustomerList from './components/customers/CustomerList';
import CustomerDetails from './components/customers/CustomerDetail';
import CustomerCreate from './components/customers/CustomerCreate';
import CustomerEdit from './components/customers/CustomerEdit';
import CustomerBulkImport from './components/customers/CustomerImport';

// Client Management Components
import ClientList from './components/clients/ClientList';
import ClientDetails from './components/clients/ClientDetail';
import ClientCreate from './components/clients/ClientCreate';
import ClientEdit from './components/clients/ClientEdit';
import ClientBulkImport from './components/clients/ClientImport';

// User Management Components
import UserList from './components/users/UserList';
import UserDetails from './components/users/UserDetails';
import UserCreate from './components/users/UserCreate';
import UserEdit from './components/users/UserEdit';
import UserBulkUpload from './components/users/UserBulkUpload';


// Role Management Components
import RoleList from './components/roles/RoleList';
import RoleDetails from './components/roles/RoleDetails';
import RoleCreate from './components/roles/RoleCreate';
import RoleEdit from './components/roles/RoleEdit';
import RoleBulkUpload from './components/roles/RoleBulkUpload';

// Feature toggle components
import FeatureToggleList from './components/feature/FeatureToggleList';


// Permission Management Components
import PermissionList from './components/permissions/PermissionList';
import PermissionDetails from './components/permissions/PermissionDetails';
import PermissionCreate from './components/permissions/PermissionCreate';
import PermissionEdit from './components/permissions/PermissionEdit';

// Logistics Components
import LogisticsDashboard from './components/logistics/LogisticsDashboard';
import TravelManagement from './components/logistics/TravelManagement';
import AccommodationManagement from './components/logistics/AccommodationManagement';
import VehicleAllocation from './components/logistics/VehicleAllocation';
import GuestLogisticsProfile from './components/logistics/GuestLogisticsProfile';
import LogisticsReports from './components/logistics/LogisticsReports';

// Events and Related Components
import EventList from './components/events/EventList';
import EventCreate from './components/events/EventCreate';
import EventDetail from './components/events/EventDetail';
import EventEdit from './components/events/EventEdit';
import EventCalendar from './components/events/EventCalendar';

import SubeventList from './components/subevents/SubeventList';
import SubeventCreate from './components/subevents/SubeventCreate';
import SubeventDetail from './components/subevents/SubeventDetail';
import SubeventAllocation from './components/subevents/SubeventAllocation';
import SubeventTimeline from './components/subevents/SubeventTimeline';

import GuestList from './components/guests/GuestList';
import GuestGroupManagement from './components/guests/GuestGroupManagement';
import GuestCreate from './components/guests/GuestCreate';
import GuestDetail from './components/guests/GuestDetail';
import GuestImport from './components/guests/GuestImport';

import RSVPList from './components/rsvp/RSVPForm';
// import RSVPCalendar from './components/rsvp/RSVPCalendar';
import RSVPBulkManagement from './components/rsvp/RSVPBulkManagement';
import RSVPDashboard from './components/rsvp/RSVPDashboard';
// Invite Management Components
import InviteList from './components/invites/InviteList';
import InviteCreate from './components/invites/InviteCreate';
import InviteSend from './components/invites/InviteSend';
import InviteAnalytics from './components/invites/InviteAnalytics';
import SendInvite from './components/invites/SendInvite';
import RSVPConfirmation from './components/invites/RSVPConfirmation';

// Team Management Components
import TeamList from './components/teams/TeamList';
import TeamCreate from './components/teams/TeamCreate';
import TeamDetail from './components/teams/TeamDetail';

// Employee Management Components
import EmployeeList from './components/employees/EmployeeList';
import EmployeeCreate from './components/employees/EmployeeCreate';
import EmployeeDetail from './components/employees/EmployeeDetail';

// Department Management Components
import DepartmentList from './components/departments/DepartmentList';
import DepartmentCreate from './components/departments/DepartmentCreate';

// Vendor Management Components
import VendorList from './components/vendors/VendorList';
import VendorCreate from './components/vendors/VendorCreate';
import VendorDetail from './components/vendors/VendorDetail';

// Venue Management Components
import VenueList from './components/venues/VenueList';
import VenueCreate from './components/venues/VenueCreate';
import VenueDetail from './components/venues/VenueDetail';
// Logging Components
import ActivityLogs from './components/logging/ActivityLogs';

// Payment Components
import PaymentAdmin from './pages/admin/PaymentAdmin';
import FileUploadConfig from './components/fileupload/FileUploadConfig';
import RSVPForm from './components/rsvp/RSVPForm';
import Pricing from './components/pricing/Pricing';

// Placeholder components for routes that don't have implementations yet
// const TravelList = () => <div className="container mt-4"><h2>Travel List</h2><p>This feature is coming soon.</p></div>;
// const AccommodationList = () => <div className="container mt-4"><h2>Accommodation List</h2><p>This feature is coming soon.</p></div>;
// Placeholder components for communications and notifications
const DepartmentDetail = () => <div className="container mt-4"><h2>Department Details</h2><p>This feature is coming soon.</p></div>;
const CommunicationsList = () => <div className="container mt-4"><h2>Communications</h2><p>This feature is coming soon.</p></div>;
const NotificationsList = () => <div className="container mt-4"><h2>Notifications</h2><p>This feature is coming soon.</p></div>;
const AnalyticsDashboard = () => <div className="container mt-4"><h2>Analytics Dashboard</h2><p>This feature is coming soon.</p></div>;

function App() {
  const { isAuthenticated, isLoading, currentUser, hasRole } = useAuth();
  
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Create a helper function to handle unauthorized access
  const renderUnauthorized = () => {
    return (
      <div className="unauthorized-container">
        <h2>Unauthorized Access</h2>
        <p>You do not have permission to access this resource.</p>
        <Nav.Link as={Link} to="/dashboard">Return to Dashboard</Nav.Link>
      </div>
    );
  };
  
  return (
    <React.Fragment>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/unauthorized" element={renderUnauthorized()} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardSelector />} />
          
          {/* Customer Management Routes */}
          <Route path="customers">
            <Route index element={<CustomerList />} />
            <Route path=":id" element={<CustomerDetails />} />
            <Route path="create" element={<CustomerCreate />} />
            <Route path="edit/:id" element={<CustomerEdit />} />
            <Route path="import" element={<CustomerBulkImport />} />
          </Route>
          
          {/* Client Management Routes */}
          <Route path="clients">
            <Route index element={<ClientList />} />
            <Route path=":id" element={<ClientDetails />} />
            <Route path="create" element={<ClientCreate />} />
            <Route path=":id/edit" element={<ClientEdit />} />
            <Route path="import" element={<ClientBulkImport />} />
          </Route>
          
          {/* User Management Routes */}
          <Route path="users">
            <Route index element={<UserList />} />
            <Route path=":id" element={<UserDetails />} />
            <Route path="create" element={<UserCreate />} />
            <Route path="edit/:id" element={<UserEdit />} />
            <Route path="bulk-upload" element={<UserBulkUpload />} />
          </Route>
          
          {/* Role Management Routes */}
          <Route path="roles">
            <Route index element={<RoleList />} />
            <Route path=":id" element={<RoleDetails />} />
            <Route path="create" element={<RoleCreate />} />
            {hasRole && hasRole(['Admin', 'admin', 'full_access']) && (
              <Route path="feature-toggles" element={<FeatureToggleList />} />
            )}
            <Route path="edit/:id" element={<RoleEdit />} />
            <Route path="bulk-upload" element={<RoleBulkUpload />} />
          </Route>
          
          {/* Permission Management Routes */}
          <Route path="permissions">
            <Route index element={<PermissionList />} />
            <Route path=":id" element={<PermissionDetails />} />
            <Route path="create" element={<PermissionCreate />} />
            <Route path="edit/:id" element={<PermissionEdit />} />
          </Route>
          
          {/* Logging Routes */}
          <Route path="logs" element={<ActivityLogs />} />
          
          {/* Payment Routes */}
          <Route path="payment" element={<PaymentAdmin />} />

          {/* File Upload Widget Routes */}
          <Route path="admin/file-upload-settings" element={<FileUploadConfig />} />

          {/* Events Routes */}
          <Route path="events">
            <Route index element={<Navigate to="/events/list" />} />
            <Route path="list" element={<EventList />} />
            <Route path="create" element={<EventCreate />} />
            <Route path=":id" element={<EventDetail />} />
            <Route path=":id/edit" element={<EventEdit />} />
            <Route path="calendar" element={<EventCalendar />} />
          </Route>

          {/* SubEvents Routes */}
          <Route path="subevents">
            <Route index element={<Navigate to="/subevents/list" />} />
            <Route path="list" element={<SubeventList />} />
            <Route path="create" element={<SubeventCreate />} />
            <Route path=":id" element={<SubeventDetail />} />
            <Route path="allocation" element={<SubeventAllocation />} />
            <Route path="timeline" element={<SubeventTimeline />} />
          </Route>

          {/* Guests Routes */}
          <Route path="guests">
            <Route index element={<Navigate to="/guests/list" />} />
            <Route path="list" element={<GuestList />} />
            <Route path="create" element={<GuestCreate />} />
            <Route path="import" element={<GuestImport />} />
            <Route path=":id" element={<GuestDetail />} />
            <Route path=":id/edit" element={<GuestCreate />} />
            <Route path="groups" element={<GuestGroupManagement />} />
          </Route>

          {/* Invite Routes */}
          <Route path="invites">
            <Route index element={<InviteList />} />
            <Route path="create" element={<InviteCreate />} />
            <Route path=":id/view" element={<InviteList />} />
            <Route path=":id/edit" element={<InviteCreate />} />
            <Route path=":versionId/send" element={<InviteSend />} />
            <Route path=":versionId/analytics" element={<InviteAnalytics />} />
          </Route>

          {/* RSVPs Routes */}
          <Route path="rsvps">
            <Route index element={<Navigate to="/rsvps/dashboard" />} />
            <Route path="list" element={<Navigate to="/rsvps/dashboard" />} />
            <Route path="form" element={<RSVPForm />} />
            <Route path="bulk" element={<RSVPBulkManagement />} />
            <Route path="dashboard" element={<RSVPDashboard />} />
            <Route path="send" element={<SendInvite />} />
          </Route>

          {/* Public RSVP Confirmation Route */}
          <Route path="/rsvp/confirm/:token" element={<RSVPConfirmation />} />

          {/* Logistics Routes */}
          <Route path="logistics">
            <Route index element={<Navigate to="/logistics/dashboard" />} />
            <Route path="dashboard" element={<LogisticsDashboard />} />
            <Route path="travel" element={<TravelManagement />} />
            <Route path="accommodation" element={<AccommodationManagement />} />
            <Route path="vehicles" element={<VehicleAllocation />} />
            <Route path="guest/:id" element={<GuestLogisticsProfile />} />
            <Route path="reports" element={<LogisticsReports />} />
          </Route>

          {/* Team Routes */}
          <Route path="teams">
            <Route index element={<Navigate to="/teams/list" />} />
            <Route path="list" element={<TeamList />} />
            <Route path="create" element={<TeamCreate />} />
            <Route path=":id" element={<TeamDetail />} />
            <Route path=":id/edit" element={<TeamCreate />} />
          </Route>

          {/* Employees Routes */}
          <Route path="employees">
            <Route index element={<Navigate to="/employees/list" />} />
            <Route path="list" element={<EmployeeList />} />
            <Route path="create" element={<EmployeeCreate />} />
            <Route path=":id" element={<EmployeeDetail />} />
            <Route path=":id/edit" element={<EmployeeCreate />} />
          </Route>
          
          {/* Departments Routes */}
          <Route path="departments">
            <Route index element={<Navigate to="/departments/list" />} />
            <Route path="list" element={<DepartmentList />} />
            <Route path="create" element={<DepartmentCreate />} />
            <Route path=":id" element={<DepartmentDetail />} />
            <Route path=":id/edit" element={<DepartmentCreate />} />
          </Route>
          
          {/* Vendors Routes - Restricted to admin and Customer Admin */}
          <Route path="vendors">
            <Route 
              index 
              element={
                hasRole(['admin', 'Admin', 'full_access', 'Customer Admin']) ? 
                <Navigate to="/vendors/list" /> : 
                <Navigate to="/dashboard" />
              } 
            />
            <Route 
              path="list" 
              element={
                hasRole(['admin', 'Admin', 'full_access', 'Customer Admin']) ? 
                <VendorList /> : 
                <Navigate to="/dashboard" />
              } 
            />
            <Route 
              path="create" 
              element={
                hasRole(['admin', 'Admin', 'full_access', 'Customer Admin']) ? 
                <VendorCreate /> : 
                <Navigate to="/dashboard" />
              } 
            />
            <Route 
              path=":id" 
              element={
                hasRole(['admin', 'Admin', 'full_access', 'Customer Admin']) ? 
                <VendorDetail /> : 
                <Navigate to="/dashboard" />
              } 
            />
            <Route 
              path=":id/edit" 
              element={
                hasRole(['admin', 'Admin', 'full_access', 'Customer Admin']) ? 
                <VendorCreate /> : 
                <Navigate to="/dashboard" />
              } 
            />
          </Route>
          
          {/* Venues Routes - Restricted to admin and Customer Admin */}
          <Route path="venues">
            <Route index element={<Navigate to="/venues/list" />} />
            <Route path="list" element={<VenueList />} />
            <Route path="create" element={<VenueCreate />} />
            <Route path=":id" element={<VenueDetail />} />
            <Route path=":id/edit" element={<VenueCreate />} />
          </Route>

          {/* Communications Routes */}
          <Route path="communications">
            <Route index element={<CommunicationsList />} />
          </Route>

          {/* Notifications Routes */}
          <Route path="notifications">
            <Route index element={<NotificationsList />} />
          </Route>

          {/* Analytics Routes */}
          <Route path="analytics">
            <Route index element={<AnalyticsDashboard />} />
          </Route>
          
          {/* Pricing Route */}
          <Route path="pricing" element={<Pricing />} />
        </Route>
        
        {/* Catch All Route */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </React.Fragment>
  );
}

export default App;
