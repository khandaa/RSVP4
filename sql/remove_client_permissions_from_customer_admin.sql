-- SQL Script to Remove Client CRUD Permissions from Customer Admin Role
-- CAUTION: This script will revoke client management permissions from Customer Admin
-- Use this only if you need to rollback or remove these permissions

-- Remove client CRUD permissions from Customer Admin role

-- 1. Remove clients_read permission
DELETE FROM role_permissions_tx
WHERE role_id IN (SELECT role_id FROM roles_master WHERE name = 'Customer Admin')
AND permission_id IN (SELECT permission_id FROM permissions_master WHERE name = 'clients_read');

-- 2. Remove clients_create permission
DELETE FROM role_permissions_tx
WHERE role_id IN (SELECT role_id FROM roles_master WHERE name = 'Customer Admin')
AND permission_id IN (SELECT permission_id FROM permissions_master WHERE name = 'clients_create');

-- 3. Remove clients_update permission
DELETE FROM role_permissions_tx
WHERE role_id IN (SELECT role_id FROM roles_master WHERE name = 'Customer Admin')
AND permission_id IN (SELECT permission_id FROM permissions_master WHERE name = 'clients_update');

-- 4. Remove clients_delete permission
DELETE FROM role_permissions_tx
WHERE role_id IN (SELECT role_id FROM roles_master WHERE name = 'Customer Admin')
AND permission_id IN (SELECT permission_id FROM permissions_master WHERE name = 'clients_delete');

-- 5. Remove client_details_crud permission
DELETE FROM role_permissions_tx
WHERE role_id IN (SELECT role_id FROM roles_master WHERE name = 'Customer Admin')
AND permission_id IN (SELECT permission_id FROM permissions_master WHERE name = 'client_details_crud');

-- Verification: Check remaining client-related permissions (should return no rows)
SELECT 'Remaining Client Permissions After Removal' as check_type,
       p.name as permission_name
FROM roles_master r
JOIN role_permissions_tx rp ON r.role_id = rp.role_id
JOIN permissions_master p ON rp.permission_id = p.permission_id
WHERE r.name = 'Customer Admin'
AND p.name LIKE '%client%'
ORDER BY p.name;