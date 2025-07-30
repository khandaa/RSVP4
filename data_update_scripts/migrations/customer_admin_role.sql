-- =======================================
-- Customer Admin Role Setup for RSVP4
-- Date: 2025-07-30
-- =======================================

-- Turn off foreign keys for batch operations
PRAGMA foreign_keys=OFF;

BEGIN TRANSACTION;

-- Create customer_admin role
INSERT OR IGNORE INTO roles_master (name, description)
VALUES ('Customer Admin', 'Role for customer administrators with permissions to manage users, events, guests, and teams');

-- Get the role_id for the new customer_admin role
-- SQLite doesn't support variables, so we'll use direct joins in the INSERT statements

-- Assign user management permissions
INSERT OR IGNORE INTO role_permissions_tx (role_id, permission_id)
SELECT 
    (SELECT role_id FROM roles_master WHERE name = 'Customer Admin'),
    permission_id
FROM permissions_master 
WHERE name IN (
    'user_management_read',
    'user_management_create',
    'user_management_update',
    'user_management_delete'
);

-- Assign event management permissions
INSERT OR IGNORE INTO role_permissions_tx (role_id, permission_id)
SELECT 
    (SELECT role_id FROM roles_master WHERE name = 'Customer Admin'),
    permission_id
FROM permissions_master 
WHERE name IN (
    'events_read',
    'events_create',
    'events_update',
    'events_delete',
    'event_details_crud',
    'event_documents_crud',
    'event_schedule_read',
    'event_room_allocation_crud',
    'task_event_subevent_mapping_crud',
    'subevents_crud',
    'subevent_details_crud'
);

-- Assign guest management permissions
INSERT OR IGNORE INTO role_permissions_tx (role_id, permission_id)
SELECT 
    (SELECT role_id FROM roles_master WHERE name = 'Customer Admin'),
    permission_id
FROM permissions_master 
WHERE name IN (
    'guests_read',
    'guests_create',
    'guests_update',
    'guests_delete',
    'guests_bulk_import',
    'guest_details_crud',
    'guest_documents_crud',
    'guest_groups_crud',
    'guest_group_details_crud',
    'guest_event_allocation_crud',
    'guest_travel_crud',
    'guest_accommodation_crud',
    'guest_vehicle_allocation_crud',
    'guest_communication_crud',
    'guest_rsvp_crud',
    'guests_with_rsvp_read',
    'guest_logistics_profile_access'
);

-- Assign team management permissions
INSERT OR IGNORE INTO role_permissions_tx (role_id, permission_id)
SELECT 
    (SELECT role_id FROM roles_master WHERE name = 'Customer Admin'),
    permission_id
FROM permissions_master 
WHERE name IN (
    'team_details_crud',
    'team_event_allocation_crud',
    'employee_team_allocation_crud'
);

COMMIT;

-- Re-enable foreign keys
PRAGMA foreign_keys=ON;
