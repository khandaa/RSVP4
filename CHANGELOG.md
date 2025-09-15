## [Unreleased]

### 2025-09-15
- Enhanced Customer Dashboard with guest management and logistics management cards:
  - Added Guest Management card displaying guests from all customer events with RSVP status tracking
  - Added Logistics Management card showing accommodation and travel data for customer events
  - Enhanced Quick Actions section with "Add Guest" and "Logistics" buttons for improved navigation
  - Integrated data fetching for guests and logistics with proper error handling
- Fixed client edit button routing issue by correcting unauthenticated API call in `frontend/src/components/clients/ClientEdit.js` to use authenticated API instance for fetching customers data.
- Updated Customer Dashboard to show both "In Progress" and "Planned" events for the logged-in customer by modifying the event filtering logic in `frontend/src/components/dashboard/CustomerDashboard.js` to fetch events with both statuses and added a status column to display event status with appropriate badges.
- Fixed team creation 404 error by adding missing backend endpoints in `backend/routes/employee-management.js`:
  - Added GET `/api/employee-management/teams/:id` endpoint for fetching individual teams
  - Added PUT `/api/employee-management/teams/:id` endpoint for updating teams
  - Added DELETE `/api/employee-management/teams/:id` endpoint for deleting teams

### 2025-09-15
- Fixed runtime error in `frontend/src/components/logistics/LogisticsDashboard.js` by ensuring `useEffect` runs after `fetchDashboardData` and `fetchEvents` callbacks are initialized.
- Resolved backend crash "Identifier 'dbMethods' has already been declared" by removing the duplicate import in `backend/routes/comprehensive-crud.js`.
- Persisted authentication session data:
  - Updated `frontend/src/contexts/AuthContext.js` to set `currentUser`, `roles`, and `permissions` immediately upon successful login and persist them in `localStorage` for the entire session.
  - Rehydrate user, roles, and permissions on app load so sidebar generation can reliably use `hasRole`/`hasPermission`.
- Added detailed backend debug logs in `modules/authentication/backend/index.js` to print authenticated user email, roles, and permissions upon successful login.
- Added comprehensive debug logging to `middleware/auth.js` to troubleshoot 401 Unauthorized errors during event creation by logging request details, token presence, and verification results.
- Fixed 401 Unauthorized error in event creation by updating `frontend/src/components/events/EventCreate.js` to use authenticated API calls instead of direct fetch for master-data endpoints.
- Simplified event schedule endpoint in `backend/routes/comprehensive-crud.js` to handle cases where subevents don't exist yet, preventing 404 errors during event detail views.
- Created missing `/api/comprehensive-crud/users/profile` endpoint in `backend/routes/comprehensive-crud.js` to fix 404 errors in CustomerDashboard by providing user profile data with customer association and roles.
- Refactored the sidebar to be more modular by separating the sidebar into role-specific sidebars for customer, admin, client, and rsvp roles.
- Created separate sidebar components for each user role (admin, client, rsvp, customer).
- The main `Sidebar.js` now dynamically renders the appropriate sidebar based on the user's role.
- Fixed a `403 Forbidden` error by conditionally fetching feature toggles in the sidebar based on user permissions.
- Fixed a `404 Not Found` error in the customer dashboard by correcting the API endpoint for fetching user data.
- Created a new backend route `/api/users/profile` to reliably fetch the current user's data and updated the customer dashboard to use it.
- Implemented data filtering to ensure customer admins can only see clients, employees, and events associated with their account.
- Granted `Customer Admin` role permissions to create clients, events, RSVPs, employees, and teams.
- Fixed a runtime error in the Event Create component by ensuring `eventTypes` is always handled as an array.

### 2025-09-13
- Configured backend to run on port 5001 and frontend on port 3001.
- Separated `dependencies` and `devDependencies` for the root, `backend`, and `frontend` packages to optimize production builds.
- Configured webpack for the frontend production build using `react-app-rewired` and added `webpack-bundle-analyzer` to generate a bundle analysis report (`report.html`) during production builds.
- Enhanced `ecosystem.config.js` to support multi-app deployments, allowing both `rsvp-app` and `wm-app` to be managed from a single configuration file.
- Added Nginx configuration and a script to generate SSL certificates for production deployment.
- Added a deployment test script to verify frontend and backend services.

### 2025-08-04
- Added Vendor Management functionality for Customer Admin users:
  - Added Vendor Management link to sidebar menu for admin and Customer Admin roles
  - Integrated vendor management with existing routing structure
  - Implemented role-based access control for vendor features
  - Created comprehensive backend API routes with SQLite integration:
    - Implemented full CRUD operations for vendors with validation
    - Added vendor-event assignment and management endpoints
    - Integrated with customer data and vendor details
    - Added transaction support for data integrity
    - Secured all endpoints with role-based middleware

