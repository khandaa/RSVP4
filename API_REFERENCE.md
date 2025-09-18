# RSVP4 Backend API Reference

This document provides a comprehensive reference for all API endpoints in the RSVP4 system, including authentication requirements, parameters, and response formats.

## Base Configuration

- **Base URL**: All API endpoints are prefixed with `/api`
- **Authentication**: JWT Bearer token required for most endpoints
- **Content-Type**: `application/json` for most requests
- **CORS**: Enabled for `localhost:3000`, `localhost:3001`, `localhost:5000`
- **Port**: Default 5001 (configurable via PORT env variable)

## Authentication

### JWT Token Structure
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "roles": ["Admin"],
    "permissions": ["user_view", "user_create", ...]
  },
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Module-Based API Endpoints

### Authentication Module (`/api/authentication`)

#### POST `/api/authentication/register`
- **Purpose**: Register a new user
- **Authentication**: None
- **Validation**:
  - `mobile_number` (string, required)
  - `email` (email format, required)
  - `password` (min 8 chars, uppercase, lowercase, number, required)
  - `first_name` (string, required)
  - `last_name` (string, required)
- **Response**: `{ user_id, message }`
- **Special**: Auto-assigns "User" role

#### POST `/api/authentication/login`
- **Purpose**: Authenticate user and get JWT token
- **Authentication**: None
- **Body**:
  - `username` (email or mobile, required)
  - `password` (required)
- **Response**: `{ token, user: { id, email, first_name, last_name, roles, permissions } }`
- **Special**: Admin user gets special handling

#### POST `/api/authentication/forgot-password`
- **Purpose**: Request password reset
- **Authentication**: None
- **Body**: `{ email }` (email format, required)
- **Response**: `{ message }` (always success for security)
- **Special**: Generates JWT reset token, logs activity

#### POST `/api/authentication/reset-password`
- **Purpose**: Reset password using token
- **Authentication**: None
- **Body**:
  - `token` (JWT reset token, required)
  - `password` (min 8 chars with complexity, required)
- **Response**: `{ message }`
- **Special**: Token has limited lifetime

#### GET `/api/authentication/me`
- **Purpose**: Get current user profile
- **Authentication**: Required
- **Response**: `{ user data with roles and permissions }`

---

### User Management Module (`/api/user_management`)

#### GET `/api/user_management/users`
- **Purpose**: Get paginated users with filtering
- **Authentication**: Required (`user_view` permission)
- **Query Parameters**:
  - `isActive` (boolean)
  - `search` (string, searches name/email)
  - `role` (string, role name filter)
  - `limit` (number, default 10, max 100)
  - `page` (number, default 1)
- **Response**: `{ users: [...], pagination: { total, pages, current, limit } }`

#### POST `/api/user_management/users`
- **Purpose**: Create new user
- **Authentication**: Required (`user_create` permission)
- **Body**:
  - `first_name`, `last_name` (required)
  - `email` (email format, unique, required)
  - `mobile_number` (unique, required)
  - `password` (complexity validation, required)
  - `roles` (array of role IDs, optional)
- **Response**: `{ user data }`
- **Special**: Auto-hashes password, assigns roles

#### GET `/api/user_management/users/:id`
- **Purpose**: Get user by ID
- **Authentication**: Required (`user_view` permission)
- **Response**: `{ user data with roles }`

#### PUT `/api/user_management/users/:id`
- **Purpose**: Update user
- **Authentication**: Required (`user_edit` permission)
- **Body**: Same as POST (all optional)
- **Response**: `{ updated user data }`

#### PATCH `/api/user_management/users/:id/status`
- **Purpose**: Toggle user active status
- **Authentication**: Required (`user_edit` permission)
- **Body**: `{ is_active }` (boolean, required)
- **Response**: `{ message }`

#### DELETE `/api/user_management/users/:id`
- **Purpose**: Delete user
- **Authentication**: Required (`user_delete` permission)
- **Response**: `{ message }`
- **Special**: Prevents deletion of primary admin

#### GET `/api/user_management/users/template`
- **Purpose**: Download CSV template for bulk upload
- **Authentication**: Required (`user_create` permission)
- **Response**: CSV file download

#### POST `/api/user_management/users/bulk`
- **Purpose**: Bulk upload users from CSV
- **Authentication**: Required (`user_create` permission)
- **Body**: Multipart form with CSV file
- **Response**: `{ total, successful, failed, errors: [...] }`

---

### Role Management Module (`/api/role_management`)

