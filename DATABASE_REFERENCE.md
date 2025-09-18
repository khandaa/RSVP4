# Database Reference - RSVP4 System

This document provides a comprehensive reference for the RSVP4 database schema, including all tables, columns, relationships, and usage patterns.

## Database Overview

- **Database**: SQLite (`db/RSVP4.db`)
- **Total Tables**: 56+ tables
- **Architecture**: Modular with clear entity relationships
- **Primary Keys**: Auto-incrementing INTEGER for all master tables

## Core Architecture

### Table Categories

1. **System Tables**: User management, roles, permissions, activity logs
2. **Master Data**: Customers, clients, events, guests, venues, employees
3. **Transactional**: Allocations, communications, RSVPs, documents
4. **Supporting**: Event types, departments, teams, notifications

### Naming Convention

- **Master Tables**: `[module]_master_[entity]` (e.g., `rsvp_master_events`)
- **Transaction Tables**: `[module]_[entity]_tx` or `[module]_[descriptive_name]`
- **Detail Tables**: `[module]_[entity]_details`

## System Tables

### Authentication & Authorization

#### users_master
```sql
user_id (PK, AUTO_INCREMENT)
mobile_number (UNIQUE, NOT NULL)
password_hash (NOT NULL)
email (UNIQUE, NOT NULL)
first_name (NOT NULL)
last_name (NOT NULL)
is_active (BOOLEAN, DEFAULT 1)
created_at, updated_at (TIMESTAMPS)
```

#### roles_master
```sql
role_id (PK, AUTO_INCREMENT)
name (UNIQUE, NOT NULL)
description
created_at, updated_at (TIMESTAMPS)
```

#### permissions_master
```sql
permission_id (PK, AUTO_INCREMENT)
name (UNIQUE, NOT NULL)
description
created_at, updated_at (TIMESTAMPS)
```

#### user_roles_tx
```sql
user_role_id (PK, AUTO_INCREMENT)
user_id (FK -> users_master.user_id)
role_id (FK -> roles_master.role_id)
created_at (TIMESTAMP)
UNIQUE(user_id, role_id)
```

#### role_permissions_tx
```sql
role_permission_id (PK, AUTO_INCREMENT)
role_id (FK -> roles_master.role_id)
permission_id (FK -> permissions_master.permission_id)
created_at (TIMESTAMP)
UNIQUE(role_id, permission_id)
```

### System Monitoring

#### activity_logs_tx
```sql
activity_log_id (PK, AUTO_INCREMENT)
user_id (FK -> users_master.user_id, ON DELETE SET NULL)
action (NOT NULL)
details
ip_address
user_agent
created_at (TIMESTAMP)
```

#### feature_toggles
```sql
id (PK, AUTO_INCREMENT)
feature_name (UNIQUE, NOT NULL)
is_enabled (INTEGER, DEFAULT 0)
description
created_at, updated_at (TIMESTAMPS)
feature (DEFAULT 'user_management')
```

## Master Data Tables

### Business Hierarchy: Customer → Client → Event → Subevent

#### master_customers
```sql
customer_id (PK)
customer_name (NOT NULL, VARCHAR(100))
customer_email (VARCHAR(100))
customer_phone (VARCHAR(20))
customer_address (TEXT)
customer_city (TEXT)
customer_status (VARCHAR(20), DEFAULT 'Active')
created_at, updated_at (TIMESTAMPS)
```

#### rsvp_master_clients
```sql
client_id (PK)
customer_id (FK -> master_customers.customer_id, NOT NULL)
client_name (NOT NULL, VARCHAR(100))
client_email (VARCHAR(100))
client_phone (VARCHAR(20))
client_address (TEXT)
client_city (TEXT)
client_status (VARCHAR(20), DEFAULT 'Active')
created_at, updated_at (TIMESTAMPS)
```

#### rsvp_master_events
```sql
event_id (PK)
client_id (FK -> rsvp_master_clients.client_id, NOT NULL)
event_name (NOT NULL, VARCHAR(100))
event_description (TEXT)
event_status (VARCHAR(20), DEFAULT 'Planned')
event_type_id (FK -> rsvp_master_event_types.event_type_id)
event_start_date (DATE)
event_end_date (DATE)
created_at, updated_at (TIMESTAMPS)
```

