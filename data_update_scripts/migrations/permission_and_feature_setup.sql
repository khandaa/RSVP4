-- =======================================
-- Permission and Feature Toggle Setup for RSVP4
-- Date: 2025-07-30
-- =======================================

-- Turn off foreign keys for batch operations
PRAGMA foreign_keys=OFF;

BEGIN TRANSACTION;

-- =======================================
-- PERMISSIONS FOR ALL ROUTES
-- =======================================

-- ================ CORE MODULES ================

-- Authentication Module
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('auth_login', 'Login to the system');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('auth_refresh', 'Refresh authentication token');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('auth_register', 'Register new user');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('auth_reset_password', 'Reset user password');

-- User Management Module
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('user_management_read', 'View users');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('user_management_create', 'Create users');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('user_management_update', 'Update users');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('user_management_delete', 'Delete users');

-- Role Management Module
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('role_management_read', 'View roles');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('role_management_create', 'Create roles');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('role_management_update', 'Update roles');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('role_management_delete', 'Delete roles');

-- Permission Management Module
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('permission_management_read', 'View permissions');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('permission_management_create', 'Create permissions');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('permission_management_update', 'Update permissions');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('permission_management_delete', 'Delete permissions');

-- Logging Module
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('logging_read', 'View system logs');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('logging_create', 'Create log entries');

-- Database Module
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('database_access', 'Access database operations');

-- Payment Module
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('payment_transactions_read', 'View payment transactions');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('payment_transactions_create', 'Create payment transactions');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('payment_transactions_update', 'Update payment transactions');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('payment_qr_codes_read', 'View payment QR codes');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('payment_qr_codes_create', 'Create payment QR codes');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('payment_qr_codes_update', 'Update payment QR codes');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('payment_qr_codes_delete', 'Delete payment QR codes');

-- ================ FEATURE TOGGLES ================
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('feature_toggles_read', 'View feature toggles');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('feature_toggles_update', 'Update feature toggles');

-- ================ WIDGET CONFIG ================
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('widget_config_read', 'View widget configurations');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('widget_config_update', 'Update widget configurations');

-- ================ FILE UPLOADS ================
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('file_upload_create', 'Upload files to the system');

-- ================ RSVP MODULES ================

-- Customer Management
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('customers_read', 'View customers');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('customers_create', 'Create customers');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('customers_update', 'Update customers');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('customers_delete', 'Delete customers');

-- Client Management
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('clients_read', 'View clients');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('clients_create', 'Create clients');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('clients_update', 'Update clients');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('clients_delete', 'Delete clients');

-- Event Management
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('events_read', 'View events');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('events_create', 'Create events');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('events_update', 'Update events');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('events_delete', 'Delete events');

-- Guest Management
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('guests_read', 'View guests');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('guests_create', 'Create guests');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('guests_update', 'Update guests');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('guests_delete', 'Delete guests');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('guests_bulk_import', 'Bulk import guests');

-- Venue Management
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('venues_read', 'View venues');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('venues_create', 'Create venues');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('venues_update', 'Update venues');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('venues_delete', 'Delete venues');

-- Master Data Management
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('master_data_read', 'View master data');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('master_data_create', 'Create master data');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('master_data_update', 'Update master data');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('master_data_delete', 'Delete master data');

-- Employee Management
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('employee_management_read', 'View employees');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('employee_management_create', 'Create employees');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('employee_management_update', 'Update employees');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('employee_management_delete', 'Delete employees');

-- ================ RSVP CRUD OPERATIONS ================

-- Subevent Management
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('subevents_crud', 'Manage subevents');

-- Guest Group Management
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('guest_groups_crud', 'Manage guest groups');

-- Vendor Management
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('vendors_crud', 'Manage vendors');

-- Room Management
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('rooms_crud', 'Manage rooms');

-- RSVP Roles Management
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('rsvp_roles_crud', 'Manage RSVP roles');

-- Notification Management
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('notifications_crud', 'Manage notifications');

-- Client Details
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('client_details_crud', 'Manage client details');

-- Event Details
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('event_details_crud', 'Manage event details');

-- Event Documents
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('event_documents_crud', 'Manage event documents');

-- Subevent Details
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('subevent_details_crud', 'Manage subevent details');

-- Guest Details
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('guest_details_crud', 'Manage guest details');

-- Guest Documents
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('guest_documents_crud', 'Manage guest documents');

-- Vendor Details
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('vendor_details_crud', 'Manage vendor details');

-- Venue Details
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('venue_details_crud', 'Manage venue details');

-- Employee Details
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('employee_details_crud', 'Manage employee details');

-- Team Details
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('team_details_crud', 'Manage team details');

-- Guest Event Allocation
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('guest_event_allocation_crud', 'Manage guest event allocations');