#### GET `/api/role_management/roles`
- **Purpose**: Get all roles with permissions and user counts
- **Authentication**: Required (`role_view` permission)
- **Response**: `{ roles: [{ id, name, description, permissions: [...], user_count }] }`

#### POST `/api/role_management/roles`
- **Purpose**: Create new role
- **Authentication**: Required (`role_create` permission)
- **Body**:
  - `name` (string, unique, required)
  - `description` (string, optional)
  - `permissions` (array of permission IDs, optional)
- **Response**: `{ role data }`

#### GET `/api/role_management/roles/:id`
- **Purpose**: Get role by ID with detailed information
- **Authentication**: Required (`role_view` permission)
- **Response**: `{ role data with permissions and users }`

#### PUT `/api/role_management/roles/:id`
- **Purpose**: Update role
- **Authentication**: Required (`role_edit` permission)
- **Body**: Same as POST
- **Response**: `{ updated role data }`
- **Special**: Protects system roles, ensures Admin keeps all permissions

#### DELETE `/api/role_management/roles/:id`
- **Purpose**: Delete role
- **Authentication**: Required (`role_delete` permission)
- **Response**: `{ message }`
- **Special**: Prevents deletion of system roles, checks for assigned users

#### GET `/api/role_management/roles/template`
- **Purpose**: Download CSV template for bulk upload
- **Authentication**: Required (`role_create` permission)
- **Response**: CSV file download

#### POST `/api/role_management/roles/bulk`
- **Purpose**: Bulk upload roles from CSV
- **Authentication**: Required (`role_create` permission)
- **Body**: Multipart form with CSV file
- **Response**: `{ upload results }`

---

### Permission Management Module (`/api/permission_management`)

#### GET `/api/permission_management/permissions`
- **Purpose**: Get all permissions with role counts
- **Authentication**: Required (`permission_view` permission)
- **Response**: `{ permissions: [{ id, name, description, role_count }] }`

#### POST `/api/permission_management/permissions`
- **Purpose**: Create new permission
- **Authentication**: Required (`permission_assign` permission)
- **Body**:
  - `name` (lowercase with underscores, unique, required)
  - `description` (string, required)
- **Response**: `{ permission data }`
- **Special**: Auto-assigns to Admin role

#### GET `/api/permission_management/permissions/:id`
- **Purpose**: Get permission by ID with assigned roles
- **Authentication**: Required (`permission_view` permission)
- **Response**: `{ permission data with roles }`

#### PUT `/api/permission_management/permissions/:id`
- **Purpose**: Update permission (description only)
- **Authentication**: Required (`permission_assign` permission)
- **Body**: `{ description }` (required)
- **Response**: `{ updated permission }`

#### POST `/api/permission_management/assign`
- **Purpose**: Assign/remove permissions from role
- **Authentication**: Required (`permission_assign` permission)
- **Body**:
  - `role_id` (integer, required)
  - `permissions` (array of permission IDs, required)
- **Response**: `{ message }`
- **Special**: Ensures Admin role keeps all permissions

---

### Logging Module (`/api/logging`)

#### GET `/api/logging/activity`
- **Purpose**: Get activity logs with pagination and filtering
- **Authentication**: Required (`activity_view` permission or Admin/full_access role)
- **Query Parameters**:
  - `page` (number, default 1)
  - `limit` (number, default 10, max 100)
  - `action` (string, filter by action type)
  - `user_id` (number, filter by user)
  - `start_date` (ISO date, filter from date)
  - `end_date` (ISO date, filter to date)
- **Response**: `{ logs: [...], pagination: {...} }`

#### GET `/api/logging/actions`
- **Purpose**: Get all unique action types from logs
- **Authentication**: Required (`permission_view` permission)
- **Response**: `{ actions: ["login", "user_create", ...] }`

#### GET `/api/logging/entities`
- **Purpose**: Get entity types from logs
- **Authentication**: Required (`permission_view` permission)
- **Response**: `{ entities: [...] }`

#### GET `/api/logging/stats`
- **Purpose**: Get activity statistics
- **Authentication**: Required (`activity_view` permission or Admin/full_access role)
- **Response**: `{ action_counts: {...}, daily_activity: [...], top_users: [...] }`

---

### Database Module (`/api/database`)

#### GET `/api/database/status`
- **Purpose**: Check database health
- **Authentication**: Required (`permission_view` permission)
- **Response**: `{ status: "connected", timestamp: "..." }`

