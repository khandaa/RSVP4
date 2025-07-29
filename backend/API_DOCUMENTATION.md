# RSVP4 Backend API Documentation

## Overview
This document describes the CRUD API endpoints for all tables in the RSVP4 database. All endpoints require authentication via JWT token in the Authorization header.

### Authentication
All endpoints require a valid JWT token:
```
Authorization: Bearer <your-jwt-token>
```

## Base URL
```
http://localhost:5000/api
```

## API Endpoints

### Customer Management
- `GET /customers` - Get all customers
- `GET /customers/:id` - Get customer by ID
- `POST /customers` - Create new customer
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer

**Customer Fields:**
- `customer_name` (required)
- `customer_email` (optional, must be valid email)
- `customer_phone` (optional)
- `customer_address` (optional)
- `customer_city` (optional)
- `customer_status` (optional, defaults to 'Active')

### Client Management
- `GET /clients` - Get all clients with customer info
- `GET /clients/:id` - Get client by ID
- `POST /clients` - Create new client
- `PUT /clients/:id` - Update client
- `DELETE /clients/:id` - Delete client

**Client Fields:**
- `customer_id` (required, integer)
- `client_name` (required)
- `client_email` (optional, must be valid email)
- `client_phone` (optional)
- `client_address` (optional)
- `client_city` (optional)
- `client_status` (optional, defaults to 'Active')

### Event Management
- `GET /events` - Get all events with client and event type info
- `GET /events/:id` - Get event by ID
- `POST /events` - Create new event
- `PUT /events/:id` - Update event
- `DELETE /events/:id` - Delete event

**Event Fields:**
- `client_id` (required, integer)
- `event_name` (required)
- `event_description` (optional)
- `event_status` (optional, defaults to 'Planned')
- `event_type_id` (optional, integer)
- `event_start_date` (optional, ISO8601 format)
- `event_end_date` (optional, ISO8601 format)

### Guest Management
- `GET /guests` - Get all guests with related info
- `GET /guests/:id` - Get guest by ID
- `GET /guests/event/:eventId` - Get guests for specific event
- `POST /guests` - Create new guest
- `PUT /guests/:id` - Update guest
- `DELETE /guests/:id` - Delete guest

**Guest Fields:**
- `client_id` (required, integer)
- `event_id` (required, integer)
- `subevent_id` (optional, integer)
- `guest_first_name` (required)
- `guest_last_name` (required)
- `guest_email` (optional, must be valid email)
- `guest_phone` (optional)
- `guest_status` (optional, defaults to 'Active')

### Venue Management
- `GET /venues` - Get all venues with customer info
- `GET /venues/:id` - Get venue by ID
- `POST /venues` - Create new venue
- `PUT /venues/:id` - Update venue
- `DELETE /venues/:id` - Delete venue

**Venue Fields:**
- `customer_id` (required, integer)
- `venue_name` (required)
- `venue_address` (optional)
- `venue_city` (optional)
- `venue_capacity` (optional, positive integer)
- `venue_contact_person` (optional)
- `venue_contact_email` (optional, must be valid email)
- `venue_contact_phone` (optional)
- `venue_status` (optional, defaults to 'Active')

### Master Data Management
#### Event Types
- `GET /master-data/event-types` - Get all event types
- `POST /master-data/event-types` - Create event type
- `PUT /master-data/event-types/:id` - Update event type
- `DELETE /master-data/event-types/:id` - Delete event type

#### Tasks
- `GET /master-data/tasks` - Get all tasks
- `POST /master-data/tasks` - Create task
- `PUT /master-data/tasks/:id` - Update task
- `DELETE /master-data/tasks/:id` - Delete task

#### Notification Types
- `GET /master-data/notification-types` - Get all notification types
- `POST /master-data/notification-types` - Create notification type
- `PUT /master-data/notification-types/:id` - Update notification type
- `DELETE /master-data/notification-types/:id` - Delete notification type

### Employee Management
#### Departments
- `GET /employee-management/departments` - Get all departments
- `POST /employee-management/departments` - Create department
- `PUT /employee-management/departments/:id` - Update department
- `DELETE /employee-management/departments/:id` - Delete department

#### Teams
- `GET /employee-management/teams` - Get all teams
- `POST /employee-management/teams` - Create team

#### Employees
- `GET /employee-management/employees` - Get all employees
- `GET /employee-management/employees/:id` - Get employee by ID
- `POST /employee-management/employees` - Create employee
- `PUT /employee-management/employees/:id` - Update employee
- `DELETE /employee-management/employees/:id` - Delete employee

### Comprehensive CRUD Operations
All remaining database tables are accessible via the `/crud` endpoint with the following pattern:

#### User Management Tables
- `GET/POST/PUT/DELETE /crud/users` - User master table
- `GET/POST/PUT/DELETE /crud/roles` - Roles master table
- `GET/POST/PUT/DELETE /crud/permissions` - Permissions master table
- `GET/POST/PUT/DELETE /crud/user-roles` - User roles relationships
- `GET/POST/PUT/DELETE /crud/role-permissions` - Role permissions relationships
- `GET/POST/PUT/DELETE /crud/activity-logs` - Activity logs

#### RSVP Master Tables
- `GET/POST/PUT/DELETE /crud/subevents` - Subevents
- `GET/POST/PUT/DELETE /crud/guest-groups` - Guest groups
- `GET/POST/PUT/DELETE /crud/vendors` - Vendors
- `GET/POST/PUT/DELETE /crud/rooms` - Rooms
- `GET/POST/PUT/DELETE /crud/roles-master` - RSVP roles
- `GET/POST/PUT/DELETE /crud/notifications` - Notifications