-- Guest Group Details
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('guest_group_details_crud', 'Manage guest group details');

-- Guest Travel
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('guest_travel_crud', 'Manage guest travel information');

-- Guest Accommodation
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('guest_accommodation_crud', 'Manage guest accommodation');

-- Guest Vehicle Allocation
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('guest_vehicle_allocation_crud', 'Manage guest vehicle allocations');

-- Vendor Event Allocation
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('vendor_event_allocation_crud', 'Manage vendor event allocations');

-- Venue Event Allocation
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('venue_event_allocation_crud', 'Manage venue event allocations');

-- Event Room Allocation
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('event_room_allocation_crud', 'Manage event room allocations');

-- Team Event Allocation
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('team_event_allocation_crud', 'Manage team event allocations');

-- Employee Role Allocation
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('employee_role_allocation_crud', 'Manage employee role allocations');

-- Employee Team Allocation
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('employee_team_allocation_crud', 'Manage employee team allocations');

-- Guest Communication
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('guest_communication_crud', 'Manage guest communications');

-- Guest RSVP
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('guest_rsvp_crud', 'Manage guest RSVPs');

-- Notification Templates
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('notification_templates_crud', 'Manage notification templates');

-- Task Assignment Details
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('task_assignment_details_crud', 'Manage task assignment details');

-- Task Event Subevent Mapping
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('task_event_subevent_mapping_crud', 'Manage task event/subevent mappings');

-- Client Meeting Notes
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('client_meeting_notes_crud', 'Manage client meeting notes');

-- Special Routes
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('guests_with_rsvp_read', 'View guests with RSVP status');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('event_schedule_read', 'View event schedules');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('venue_availability_read', 'Check venue availability');

-- ================ BULK RSVP MANAGEMENT ================
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('bulk_rsvp_management', 'Manage RSVPs in bulk');

-- ================ LOGISTICS MANAGEMENT ================
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('logistics_dashboard_access', 'Access logistics dashboard');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('logistics_reports_access', 'Access logistics reports');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('guest_logistics_profile_access', 'Access guest logistics profiles');

-- ================ NOTIFICATION SYSTEM ================
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('notification_scheduling_access', 'Access notification scheduling');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('notification_tracking_access', 'Access notification tracking');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('notification_history_access', 'Access notification history');

-- ================ DASHBOARD AND REPORTING ================
INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('dashboard_access', 'Access main dashboard');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('reports_access', 'Access reports');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('visualization_access', 'Access data visualizations');

INSERT OR IGNORE INTO permissions_master (name, description) 
VALUES ('export_data_access', 'Export data from reports');

-- =======================================
-- ASSIGN PERMISSIONS TO ADMIN AND FULL ACCESS ROLES
-- =======================================

-- Assign all permissions to Admin role (role_id=1)
INSERT OR IGNORE INTO role_permissions_tx (role_id, permission_id)
SELECT 
    1,
    permission_id
FROM permissions_master;

-- Assign all permissions to Full Access role (role_id=2)
INSERT OR IGNORE INTO role_permissions_tx (role_id, permission_id)
SELECT 
    2,
    permission_id
FROM permissions_master;

-- =======================================
-- FEATURE TOGGLES FOR ALL CAPABILITIES
-- =======================================

-- Core Features
INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('authentication', 'User authentication system', 1);

INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('user_management', 'User management system', 1);

INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('role_management', 'Role management system', 1);

INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('permission_management', 'Permission management system', 1);

-- RSVP Modules
INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('customer_management', 'Customer management module', 1);

INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('client_management', 'Client management module', 1);

INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('event_management', 'Event management module', 1);

INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('guest_management', 'Guest management module', 1);

INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('venue_management', 'Venue management module', 1);

INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('vendor_management', 'Vendor management module', 1);

INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('employee_management', 'Employee management module', 1);

-- Advanced RSVP Features
INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('rsvp_management', 'RSVP management module', 1);

INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('bulk_rsvp_management', 'Bulk RSVP management capabilities', 1);

INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('logistics_management', 'Logistics management module', 1);

INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('notification_system', 'Notification system module', 1);

INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('dashboard_reporting', 'Dashboard and reporting system', 1);

INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('data_visualization', 'Data visualization capabilities', 1);

-- Payment Features
INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('payment_system', 'Payment processing system', 1);

INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('payment_qr_codes', 'Payment via QR codes', 1);

-- Document Management
INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('document_management', 'Document management system', 1);

-- Task Management
INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('task_management', 'Task management system', 1);

-- Meeting Notes
INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('meeting_notes', 'Meeting notes system', 1);

-- No changelog table available

COMMIT;

PRAGMA foreign_keys=ON;