#### POST `/api/database/query`
- **Purpose**: Execute SELECT queries (Admin only)
- **Authentication**: Required (`permission_view` permission)
- **Body**: `{ query }` (SELECT statements only)
- **Response**: `{ results: [...] }`
- **Security**: Only SELECT statements allowed

---

### Payment Module (`/api/payment`)

#### GET `/api/payment/status`
- **Purpose**: Check if payment integration is enabled
- **Authentication**: None
- **Response**: `{ enabled: boolean }`

#### QR Code Management

#### GET `/api/payment/qr-codes`
- **Purpose**: Get all QR codes
- **Authentication**: Required (`payment_view` permission + feature enabled)
- **Response**: `{ qr_codes: [...] }`

#### POST `/api/payment/qr-codes`
- **Purpose**: Upload new QR code
- **Authentication**: Required (`payment_create` permission + feature enabled)
- **Body**: Multipart form with:
  - `name` (string, required)
  - `description` (string, optional)
  - `payment_type` (string, required)
  - `image` (file, required)
- **Response**: `{ qr_code data }`

#### GET `/api/payment/qr-codes/:id`
- **Purpose**: Get specific QR code
- **Authentication**: Required (`payment_view` permission + feature enabled)
- **Response**: `{ qr_code data }`

#### PUT `/api/payment/qr-codes/:id`
- **Purpose**: Update QR code metadata
- **Authentication**: Required (`payment_edit` permission + feature enabled)
- **Body**: Same as POST (image optional)
- **Response**: `{ updated qr_code }`

#### DELETE `/api/payment/qr-codes/:id`
- **Purpose**: Delete QR code
- **Authentication**: Required (`payment_delete` permission + feature enabled)
- **Response**: `{ message }`
- **Special**: Checks for associated transactions

#### PATCH `/api/payment/qr-codes/:id/activate`
- **Purpose**: Activate QR code (deactivates others)
- **Authentication**: Required (`payment_edit` permission + feature enabled)
- **Response**: `{ message }`

#### PATCH `/api/payment/qr-codes/:id/deactivate`
- **Purpose**: Deactivate QR code
- **Authentication**: Required (`payment_edit` permission + feature enabled)
- **Response**: `{ message }`

#### GET `/api/payment/qr-codes/:id/image`
- **Purpose**: Get QR code image file
- **Authentication**: Required (`payment_view` permission + feature enabled)
- **Response**: Image file

#### Transaction Management

#### GET `/api/payment/transactions`
- **Purpose**: Get payment transactions with filtering
- **Authentication**: Required (`payment_view` permission + feature enabled)
- **Query Parameters**:
  - `status` (string, filter by verification status)
  - `search` (string, search transaction refs)
  - `limit` (number, default 10)
  - `page` (number, default 1)
- **Response**: `{ transactions: [...], pagination: {...} }`

#### POST `/api/payment/transactions`
- **Purpose**: Create payment transaction
- **Authentication**: Required (`payment_create` permission + feature enabled)
- **Body**: Transaction details
- **Response**: `{ transaction data }`

#### GET `/api/payment/transactions/:id`
- **Purpose**: Get specific transaction
- **Authentication**: Required (`payment_view` permission + feature enabled)
- **Response**: `{ transaction data }`

---

## Business Entity API Endpoints

### Customer Management (`/api/customers`)

#### GET `/api/customers`
- **Purpose**: Get all customers
- **Authentication**: Required
- **Response**: `{ customers: [...] }`

#### GET `/api/customers/:id`
- **Purpose**: Get customer by ID
- **Authentication**: Required
- **Response**: `{ customer data }`

#### POST `/api/customers`
- **Purpose**: Create new customer
- **Authentication**: Required
- **Body**:
  - `customer_name` (required)
  - `customer_email` (email format, optional)
  - `customer_phone` (optional)
  - `customer_address` (optional)
  - `customer_city` (optional)
  - `customer_status` (optional, default 'Active')
- **Response**: `{ customer data }`
- **Special**: Auto-creates Customer Admin user account with default credentials

#### PUT `/api/customers/:id`
- **Purpose**: Update customer
- **Authentication**: Required
- **Body**: Same as POST
- **Response**: `{ updated customer }`

#### DELETE `/api/customers/:id`
- **Purpose**: Delete customer
- **Authentication**: Required
- **Response**: `{ message }`

#### POST `/api/customers/bulk-import`
- **Purpose**: Bulk import customers from CSV
- **Authentication**: Required
- **Body**: CSV file upload via multipart form
- **Response**: `{ total, successful, failed, errors: [...] }`