#### Detail Tables
- `GET/POST/PUT/DELETE /crud/client-details` - Client details
- `GET/POST/PUT/DELETE /crud/event-details` - Event details
- `GET/POST/PUT/DELETE /crud/event-documents` - Event documents
- `GET/POST/PUT/DELETE /crud/subevent-details` - Subevent details
- `GET/POST/PUT/DELETE /crud/guest-details` - Guest details
- `GET/POST/PUT/DELETE /crud/guest-documents` - Guest documents
- `GET/POST/PUT/DELETE /crud/vendor-details` - Vendor details
- `GET/POST/PUT/DELETE /crud/venue-details` - Venue details
- `GET/POST/PUT/DELETE /crud/employee-details` - Employee details
- `GET/POST/PUT/DELETE /crud/team-details` - Team details

#### Allocation Tables
- `GET/POST/PUT/DELETE /crud/guest-event-allocation` - Guest event allocations
- `GET/POST/PUT/DELETE /crud/guest-group-details` - Guest group details
- `GET/POST/PUT/DELETE /crud/guest-travel` - Guest travel information
- `GET/POST/PUT/DELETE /crud/guest-accommodation` - Guest accommodation
- `GET/POST/PUT/DELETE /crud/guest-vehicle-allocation` - Guest vehicle allocation
- `GET/POST/PUT/DELETE /crud/vendor-event-allocation` - Vendor event allocation
- `GET/POST/PUT/DELETE /crud/venue-event-allocation` - Venue event allocation
- `GET/POST/PUT/DELETE /crud/event-room-allocation` - Event room allocation
- `GET/POST/PUT/DELETE /crud/team-event-allocation` - Team event allocation
- `GET/POST/PUT/DELETE /crud/employee-role-allocation` - Employee role allocation
- `GET/POST/PUT/DELETE /crud/employee-team-allocation` - Employee team allocation

#### Communication & RSVP Tables
- `GET/POST/PUT/DELETE /crud/guest-communication` - Guest communication
- `GET/POST/PUT/DELETE /crud/guest-rsvp` - Guest RSVP responses
- `GET/POST/PUT/DELETE /crud/notification-templates` - Notification templates

#### Task Management Tables
- `GET/POST/PUT/DELETE /crud/task-assignment-details` - Task assignments
- `GET/POST/PUT/DELETE /crud/task-event-subevent-mapping` - Task event mappings

#### Meeting Notes
- `GET/POST/PUT/DELETE /crud/client-meeting-notes` - Client meeting notes

### Special Endpoints

#### Guests with RSVP Status
- `GET /crud/guests-with-rsvp/:eventId` - Get guests for an event with their RSVP status

#### Event Schedule
- `GET /crud/event-schedule/:eventId` - Get complete event schedule with subevents, venues, and guest counts

#### Venue Availability
- `GET /crud/venue-availability/:venueId?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Check venue availability for date range

## Response Formats

### Success Response (200/201)
```json
{
  "field1": "value1",
  "field2": "value2",
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z"
}
```

### Error Response (400/404/500)
```json
{
  "error": "Error message description"
}
```

### Validation Error Response (400)
```json
{
  "errors": [
    {
      "msg": "Field is required",
      "param": "field_name",
      "location": "body"
    }
  ]
}
```

## Database Schema Overview

The RSVP4 database contains 56 tables organized into the following categories:

### Core Master Tables (9 tables)
- `master_customers` - Customer information
- `rsvp_master_clients` - Client information
- `rsvp_master_events` - Event information
- `rsvp_master_subevents` - Subevent information
- `rsvp_master_guests` - Guest information
- `rsvp_master_venues` - Venue information
- `rsvp_master_rooms` - Room information
- `rsvp_master_vendors` - Vendor information
- `rsvp_master_guest_groups` - Guest group information

### Employee Management (6 tables)
- `rsvp_master_employees` - Employee information
- `rsvp_master_departments` - Department information
- `rsvp_master_teams` - Team information
- `rsvp_master_roles` - Role definitions
- `rsvp_employee_details` - Extended employee details
- `rsvp_team_details` - Extended team details

### System Management (9 tables)
- `users_master` - System users
- `roles_master` - System roles
- `permissions_master` - System permissions
- `user_roles_tx` - User-role relationships
- `role_permissions_tx` - Role-permission relationships
- `activity_logs_tx` - Activity logging
- `feature_toggles` - Feature toggles
- `payment_qr_codes` - Payment QR codes
- `payment_transactions` - Payment transactions

### Detail Tables (12 tables)
- Various detail tables for extending master records with additional information

### Allocation Tables (11 tables)
- Tables managing relationships and allocations between different entities

### Communication Tables (4 tables)
- Tables managing notifications, templates, and guest communications

### Other Tables (5 tables)
- Task management, document storage, and other specialized functionality

## Getting Started

1. Ensure the backend server is running on port 5000
2. Obtain a valid JWT token through the authentication endpoints
3. Include the token in the Authorization header for all requests
4. Use the appropriate HTTP methods (GET, POST, PUT, DELETE) for CRUD operations
5. Follow the field requirements and validation rules for each table

## Error Handling

All endpoints include comprehensive error handling:
- Authentication errors (401)
- Authorization errors (403)
- Validation errors (400)
- Not found errors (404)
- Server errors (500)

Each error response includes a descriptive message to help with debugging and development.