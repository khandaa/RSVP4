# Client CRUD Permissions for Customer Admin Role

This directory contains SQL scripts to manage client CRUD permissions for the Customer Admin role in the RSVP system.

## Files Overview

### 1. `add_client_permissions_to_customer_admin.sql`
**Purpose**: Adds all necessary client CRUD permissions to the Customer Admin role.

**Permissions Added**:
- `clients_read` - View clients
- `clients_create` - Create clients
- `clients_update` - Update clients
- `clients_delete` - Delete clients
- `client_details_crud` - Manage client details

**Usage**:
```bash
sqlite3 /path/to/RSVP4.db < add_client_permissions_to_customer_admin.sql
```

### 2. `verify_client_permissions.sql`
**Purpose**: Verifies that all client permissions are properly assigned to Customer Admin role.

**What it checks**:
- ✓ Customer Admin role exists
- ✓ Required client permissions exist in the system
- ✓ Current client permissions assigned to Customer Admin
- ✓ Missing permissions (if any)
- ✓ Summary report with counts

**Usage**:
```bash
sqlite3 /path/to/RSVP4.db < verify_client_permissions.sql
```

### 3. `remove_client_permissions_from_customer_admin.sql`
**Purpose**: **CAUTION** - Removes all client CRUD permissions from Customer Admin role (rollback script).

**Usage**:
```bash
sqlite3 /path/to/RSVP4.db < remove_client_permissions_from_customer_admin.sql
```

## Current Status

As of the latest verification, the Customer Admin role already has all required client CRUD permissions:

| Permission | Status | Description | Granted Date |
|-----------|--------|-------------|--------------|
| `clients_read` | ✓ Active | View clients | 2025-09-18 04:25:35 |
| `clients_create` | ✓ Active | Create clients | 2025-09-18 04:25:35 |
| `clients_update` | ✓ Active | Update clients | 2025-09-18 04:25:35 |
| `clients_delete` | ✓ Active | Delete clients | 2025-09-18 04:25:52 |
| `client_details_crud` | ✓ Active | Manage client details | 2025-09-18 04:25:35 |

## Database Schema

The permission system uses these tables:
- `roles_master` - Stores role definitions
- `permissions_master` - Stores permission definitions
- `role_permissions_tx` - Junction table linking roles to permissions

## Safe Execution

All scripts use `INSERT OR IGNORE` to prevent duplicate entries and include verification queries to confirm results.

## Example Usage

1. **To verify current permissions**:
   ```bash
   cd /Users/alokk/EmployDEX/Applications/RSVP4
   sqlite3 db/RSVP4.db < sql/verify_client_permissions.sql
   ```

2. **To add permissions** (idempotent):
   ```bash
   sqlite3 db/RSVP4.db < sql/add_client_permissions_to_customer_admin.sql
   ```

3. **To verify after changes**:
   ```bash
   sqlite3 db/RSVP4.db < sql/verify_client_permissions.sql
   ```

## Notes

- The permissions are already correctly configured in the current system
- Scripts are idempotent and safe to run multiple times
- Always run verification script before and after making changes
- The remove script should only be used for rollback scenarios