---

### Client Management (`/api/clients`)

#### GET `/api/clients`
- **Purpose**: Get all clients (filtered by Customer Admin role)
- **Authentication**: Required
- **Response**: `{ clients with customer names }`

#### GET `/api/clients/:id`
- **Purpose**: Get client by ID
- **Authentication**: Required
- **Response**: `{ client data }`

#### POST `/api/clients`
- **Purpose**: Create new client
- **Authentication**: Required
- **Body**:
  - `customer_id` (integer, required)
  - `client_name` (required)
  - `client_email`, `client_phone`, `client_address`, `client_city`, `client_status` (optional)
- **Response**: `{ client data }`
- **Special**: Auto-creates Client Admin user account

#### PUT `/api/clients/:id`
- **Purpose**: Update client
- **Authentication**: Required
- **Body**: Same as POST
- **Response**: `{ updated client }`

#### DELETE `/api/clients/:id`
- **Purpose**: Delete client
- **Authentication**: Required
- **Response**: `{ message }`

---

### Event Management (`/api/events`)

#### GET `/api/events`
- **Purpose**: Get all events (filtered by Customer Admin role)
- **Authentication**: Required
- **Response**: `{ events with client and event type names }`

#### GET `/api/events/:id`
- **Purpose**: Get event by ID
- **Authentication**: Required
- **Response**: `{ event data }`

#### POST `/api/events`
- **Purpose**: Create new event
- **Authentication**: Required
- **Body**:
  - `client_id` (integer, required)
  - `event_name` (required)
  - `event_description` (optional)
  - `event_status` (optional, default 'Planned')
  - `event_type_id` (integer, optional)
  - `event_start_date` (ISO8601 date, optional)
  - `event_end_date` (ISO8601 date, optional)
- **Response**: `{ event data }`

#### PUT `/api/events/:id`
- **Purpose**: Update event
- **Authentication**: Required
- **Body**: Same as POST
- **Response**: `{ updated event }`

#### DELETE `/api/events/:id`
- **Purpose**: Delete event
- **Authentication**: Required
- **Response**: `{ message }`

---

### Guest Management (`/api/guests`)

#### GET `/api/guests`
- **Purpose**: Get all guests with client, event, and subevent names
- **Authentication**: Required
- **Response**: `{ guests with related entity names }`

#### GET `/api/guests/:id`
- **Purpose**: Get guest by ID
- **Authentication**: Required
- **Response**: `{ guest data }`

#### GET `/api/guests/event/:eventId`
- **Purpose**: Get guests for specific event
- **Authentication**: Required
- **Response**: `{ guests for event }`

#### POST `/api/guests`
- **Purpose**: Create new guest
- **Authentication**: Required
- **Body**:
  - `client_id` (integer, required)
  - `event_id` (integer, required)
  - `guest_first_name` (required)
  - `guest_last_name` (required)
  - `guest_email` (email format, optional)
  - `guest_phone` (optional)
  - `subevent_id` (integer, optional)
  - `guest_status` (optional, default 'Active')
  - `guest_group_id` (integer, optional)
- **Response**: `{ guest data }`
- **Special**: Auto-assigns to guest group if provided

#### PUT `/api/guests/:id`
- **Purpose**: Update guest
- **Authentication**: Required
- **Body**: Same as POST
- **Response**: `{ updated guest }`

#### DELETE `/api/guests/:id`
- **Purpose**: Delete guest
- **Authentication**: Required
- **Response**: `{ message }`

---

### Venue Management (`/api/venues`)

#### GET `/api/venues`
- **Purpose**: Get all venues with customer names
- **Authentication**: Required
- **Response**: `{ venues with customer info }`

#### GET `/api/venues/:id`
- **Purpose**: Get venue by ID
- **Authentication**: Required
- **Response**: `{ venue data }`

#### POST `/api/venues`
- **Purpose**: Create new venue
- **Authentication**: Required
- **Body**:
  - `customer_id` (integer, required)
  - `venue_name` (required)
  - `venue_address` (optional)
  - `venue_city` (optional)
  - `venue_capacity` (positive integer, optional)
  - `venue_contact_person`, `venue_contact_email`, `venue_contact_phone` (optional)
  - `venue_status` (optional, default 'Active')
- **Response**: `{ venue data }`

#### PUT `/api/venues/:id`
- **Purpose**: Update venue
- **Authentication**: Required
- **Body**: Same as POST
- **Response**: `{ updated venue }`