#### rsvp_master_subevents
```sql
subevent_id (PK)
event_id (FK -> rsvp_master_events.event_id, NOT NULL)
subevent_name (NOT NULL, VARCHAR(100))
subevent_description (TEXT)
subevent_start_datetime (DATETIME)
subevent_end_datetime (DATETIME)
subevent_status (VARCHAR(20), DEFAULT 'Planned')
created_at, updated_at (TIMESTAMPS)
```

### Guest Management

#### rsvp_master_guests
```sql
guest_id (PK)
client_id (FK -> rsvp_master_clients.client_id, NOT NULL)
event_id (FK -> rsvp_master_events.event_id, NOT NULL)
subevent_id (FK -> rsvp_master_subevents.subevent_id)
guest_first_name (NOT NULL, VARCHAR(50))
guest_last_name (NOT NULL, VARCHAR(50))
guest_email (VARCHAR(100))
guest_phone (VARCHAR(20))
guest_status (VARCHAR(20), DEFAULT 'Active')
created_at, updated_at (TIMESTAMPS)
```

#### rsvp_master_guest_groups
```sql
guest_group_id (PK)
client_id (FK -> rsvp_master_clients.client_id, NOT NULL)
group_name (NOT NULL, VARCHAR(100))
group_description (TEXT)
created_at, updated_at (TIMESTAMPS)
```

### Venue Management

#### rsvp_master_venues
```sql
venue_id (PK)
customer_id (FK -> master_customers.customer_id, NOT NULL)
venue_name (NOT NULL, VARCHAR(100))
venue_address (TEXT)
venue_city (TEXT)
venue_capacity (INTEGER)
venue_contact_person (VARCHAR(100))
venue_contact_email (VARCHAR(100))
venue_contact_phone (VARCHAR(20))
venue_status (VARCHAR(20), DEFAULT 'Active')
created_at, updated_at (TIMESTAMPS)
```

#### rsvp_master_rooms
```sql
room_id (PK)
venue_id (FK -> rsvp_master_venues.venue_id, NOT NULL)
room_name (NOT NULL, VARCHAR(50))
room_number (NOT NULL, VARCHAR(10))
room_floor (NOT NULL, VARCHAR(10))
room_type (VARCHAR(30))
room_capacity (INTEGER)
room_description (TEXT)
room_facilities (TEXT)
room_amenities (TEXT)
room_notes (TEXT)
room_key_no (TEXT)
room_status (VARCHAR(20), DEFAULT 'Available')
created_at, updated_at (TIMESTAMPS)
```

### Employee & Team Management

#### rsvp_master_employees
```sql
employee_id (PK)
customer_id (FK -> master_customers.customer_id, NOT NULL)
department_id (FK -> rsvp_master_departments.department_id)
team_id (FK -> rsvp_master_teams.team_id)
first_name (NOT NULL, VARCHAR(50))
last_name (NOT NULL, VARCHAR(50))
email (NOT NULL, VARCHAR(100))
phone (VARCHAR(20))
hire_date (DATE)
employee_status (VARCHAR(20), DEFAULT 'Active')
created_at, updated_at (TIMESTAMPS)
```

#### rsvp_master_teams
```sql
team_id (PK)
customer_id (FK -> master_customers.customer_id, NOT NULL)
team_name (NOT NULL, VARCHAR(100))
team_leader_id (FK -> rsvp_master_employees.employee_id)
team_description (TEXT)
team_status (VARCHAR(20), DEFAULT 'Active')
created_at, updated_at (TIMESTAMPS)
```

#### rsvp_master_departments
```sql
department_id (PK)
department_name (NOT NULL, VARCHAR(100))
customer_id (FK -> master_customers.customer_id, NOT NULL)
department_description (TEXT)
department_status (VARCHAR(20), DEFAULT 'Active')
created_at, updated_at (TIMESTAMPS)
```

### Vendor Management

#### rsvp_master_vendors
```sql
vendor_id (PK)
customer_id (FK -> master_customers.customer_id, NOT NULL)
vendor_name (NOT NULL, VARCHAR(100))
vendor_type (VARCHAR(50))
vendor_email (VARCHAR(100))
vendor_phone (VARCHAR(20))
vendor_address (TEXT)
vendor_status (VARCHAR(20), DEFAULT 'Active')
created_at, updated_at (TIMESTAMPS)
```

## Detail & Extension Tables

### Client Details
#### rsvp_client_details
```sql
client_detail_id (PK)
client_id (FK -> rsvp_master_clients.client_id, NOT NULL)
contact_person (VARCHAR(100))
contact_email (VARCHAR(100))
contact_phone (VARCHAR(20))
billing_address (TEXT)
shipping_address (TEXT)
tax_information (TEXT)
tax_information_id (TEXT)
notes (TEXT)
created_at, updated_at (TIMESTAMPS)
```