### 2025-08-04
- Implemented complete Venue Management system with role-based access control:
  - Created VenueList component for viewing and managing venues (admin and Customer Admin only)
  - Created VenueCreate component for adding and editing venues with validation
  - Created VenueDetail component for viewing venue information and associated events
  - Integrated customer selection dropdown that fetches customers from database
  - Added role-based filtering (admins see all venues, Customer Admins see only their venues)
  - Added venue API service with comprehensive endpoints
  - Added venue routes to main app navigation
  - Added venue management link to sidebar for admin and Customer Admin roles
  - Implemented search, sort, and filtering functionality for venue lists
  - Added deletion confirmation to prevent accidental data loss

### 2025-08-04
- Added new pricing page with multiple subscription tiers:
  - Created responsive pricing component with monthly/annual billing toggle
  - Implemented detailed feature comparison table
  - Added FAQ section for common pricing questions
  - Integrated pricing page into main navigation
  - Applied modern UI with hover effects and visual hierarchy

### 2025-08-05
- Implemented comprehensive Team and Employee Management functionality:
  - Created CRUD components for Employee management (EmployeeList, EmployeeCreate, EmployeeDetail)
  - Created CRUD components for Team management (TeamList, TeamCreate, TeamDetail)
  - Created CRUD components for Department management (DepartmentList, DepartmentCreate)
  - Added team members management with ability to assign/remove employees and set team leaders
  - Implemented role-based access controls for admin and Customer Admin users
  - Enhanced data filtering based on user roles (admins see all, Customer Admins see only their data)
  - Added search, sort, and filter functionality for teams and employees lists
  - Updated sidebar navigation with detailed submenu items for Team and Employee management
  - Added comprehensive API service endpoints for team and employee operations
  - Implemented form validation for employee and team creation/editing
  - Added responsive UI with loading states and error handling
  - Integrated toast notifications for action feedback
  - Configured complete routing for all team, employee, and department management components
  - Enhanced sidebar with intuitive icons for better user experience


### 2025-08-04
- Enhanced admin sidebar navigation with dedicated management sections:
  - Added "Manage Customers" submenu with Customer List, Add Customer, and Customer Reports options
  - Added "Manage Clients" submenu with Client List, Add Client, and Client Reports options
  - Improved admin user experience with better organized navigation structure
- Fixed sidebar scrolling issue when menu content exceeds viewport height
- Fixed permission check in client creation page to properly allow admin users to create clients
- Enhanced client creation page to properly fetch customer list from database

### 2025-08-01
- Enhanced automated UI testing framework with comprehensive Puppeteer tests:
  - Created dedicated test file for Events module (`ui-test-events.js`) with tests for list, create, details, edit, and calendar views
  - Created dedicated test file for Subevents module (`ui-test-subevents.js`) with tests for list, create, details, allocation, and timeline views
  - Created dedicated test file for Guests module (`ui-test-guests.js`) with tests for list, create, import, and details views
  - Created dedicated test file for RSVP module (`ui-test-rsvp.js`) with tests for dashboard, form submission, and bulk management
  - Created dedicated test file for Users module (`ui-test-users.js`) with tests for user list, creation, details, edit, and bulk upload
  - Created dedicated test file for Roles module (`ui-test-roles.js`) with tests for role list, creation, details, edit, and feature toggles
  - Added CSV-driven data input support for all "create" functionality tests
  - Updated master UI test runner (`ui_test_allTests.js`) to include all new test files
  - Added automatic screenshot capture for key test steps
  - Implemented detailed test reporting with markdown output for each test module
  - Added error handling and result tracking for all UI tests

### 2025-07-31
- Fixed navigation issues in App.js for Guests route to properly redirect to guests/list instead of dashboard
- Added RSVP list route to properly redirect to RSVP dashboard for better navigation
- Fixed authentication issues in API service to prevent redirect loops on background API calls
- Enhanced 404 error handling with better logging and more specific user feedback
- Fixed SubeventList component to properly use API service and add fallback data for API failures
- Fixed EventList component's eventTypes.map error by ensuring proper array handling with fallback data
- Fixed controlled/uncontrolled input warning in FileUploadConfig component
- Added proper loading state management in FileUploadConfig component
- Added comprehensive error handling with detailed console logs for API errors
- Enhanced UI components with better visibility and test IDs for automated testing:
  - Enhanced Add Event button with better styling and test ID
  - Enhanced Edit Event buttons with better visibility and test ID
  - Enhanced View Event buttons with better visibility and test ID
  - Enhanced Add SubEvent button with better styling and test ID
  - Enhanced Add Guest button with better styling and test ID
  - Enhanced Save button in FileUploadConfig component
  - Added Manage RSVPs button to RSVP Dashboard for better navigation
- Added new UI test capabilities:
  - Created dedicated login test script (ui-test-login.js) that reads user credentials from CSV file
  - Added ability to test multiple users with different roles
  - Added automatic screenshot capture for login attempts
  - Generated detailed test reports in markdown format
  - Improved logout functionality to properly interact with the navbar dropdown menu
  - Created signup page test script (ui-test-signup.js) with multiple validation scenarios
  - Added validation for all registration form fields and error cases
  - Implemented screenshot capture for before and after registration attempts
  - Created combined UI test runner (ui_test_allTests.js) to execute all tests sequentially
  - Added comprehensive reporting with test status, duration, and error details
  - Integrated test results into a single consolidated markdown report

