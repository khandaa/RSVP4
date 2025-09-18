-- SQL Script to Verify Client CRUD Permissions for Customer Admin Role
-- This script checks if all client-related permissions are properly assigned

-- 1. Check if Customer Admin role exists
SELECT 'Customer Admin Role Check' as check_type,
       CASE
           WHEN COUNT(*) > 0 THEN '✓ Customer Admin role exists'
           ELSE '✗ Customer Admin role NOT found'
       END as result
FROM roles_master
WHERE name = 'Customer Admin';

-- 2. Check if all required client permissions exist
SELECT 'Required Client Permissions Check' as check_type,
       p.name as permission_name,
       CASE
           WHEN p.permission_id IS NOT NULL THEN '✓ Permission exists'
           ELSE '✗ Permission missing'
       END as result
FROM (
    SELECT 'clients_read' as name UNION ALL
    SELECT 'clients_create' UNION ALL
    SELECT 'clients_update' UNION ALL
    SELECT 'clients_delete' UNION ALL
    SELECT 'client_details_crud'
) required_perms
LEFT JOIN permissions_master p ON required_perms.name = p.name;

-- 3. Check current client permissions for Customer Admin
SELECT 'Current Client Permissions for Customer Admin' as check_type,
       p.name as permission_name,
       p.description,
       rp.created_at as granted_date
FROM roles_master r
JOIN role_permissions_tx rp ON r.role_id = rp.role_id
JOIN permissions_master p ON rp.permission_id = p.permission_id
WHERE r.name = 'Customer Admin'
AND p.name LIKE '%client%'
ORDER BY p.name;

-- 4. Check for missing client permissions (should return no rows if all are assigned)
SELECT 'Missing Client Permissions' as check_type,
       required_perms.name as missing_permission
FROM (
    SELECT 'clients_read' as name UNION ALL
    SELECT 'clients_create' UNION ALL
    SELECT 'clients_update' UNION ALL
    SELECT 'clients_delete' UNION ALL
    SELECT 'client_details_crud'
) required_perms
LEFT JOIN (
    SELECT p.name
    FROM roles_master r
    JOIN role_permissions_tx rp ON r.role_id = rp.role_id
    JOIN permissions_master p ON rp.permission_id = p.permission_id
    WHERE r.name = 'Customer Admin'
    AND p.name LIKE '%client%'
) current_perms ON required_perms.name = current_perms.name
WHERE current_perms.name IS NULL;

-- 5. Summary report
SELECT 'Summary Report' as check_type,
       COUNT(CASE WHEN p.name LIKE '%client%' THEN 1 END) as total_client_permissions,
       COUNT(CASE WHEN p.name = 'clients_read' THEN 1 END) as has_read,
       COUNT(CASE WHEN p.name = 'clients_create' THEN 1 END) as has_create,
       COUNT(CASE WHEN p.name = 'clients_update' THEN 1 END) as has_update,
       COUNT(CASE WHEN p.name = 'clients_delete' THEN 1 END) as has_delete,
       COUNT(CASE WHEN p.name = 'client_details_crud' THEN 1 END) as has_details_crud
FROM roles_master r
JOIN role_permissions_tx rp ON r.role_id = rp.role_id
JOIN permissions_master p ON rp.permission_id = p.permission_id
WHERE r.name = 'Customer Admin';