#### DELETE `/api/venues/:id`
- **Purpose**: Delete venue
- **Authentication**: Required
- **Response**: `{ message }`

---

### Vendor Management (`/api/vendors`)

#### GET `/api/vendors`
- **Purpose**: Get all vendors with filtering
- **Authentication**: Required (Admin/Customer Admin roles)
- **Query Parameters**:
  - `customer_id` (integer, filter by customer)
  - `vendor_type` (string, filter by type)
  - `vendor_status` (string, filter by status)
- **Response**: `{ vendors with customer info }`

#### GET `/api/vendors/customer/:customerId`
- **Purpose**: Get vendors for specific customer
- **Authentication**: Required (Admin/Customer Admin roles)
- **Response**: `{ customer vendors }`

#### GET `/api/vendors/types`
- **Purpose**: Get unique vendor types
- **Authentication**: Required (Admin/Customer Admin roles)
- **Response**: `{ vendor_types: [...] }`

#### GET `/api/vendors/:id`
- **Purpose**: Get vendor by ID with details and allocations
- **Authentication**: Required (Admin/Customer Admin roles)
- **Response**: `{ complete vendor information }`

#### POST `/api/vendors`
- **Purpose**: Create new vendor
- **Authentication**: Required (Admin/Customer Admin roles)
- **Body**: Vendor master data and detail fields
- **Response**: `{ vendor data }`

#### PUT `/api/vendors/:id`
- **Purpose**: Update vendor
- **Authentication**: Required (Admin/Customer Admin roles)
- **Body**: Same as POST
- **Response**: `{ updated vendor }`

#### DELETE `/api/vendors/:id`
- **Purpose**: Delete vendor
- **Authentication**: Required (Admin/Customer Admin roles)
- **Response**: `{ message }`
- **Special**: Cascade deletes related records

#### POST `/api/vendors/:id/events`
- **Purpose**: Assign vendor to event
- **Authentication**: Required (Admin/Customer Admin roles)
- **Body**: Event allocation details with service times and cost
- **Response**: `{ allocation data }`

#### GET `/api/vendors/:id/events`
- **Purpose**: Get vendor's event assignments
- **Authentication**: Required (Admin/Customer Admin roles)
- **Response**: `{ event allocations }`

#### DELETE `/api/vendors/:vendorId/events/:eventAllocationId`
- **Purpose**: Remove vendor from event
- **Authentication**: Required (Admin/Customer Admin roles)
- **Response**: `{ message }`

---

### Master Data (`/api/master-data`)

#### Event Types
- **GET** `/event-types` - Get all event types
- **POST** `/event-types` - Create event type (`event_type_name` required)
- **PUT** `/event-types/:id` - Update event type
- **DELETE** `/event-types/:id` - Delete event type

#### Tasks
- **GET** `/tasks` - Get all tasks
- **POST** `/tasks` - Create task (`task_name` required)
- **PUT** `/tasks/:id` - Update task
- **DELETE** `/tasks/:id` - Delete task

#### Notification Types
- **GET** `/notification-types` - Get all notification types
- **POST** `/notification-types` - Create notification type
- **PUT** `/notification-types/:id` - Update notification type
- **DELETE** `/notification-types/:id` - Delete notification type

---

### Employee Management (`/api/employee-management`)

#### Departments
- **GET** `/departments` - Get departments (filtered by Customer Admin)
- **POST** `/departments` - Create department
- **PUT** `/departments/:id` - Update department
- **DELETE** `/departments/:id` - Delete department

#### Teams
- **GET** `/teams` - Get teams (filtered by Customer Admin)
- **POST** `/teams` - Create team
- **GET** `/teams/:id` - Get team by ID
- **PUT** `/teams/:id` - Update team
- **DELETE** `/teams/:id` - Delete team

#### Employees
- **GET** `/employees` - Get employees (filtered by Customer Admin)
- **GET** `/employees/:id` - Get employee by ID
- **POST** `/employees` - Create employee
- **PUT** `/employees/:id` - Update employee
- **DELETE** `/employees/:id` - Delete employee

---

### Feature Toggles (`/api/feature-toggles`)

#### GET `/api/feature-toggles`
- **Purpose**: Get all feature toggles
- **Authentication**: Required (`feature_toggle_view` permission or Admin role)
- **Response**: `{ feature_toggles: [...] }`

#### GET `/api/feature-toggles/:name`
- **Purpose**: Get specific feature toggle
- **Authentication**: Required (`feature_toggle_view` permission or Admin role)
- **Response**: `{ feature_toggle data }`