### 2025-07-30
- Fixed sidebar navigation paths for Travel and Accommodation menu items to correctly link to their respective components
- Updated all Travel menu items to point to '/logistics/travel' instead of '/travel/list'
- Updated all Accommodation menu items to point to '/logistics/accommodation' instead of '/accommodation/list'

### 2025-07-31
- Enhanced application to support room allocation for all guests
- Added support for local travel arrangements for all guests
- Integrated existing logistics components into main application
- Created comprehensive Logistics section in sidebar menu with submenu items
- Added routes for LogisticsDashboard, TravelManagement, AccommodationManagement, VehicleAllocation, and Reports
- Consolidated travel and accommodation functionality under unified Logistics module

### 2025-07-31
- Implemented RSVP Dashboard for monitoring guest response statistics
- Added visualization for attendance, declines, and pending responses
- Added RSVP API service with endpoints for statistics and management
- Updated Sidebar navigation to link directly to the new RSVP Dashboard
- Made RSVP Dashboard the default landing page for the RSVP section
- Added export functionality for RSVP data
- Implemented reminder system for pending RSVPs

### 2025-07-30
- Implemented improved subevent-to-event linking functionality with better parent event visualization
- Added dedicated subeventAPI for consistent API calls related to subevents
- Enhanced parent event selection UI with detailed event information display
- Added explicit parent-child relationship indicators in the subevent creation form
- Fixed event schedule API endpoint by reverting back to the correct `/comprehensive-crud/event-schedule` path
- Added better error handling with toast notifications for failed API calls
- Fixed syntax and formatting issues in the API service file
- Fixed authentication issues in API calls with proper token handling
- Improved error handling for API calls in EventList and EventDetail components
- Added fallback data for event types when API calls fail
- Fixed EventList component error "eventTypes.map is not a function" by ensuring eventTypes is always initialized as an array
- Added routes for new RSVPBulkManagement component at '/rsvps/bulk'
- Fixed ESLint error in GuestDetail.js by properly importing FaEye icon
- Fixed Events page blank screen issue by properly configuring all event routes in App.js
- Fixed SubEvents page by adding correct route configuration
- Added missing routes for EventCreate, EventDetail, EventEdit and EventCalendar components
- Added missing routes for SubeventCreate, SubeventDetail, SubeventAllocation and SubeventTimeline
- Fixed guest management buttons functionality by adding proper routes in App.js
- Enabled GuestCreate, GuestDetail and GuestImport components by uncommenting imports
- Added missing routes for guest creation, import, viewing and editing
- Reorganized sidebar navigation to group Events, Sub-events, Guests, RSVP, Travel, Accommodation, and Communications under a single "Manage Events" menu
- Created dedicated Sidebar.css stylesheet for improved sidebar styling
- Implemented expandable submenu functionality for grouped navigation items
- Enhanced sidebar UI with dropdown indicators for submenu sections
- Fixed ESLint errors in EventCalendar.js by adding missing FaUser icon import
- Fixed ESLint error in GuestDetail.js by adding missing FaEye icon import
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
- Added automatic Customer Admin role assignment to newly created customer user accounts
- Added automatic client_admin role assignment to newly created client user accounts
- Implemented secure default password handling using bcrypt for new customer and client admin accounts
- Integrated user creation in both single customer creation and bulk import processes
- Added database transaction support to ensure data integrity during user and role creation processes
- Fixed authentication issues in API routes by improving token handling
- Enhanced error handling in customer and client routes to prevent promise rejection errors
- Added duplicate user detection to prevent creation of multiple users with same email
- Improved frontend API interceptors to ensure authentication tokens are always included in requests
- Created custom dashboard for Customer Admin users with overview of clients, active events, teams, and employees
- Created custom dashboard for client_admin users with overview of events, sub-events, guests, RSVPs, travel, and accommodation
- Implemented role-based dashboard routing to display different dashboards based on user role
- Completely customized sidebar navigation for each user role:
  - Admin/full_access users see all system capabilities
  - Customer Admin users see clients, events, sub-events, team, employees, guests, RSVPs, travel, accommodation, communications, and notifications
  - Client Admin users see events, sub-events, guests, RSVPs, travel, and accommodation
- Standardized navigation paths between dashboard cards and sidebar links for consistent user experience
- Updated all sidebar navigation links to point to list pages (events/list, guests/list, subevents/list, rsvps/list, travel/list, accommodation/list)
- Ensured client dashboard card buttons match sidebar navigation paths for seamless user experience
- Added missing routes in App.js for events/list, guests/list, subevents/list, rsvps/list, travel/list, and accommodation/list to fix navigation issues
- Added additional routes for team, employees, communications, notifications, and analytics pages
- Created placeholder components for modules that don't have implementations yet
- Fixed React Datepicker source map warnings using react-app-rewired custom configuration
- Reorganized imports in App.js to follow best practices and fixed duplicate imports
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

