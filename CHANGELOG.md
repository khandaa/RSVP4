## [Unreleased]

### 2025-07-30
- Created comprehensive permission and feature toggle setup for all backend routes
- Added database entries for all API routes in permissions_master table with appropriate descriptions and module categorization
- Assigned all permissions to Admin and Full Access roles in role_permissions_tx table
- Created feature toggle entries for all major system capabilities
- Created SQL migration script for permissions, role permissions, and feature toggles
- Created sample data insertion script with 10 customers, 5 clients per customer, 3 events per client, 30 guests per event
- Added sample RSVP, travel, accommodation, and communication records for each guest
- Created new Customer Admin role with permissions for user, event, guest, and team management
- Created new Client Admin role with focused permissions for guest, event, and sub-event management
- Enhanced customer creation functionality to automatically generate admin user accounts when new customers are added
- Enhanced client creation functionality to automatically generate admin user accounts when new clients are added
- Added automatic customer_admin role assignment to newly created customer user accounts
- Added automatic client_admin role assignment to newly created client user accounts
- Implemented secure default password handling using bcrypt for new customer and client admin accounts
- Integrated user creation in both single customer creation and bulk import processes
- Added database transaction support to ensure data integrity during user and role creation processes
- Fixed authentication issues in API routes by improving token handling
- Enhanced error handling in customer and client routes to prevent promise rejection errors
- Added duplicate user detection to prevent creation of multiple users with same email
- Improved frontend API interceptors to ensure authentication tokens are always included in requests
- Created custom dashboard for customer_admin users with overview of clients, active events, teams, and employees
- Created custom dashboard for client_admin users with overview of events, sub-events, guests, RSVPs, travel, and accommodation
- Implemented role-based dashboard routing to display different dashboards based on user role
- Enhanced sidebar navigation with role-specific links for client_admin and customer_admin users
- Standardized navigation paths between dashboard cards and sidebar links for consistent user experience
- Updated task list (rsvp_tasks.md) to reflect implemented code for sections 7, 8, 9, and 10
- Marked as complete the RSVP dashboard, reports, logistics interfaces, notification system, and main dashboard features
- Added SubEvent, Guest, RSVP, Logistics, and Notification modules to admin sidemenu
- Added appropriate icons for new navigation menu items
- Ensured admin users have access to all new modules without permission checks

### 2025-07-29
- Added Client Management module with full CRUD operations
- Added sidebar navigation items for Customer, Client, and Event Management with proper permission control
- Created Client List, Detail, Create, Edit, and Import components
- Updated API service with client management endpoints
- Added feature toggles for customer, client, and event management modules
- Created database migration scripts for feature toggles
- Fixed sidebar navigation to ensure admin and full_access roles always see Customer, Client, and Event modules
- Implemented proper feature toggle overrides for admin users


### 2025-07-28
- Fixed SQL syntax errors in RSVP4 database schema (rsvp4.sql)
- Added proper DROP TABLE statements in correct dependency order to prevent foreign key constraint errors
- Replaced invalid 'values' syntax with SQLite-compatible CHECK constraints for enumerated values
- Fixed incorrect foreign key references between tables
- Corrected column reference errors in team and notification tables
- Updated database schema with consistent naming conventions
- Added missing vendors table to complete the database schema
- Successfully executed schema to create full RSVP4 database

### 2025-07-15
- Fixed QR code fetching error (500 Internal Server Error) by adding database table initialization for payment_qr_codes and payment_transactions tables
- Fixed QR code upload error (500 Internal Server Error) by correcting the path mismatch between multer storage destination and Express static file serving
- Added improved error handling for file uploads in the payment QR code module with better error messages
- Enhanced file validation to ensure only supported image types are accepted
- Added automatic creation of upload directories to prevent errors
- Fixed database column name mismatch by renaming 'enabled' to 'is_enabled' in feature_toggles table
- Updated SQL queries in payment module and feature toggles routes to use correct column names ('feature_name' and 'is_enabled')
- Updated migration scripts and data update scripts to use consistent column names

### 2025-07-12
- Fixed 403 Forbidden errors by updating feature toggle routes to allow Admin users access without requiring specific permissions
- Added missing `/api/logging/entities` endpoint to support the ActivityLogs component
- Fixed source map warnings from react-datepicker by adding GENERATE_SOURCEMAP=false to frontend/.env
- Fixed dependency issues by installing missing packages (express, express-validator, jsonwebtoken, @mui/material, @mui/icons-material)
- Fixed middleware import path in payment-transactions.js
- Added checkPermission function to auth middleware
- Resolved module resolution issues for both frontend and backend
- Fixed 500 Server Error in payment module by correcting the feature toggle check middleware to properly handle SQLite integer representation of boolean values

### 2025-07-11
- Added Payment Integration Module with QR code upload/management functionality and feature toggle support
- Added dedicated API endpoints for payment QR code CRUD operations
- Added frontend components for payment settings and QR code management
- Added database schema for payment transactions and QR code storage
- Extended feature toggle system to include payment integration toggle

### 2025-07-10
- Added `proxy` configuration to `frontend/package.json` to forward API requests to Express backend on port 5000. This resolves 404 errors for `/api` requests from React development server.

### Added
- Feature Toggle system: backend API (CRUD, admin/full_access only), DB migration, and frontend admin UI for managing feature flags.
### Fixed
- ActivityLogList: Timestamp now always displays in a readable format using formatTimestamp utility.
- ActivityLogList: Added 'IP Address / Port' column to activity log table. Now displays the source IP/port for each activity log if available.

### Fixed
- Fixed JSX syntax errors in `frontend/src/components/roles/RoleList.js`, specifically the missing or mismatched `<tr>` closing tag and incorrect button/action JSX structure, which caused rendering issues on the Roles List page.

### Improved
- Enhanced the Role Management table UI in `RoleList.js` for better clarity and aesthetics: improved alignment, better action buttons, permission badge wrapping, and custom styles for a modern look.

### Changed
- Role List: Replaced the "View role" action in the Actions column with an "Edit Role" action. The button now navigates to the edit role page and uses the edit icon with text for clarity.