### Event Details
#### rsvp_event_details
```sql
event_detail_id (PK)
event_id (FK -> rsvp_master_events.event_id, NOT NULL)
event_budget (DECIMAL(12,2))
event_location (TEXT)
event_city (NOT NULL, TEXT)
event_notes (TEXT)
created_at, updated_at (TIMESTAMPS)
```

### Guest Details
#### rsvp_guest_details
```sql
guest_detail_id (PK)
guest_id (FK -> rsvp_master_guests.guest_id, NOT NULL)
guest_priority (VARCHAR(10))
guest_address (TEXT)
guest_city (VARCHAR(50))
guest_state (VARCHAR(50))
guest_postal_code (VARCHAR(20))
guest_country (VARCHAR(50))
dietary_restrictions (TEXT)
special_requirements (TEXT)
created_at, updated_at (TIMESTAMPS)
```

## Transactional Tables

### Allocation Tables

#### rsvp_guest_event_allocation
```sql
allocation_id (PK)
guest_id (FK -> rsvp_master_guests.guest_id, NOT NULL)
event_id (FK -> rsvp_master_events.event_id, NOT NULL)
subevent_id (FK -> rsvp_master_subevents.subevent_id, NOT NULL)
invitation_status (VARCHAR(20), DEFAULT 'Invited')
allocation_notes (TEXT)
created_at, updated_at (TIMESTAMPS)
```

#### rsvp_venue_event_allocation
```sql
allocation_id (PK)
venue_id (FK -> rsvp_master_venues.venue_id, NOT NULL)
event_id (FK -> rsvp_master_events.event_id, NOT NULL)
allocation_start_datetime (DATETIME)
allocation_end_datetime (DATETIME)
allocation_notes (TEXT)
created_at, updated_at (TIMESTAMPS)
```

#### rsvp_team_event_allocation
```sql
allocation_id (PK)
team_id (FK -> rsvp_master_teams.team_id, NOT NULL)
event_id (FK -> rsvp_master_events.event_id, NOT NULL)
role_description (TEXT)
allocation_notes (TEXT)
created_at, updated_at (TIMESTAMPS)
```

### Travel & Accommodation

#### rsvp_guest_travel
```sql
travel_id (PK)
guest_id (FK -> rsvp_master_guests.guest_id, NOT NULL)
event_id (FK -> rsvp_master_events.event_id, NOT NULL)
travel_from (TEXT)
travel_to (TEXT)
travel_type (CHECK: 'arrival', 'departure', 'local', 'international')
travel_mode (CHECK: 'bus', 'train', 'flight', 'ship', 'cab', 'private', 'other')
travel_date (DATE)
travel_time (TIME)
travel_reference (VARCHAR(50))
travel_notes (TEXT)
created_at, updated_at (TIMESTAMPS)
```

#### rsvp_guest_accommodation
```sql
accommodation_id (PK)
guest_id (FK -> rsvp_master_guests.guest_id, NOT NULL)
event_id (FK -> rsvp_master_events.event_id, NOT NULL)
venue_id (FK -> rsvp_master_venues.venue_id)
room_id (FK -> rsvp_master_rooms.room_id)
check_in_date (DATE)
check_out_date (DATE)
accommodation_type (VARCHAR(50))
room_sharing_preference (TEXT)
accommodation_notes (TEXT)
created_at, updated_at (TIMESTAMPS)
```

### Communication & RSVP

#### rsvp_guest_communication
```sql
communication_id (PK)
guest_id (FK -> rsvp_master_guests.guest_id, NOT NULL)
event_id (FK -> rsvp_master_events.event_id)
communication_type (VARCHAR(50))
communication_method (VARCHAR(50))
communication_content (TEXT)
sent_datetime (DATETIME)
delivery_status (VARCHAR(20))
response_received (BOOLEAN, DEFAULT 0)
created_at, updated_at (TIMESTAMPS)
```

#### rsvp_guest_rsvp
```sql
rsvp_id (PK)
guest_id (FK -> rsvp_master_guests.guest_id, NOT NULL)
event_id (FK -> rsvp_master_events.event_id, NOT NULL)
subevent_id (FK -> rsvp_master_subevents.subevent_id)
rsvp_status (CHECK: 'Pending', 'Accepted', 'Declined', 'Tentative')
response_datetime (DATETIME)
guest_count (INTEGER, DEFAULT 1)
dietary_preferences (TEXT)
special_requests (TEXT)
rsvp_notes (TEXT)
created_at, updated_at (TIMESTAMPS)
```

