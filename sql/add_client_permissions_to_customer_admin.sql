-- SQL Script to Add Client CRUD Permissions to Customer Admin Role
-- This script ensures that Customer Admin role has all necessary client management permissions

-- First, let's get the role_id for Customer Admin
-- (We'll use this in the INSERT statements)

-- Add client CRUD permissions to Customer Admin role
-- Using INSERT OR IGNORE to avoid duplicates

-- 1. Add clients_read permission
INSERT OR IGNORE INTO role_permissions_tx (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles_master r, permissions_master p
WHERE r.name = 'Customer Admin'
AND p.name = 'clients_read';

-- 2. Add clients_create permission
INSERT OR IGNORE INTO role_permissions_tx (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles_master r, permissions_master p
WHERE r.name = 'Customer Admin'
AND p.name = 'clients_create';

-- 3. Add clients_update permission
INSERT OR IGNORE INTO role_permissions_tx (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles_master r, permissions_master p
WHERE r.name = 'Customer Admin'
AND p.name = 'clients_update';

-- 4. Add clients_delete permission
INSERT OR IGNORE INTO role_permissions_tx (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles_master r, permissions_master p
WHERE r.name = 'Customer Admin'
AND p.name = 'clients_delete';

-- 5. Add client_details_crud permission (for additional client details management)
INSERT OR IGNORE INTO role_permissions_tx (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles_master r, permissions_master p
WHERE r.name = 'Customer Admin'
AND p.name = 'client_details_crud';

-- Verification query: Check all client-related permissions for Customer Admin
SELECT
    r.name as role_name,
    p.name as permission_name,
    p.description as permission_description
FROM roles_master r
JOIN role_permissions_tx rp ON r.role_id = rp.role_id
JOIN permissions_master p ON rp.permission_id = p.permission_id
WHERE r.name = 'Customer Admin'
AND p.name LIKE '%client%'
ORDER BY p.name;