#### PATCH `/api/feature-toggles/update`
- **Purpose**: Update feature toggle status
- **Authentication**: Required (`feature_toggle_edit` permission or Admin role)
- **Body**:
  - `name` (string, required)
  - `is_enabled` (boolean, required)
- **Response**: `{ updated feature_toggle }`

---

### Comprehensive CRUD (`/api/comprehensive-crud`)

Generic CRUD operations for various database tables:

#### Available Entity Routes
- `/users` - User management with roles
- `/roles` - Role management
- `/permissions` - Permission management
- `/user-roles` - User role assignments
- `/role-permissions` - Role permission assignments
- `/activity-logs` - Activity logging
- `/subevents` - Subevent management
- `/guest-groups` - Guest group management
- And many more specialized tables...

#### Standard CRUD Operations
- **GET** `/:entity` - List all records with pagination
- **GET** `/:entity/:id` - Get specific record
- **POST** `/:entity` - Create new record
- **PUT** `/:entity/:id` - Update record
- **DELETE** `/:entity/:id` - Delete record

#### Special Endpoints
- **GET** `/guests-with-rsvp/:eventId` - Get guests with RSVP status
- **GET** `/users/profile` - Get current user profile
- **GET** `/event-schedule/:eventId` - Get event schedule with subevents
- **GET** `/venue-availability/:venueId` - Get venue booking availability

---

### Utility Endpoints

#### Widget Configuration (`/api/widget-config`)
- **GET** `/` - Get widget configuration (no auth)
- **POST** `/` - Save widget configuration (no auth)

#### File Upload (`/api/upload`)
- **POST** `/` - Upload multiple files via multipart form (no auth)
- **Response**: `{ message, files: [...] }`

---

## Error Handling

### Standard HTTP Status Codes
- **200 OK**: Successful GET/PUT operations
- **201 Created**: Successful POST operations
- **204 No Content**: Successful DELETE operations
- **400 Bad Request**: Validation errors, malformed requests
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Valid auth but insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflicts (duplicate email, etc.)
- **500 Internal Server Error**: Server errors

### Error Response Format
```json
{
  "error": "Error message",
  "details": "Additional details (development mode only)",
  "errors": [
    {
      "field": "email",
      "message": "Email is required",
      "value": ""
    }
  ]
}
```

### Validation Error Response
```json
{
  "error": "Validation failed",
  "errors": [
    {
      "type": "field",
      "msg": "Invalid value",
      "path": "email",
      "location": "body"
    }
  ]
}
```

---

## Security Features

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with 24h expiration
- **Role-Based Access Control**: Permission-based endpoint protection
- **Password Security**: Bcrypt hashing with salt rounds
- **Token Validation**: Middleware validates tokens on protected routes

### Input Validation
- **Express-validator**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries throughout
- **File Upload Security**: Type and size validation
- **XSS Protection**: Helmet middleware for security headers

### Activity Logging
- **Comprehensive Audit Trail**: All user actions logged
- **IP and User Agent Tracking**: Full request context captured
- **Event-driven Logging**: Inter-module communication via EventEmitter

### Feature Controls
- **Feature Toggles**: Runtime enable/disable of features
- **Permission Checks**: Granular permission validation
- **Role Hierarchy**: Admin > Customer Admin > Client Admin > User

---

## Development Notes

### Database Access
- **Connection**: Available as `req.app.locals.db` in all routes
- **Promisified Methods**: Use `dbMethods.run()`, `dbMethods.get()`, `dbMethods.all()`
- **Transactions**: Supported for complex operations
- **Foreign Keys**: Enabled with cascade delete where appropriate

### Inter-Module Communication
- **Event Bus**: `req.app.locals.eventBus` for module communication
- **Event Patterns**: `module:action` (e.g., `user:created`, `payment:verified`)
- **Async Handling**: Event listeners should handle async operations properly

### File Handling
- **Upload Directory**: `backend/uploads/`
- **Static Serving**: Files accessible via `/uploads/` URL path
- **Multipart Support**: Multer middleware for file uploads

### Environment Configuration
- **Production Mode**: Static file serving for frontend build
- **Development Mode**: Morgan logging enabled
- **CORS**: Configurable allowed origins
- **Port**: Configurable via PORT environment variable

This API reference serves as the authoritative guide for all backend endpoints in the RSVP4 application. Use it for development, testing, and integration planning.