## Payment System

#### payment_qr_codes
```sql
id (PK, AUTO_INCREMENT)
name (NOT NULL, VARCHAR(100))
description (TEXT)
payment_type (NOT NULL, VARCHAR(50)) -- 'UPI', 'BANK', 'WALLET'
image_url (VARCHAR(255)) -- File system path
active (BOOLEAN, DEFAULT 0) -- Only one active at a time
created_at, updated_at (TIMESTAMPS)
INDEX: idx_payment_type
```

#### payment_transactions
```sql
id (PK, AUTO_INCREMENT)
qr_code_id (FK -> payment_qr_codes.id)
transaction_ref (UNIQUE, NOT NULL, VARCHAR(100))
user_id (FK -> users.id)
verified (BOOLEAN, DEFAULT 0)
created_at (TIMESTAMP)
updated_at (TIMESTAMP, NULL)
```

## Support Tables

### Event Types
#### rsvp_master_event_types
```sql
event_type_id (PK)
event_type_name (NOT NULL, VARCHAR(50))
event_type_description (TEXT)
created_at, updated_at (TIMESTAMPS)
```

### Tasks
#### rsvp_master_tasks
```sql
task_id (PK)
task_name (NOT NULL, VARCHAR(100))
task_description (TEXT)
task_priority (VARCHAR(20), DEFAULT 'Medium')
created_at, updated_at (TIMESTAMPS)
```

### Notifications
#### rsvp_master_notification_types
```sql
notification_type_id (PK)
notification_type_name (NOT NULL, VARCHAR(50))
notification_type_description (TEXT)
notification_medium (TEXT)
notification_sending_identifier_name (TEXT)
notification_sending_identifier_value (TEXT)
created_at, updated_at (TIMESTAMPS)
```

#### notification_templates
```sql
template_id (PK)
template_name (NOT NULL, VARCHAR(100))
template_subject (VARCHAR(200))
template_content (TEXT)
template_type (VARCHAR(50))
template_variables (TEXT)
is_active (BOOLEAN, DEFAULT 1)
created_at, updated_at (TIMESTAMPS)
```

## Document Management

#### rsvp_event_documents
```sql
document_id (PK)
event_id (FK -> rsvp_master_events.event_id, NOT NULL)
document_name (NOT NULL, VARCHAR(100))
document_type (VARCHAR(50))
document_path (VARCHAR(255))
created_at, updated_at (TIMESTAMPS)
```

#### rsvp_guest_documents
```sql
document_id (PK)
guest_id (FK -> rsvp_master_guests.guest_id, NOT NULL)
document_identifier_value (TEXT)
document_type (CHECK: 'PAN', 'AADHAR', 'Voter ID', 'Driving License', 'Passport')
document_path (VARCHAR(255))
uploaded_at, created_at, updated_at (TIMESTAMPS)
```

## Key Relationships

### Primary Hierarchies
1. **Business Flow**: Customer → Client → Event → Subevent → Guest
2. **Venue Flow**: Customer → Venue → Room
3. **Team Flow**: Customer → Department → Team → Employee
4. **Document Flow**: Event/Guest → Documents

### Cross-Entity Relationships
- **Guest-Event Allocation**: Many-to-many via `rsvp_guest_event_allocation`
- **Venue-Event Allocation**: Many-to-many via `rsvp_venue_event_allocation`
- **Team-Event Allocation**: Many-to-many via `rsvp_team_event_allocation`
- **Guest Grouping**: Many-to-many via `rsvp_guest_group_details`

## Usage Patterns

### Common Queries
- **Event Dashboard**: Join events with client, customer, and subevent counts
- **Guest Management**: Join guests with details, RSVP status, and allocations
- **Venue Availability**: Check room allocations against date ranges
- **Team Assignments**: Join teams with employees and event allocations

### Data Integrity
- **Cascade Deletes**: User-role relationships, role-permission relationships
- **Set NULL**: Activity logs when users are deleted
- **Status Fields**: Most entities have status for soft deletes
- **Audit Trail**: All tables include created_at and updated_at timestamps

This reference should be used for:
1. Understanding table relationships before writing queries
2. Identifying correct foreign key constraints
3. Planning new feature database requirements
4. Debugging data integrity issues
5. API development and endpoint design