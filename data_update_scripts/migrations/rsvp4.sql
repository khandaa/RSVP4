-- Table definitions for RSVP4 system
-- Master Tables (Reference data)
-- Drop tables if they already exist (in reverse order of dependencies)

-- Detail/Relationship Tables (Drop first to avoid foreign key constraints)
DROP TABLE IF EXISTS rsvp_client_meeting_notes;
DROP TABLE IF EXISTS rsvp_task_event_subevent_mapping;
DROP TABLE IF EXISTS rsvp_notification_templates;
DROP TABLE IF EXISTS rsvp_employee_team_allocation;
DROP TABLE IF EXISTS rsvp_employee_role_allocation;
DROP TABLE IF EXISTS rsvp_employee_details;
DROP TABLE IF EXISTS rsvp_team_event_allocation;
DROP TABLE IF EXISTS rsvp_team_details;
DROP TABLE IF EXISTS rsvp_task_assignment_details;
DROP TABLE IF EXISTS rsvp_event_room_allocation;
DROP TABLE IF EXISTS rsvp_venue_event_allocation;
DROP TABLE IF EXISTS rsvp_venue_details;
DROP TABLE IF EXISTS rsvp_vendor_event_allocation;
DROP TABLE IF EXISTS rsvp_vendor_details;
DROP TABLE IF EXISTS rsvp_guest_vehicle_allocation;
DROP TABLE IF EXISTS rsvp_guest_rsvp;
DROP TABLE IF EXISTS rsvp_guest_communication;
DROP TABLE IF EXISTS rsvp_guest_accommodation;
DROP TABLE IF EXISTS rsvp_guest_travel;
DROP TABLE IF EXISTS rsvp_guest_group_details;
DROP TABLE IF EXISTS rsvp_guest_event_allocation;
DROP TABLE IF EXISTS rsvp_guest_documents;
DROP TABLE IF EXISTS rsvp_guest_details;
DROP TABLE IF EXISTS rsvp_subevents_details;
DROP TABLE IF EXISTS rsvp_event_documents;
DROP TABLE IF EXISTS rsvp_event_details;
DROP TABLE IF EXISTS rsvp_client_details;

-- Master Tables (Drop after the tables that reference them)
DROP TABLE IF EXISTS rsvp_master_notification_types;
DROP TABLE IF EXISTS rsvp_master_notifications;
DROP TABLE IF EXISTS rsvp_master_employees;
DROP TABLE IF EXISTS rsvp_master_roles;
DROP TABLE IF EXISTS rsvp_master_departments;
DROP TABLE IF EXISTS rsvp_master_teams;
DROP TABLE IF EXISTS rsvp_master_tasks;
DROP TABLE IF EXISTS rsvp_master_event_types;
DROP TABLE IF EXISTS rsvp_master_rooms;
DROP TABLE IF EXISTS rsvp_master_venues;
DROP TABLE IF EXISTS rsvp_master_vendors;
DROP TABLE IF EXISTS rsvp_master_guest_groups;
DROP TABLE IF EXISTS rsvp_master_guests;
DROP TABLE IF EXISTS rsvp_master_subevents;
DROP TABLE IF EXISTS rsvp_master_events;
DROP TABLE IF EXISTS rsvp_master_clients;
DROP TABLE IF EXISTS master_customers;




CREATE TABLE master_customers (
    customer_id INTEGER PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    customer_city TEXT,
    customer_status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Client master table
CREATE TABLE rsvp_master_clients (
    client_id INTEGER PRIMARY KEY,
    customer_id INTEGER not null,
    client_name VARCHAR(100) NOT NULL,
    client_email VARCHAR(100),
    client_phone VARCHAR(20),
    client_address TEXT,
    client_city TEXT,
    client_status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES master_customers(customer_id)
);

-- Events master table
CREATE TABLE rsvp_master_events (
    event_id INTEGER PRIMARY KEY,
    client_id INTEGER NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    event_description TEXT,
    event_status VARCHAR(20) DEFAULT 'Planned',
    event_type_id integer, 
    event_start_date DATE,
    event_end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES rsvp_master_clients(client_id),
    FOREIGN KEY (event_type_id) REFERENCES rsvp_master_event_types(event_type_id)
);

-- Subevents master table
CREATE TABLE rsvp_master_subevents (
    subevent_id INTEGER PRIMARY KEY,
    event_id INTEGER NOT NULL,
    subevent_name VARCHAR(100) NOT NULL,
    subevent_description TEXT,
    subevent_start_datetime datetime,
    subevent_end_datetime datetime,
    subevent_status VARCHAR(20) DEFAULT 'Planned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES rsvp_master_events(event_id)
);

-- Guests master table
CREATE TABLE rsvp_master_guests (
    guest_id INTEGER PRIMARY KEY,
    client_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    subevent_id INTEGER ,
    guest_first_name VARCHAR(50) NOT NULL,
    guest_last_name VARCHAR(50) NOT NULL,
    guest_email VARCHAR(100),
    guest_phone VARCHAR(20),
    guest_status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES rsvp_master_clients(client_id),
    FOREIGN KEY (event_id) REFERENCES rsvp_master_events(event_id),
    FOREIGN KEY (subevent_id) REFERENCES rsvp_master_subevents(subevent_id)
);

-- Guest groups master table
CREATE TABLE rsvp_master_guest_groups (
    guest_group_id INTEGER PRIMARY KEY,
    client_id integer not null,
    group_name VARCHAR(100) NOT NULL,
    group_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES rsvp_master_clients(client_id)
);

-- Vendors master table
CREATE TABLE rsvp_master_vendors (
    vendor_id INTEGER PRIMARY KEY,
    customer_id integer not null, 
    vendor_name VARCHAR(100) NOT NULL,
    vendor_type VARCHAR(50),
    vendor_email VARCHAR(100),
    vendor_phone VARCHAR(20),
    vendor_address TEXT,
    vendor_status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES master_customers(customer_id)
);

-- Venues master table
CREATE TABLE rsvp_master_venues (
    customer_id integer not null, 
    venue_id INTEGER PRIMARY KEY,
    venue_name VARCHAR(100) NOT NULL,
    venue_address TEXT,
    venue_city TEXT,
    venue_capacity INTEGER,
    venue_contact_person VARCHAR(100),
    venue_contact_email VARCHAR(100),
    venue_contact_phone VARCHAR(20),
    venue_status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES master_customers(customer_id)
);


-- Rooms master table
CREATE TABLE rsvp_master_rooms (
    room_id INTEGER PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    room_name VARCHAR(50) NOT NULL,
    room_number varchar(10) not null, 
    room_floor varchar(10) not null, 
    room_type VARCHAR(30),
    room_capacity INTEGER,
    room_description TEXT,
    room_facilities TEXT,
    room_amenities TEXT,
    room_notes TEXT,
    room_key_no text, 
    room_status VARCHAR(20) DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES rsvp_master_venues(venue_id)
);

-- Event types master table
CREATE TABLE rsvp_master_event_types (
    event_type_id INTEGER PRIMARY KEY,
    event_type_name VARCHAR(50) NOT NULL,
    event_type_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- Tasks master table
CREATE TABLE rsvp_master_tasks (
    task_id INTEGER PRIMARY KEY,
    task_name VARCHAR(100) NOT NULL,
    task_description TEXT,
    task_priority VARCHAR(20) DEFAULT 'Medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams master table
CREATE TABLE rsvp_master_teams (
    team_id INTEGER PRIMARY KEY,
    customer_id integer not null, 
    team_name VARCHAR(100) NOT NULL,
    team_leader_id integer, 
    team_description TEXT,
    team_status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES master_customers(customer_id),
    FOREIGN KEY (team_leader_id) REFERENCES rsvp_master_employees(employee_id)
);

-- Departments master table
CREATE TABLE rsvp_master_departments (
    department_id INTEGER PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    customer_id integer not null, 
    department_description TEXT,
    department_status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES master_customers(customer_id)
);




-- Roles master table
CREATE TABLE rsvp_master_roles (
    role_id INTEGER PRIMARY KEY,
    customer_id integer not null, 
    role_name VARCHAR(50) NOT NULL,
    role_description TEXT,
    role_status varchar(20) default 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES master_customers(customer_id)
);

-- Employees master table
CREATE TABLE rsvp_master_employees (
    employee_id INTEGER PRIMARY KEY,
    customer_id integer not null, 
    department_id INTEGER,
    team_id integer, 
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    hire_date DATE,
    employee_status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES master_customers(customer_id),
    FOREIGN KEY (department_id) REFERENCES rsvp_master_departments(department_id),
    FOREIGN KEY (team_id) REFERENCES rsvp_master_teams(team_id)
);

-- Notifications master table
CREATE TABLE rsvp_master_notifications (
    notification_id INTEGER PRIMARY KEY,
    notification_type_id INTEGER NOT NULL,
    notification_title VARCHAR(100) NOT NULL,
    notification_content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_type_id) REFERENCES rsvp_master_notification_types(notification_type_id)
);

-- Notification types master table
CREATE TABLE rsvp_master_notification_types (
    notification_type_id INTEGER PRIMARY KEY,
    notification_type_name VARCHAR(50) NOT NULL,
    notification_type_description TEXT,
    notification_medium text, 
    notification_sending_identifier_name text, 
    notification_sending_identifier_value text, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Detail/Relationship Tables

-- Client details table
CREATE TABLE rsvp_client_details (
    client_detail_id INTEGER PRIMARY KEY,
    client_id INTEGER NOT NULL,
    contact_person VARCHAR(100),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    billing_address TEXT,
    shipping_address TEXT,
    tax_information TEXT,
    tax_information_id text, 
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES rsvp_master_clients(client_id)
);

-- Event details table
CREATE TABLE rsvp_event_details (
    event_detail_id INTEGER PRIMARY KEY,
    event_id INTEGER NOT NULL,
    event_budget DECIMAL(12,2),
    event_location TEXT,
    event_city text NOT NULL,
    event_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES rsvp_master_events(event_id)
);

-- Event documents table
CREATE TABLE rsvp_event_documents (
    document_id INTEGER PRIMARY KEY,
    event_id INTEGER NOT NULL,
    document_name VARCHAR(100) NOT NULL,
    document_type VARCHAR(50),
    document_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES rsvp_master_events(event_id)
);

-- Subevent details table
CREATE TABLE rsvp_subevents_details (
    subevent_detail_id INTEGER PRIMARY KEY,
    subevent_id INTEGER NOT NULL,
    venue_id INTEGER,
    subevent_allocated_group_id integer, 
    subevent_allocated_team_id integer, 
    venue_capacity INTEGER,
    setup_instructions TEXT,
    subevent_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subevent_id) REFERENCES rsvp_master_subevents(subevent_id),
    FOREIGN KEY (venue_id) REFERENCES rsvp_master_venues(venue_id),
    FOREIGN KEY (subevent_allocated_group_id) REFERENCES rsvp_master_guest_groups(guest_group_id),
    FOREIGN KEY (subevent_allocated_team_id) REFERENCES rsvp_master_teams(team_id)
);

-- Guest details table
CREATE TABLE rsvp_guest_details (
    guest_detail_id INTEGER PRIMARY KEY,
    guest_id INTEGER NOT NULL,
    guest_priority VARCHAR(10),
    guest_address TEXT,
    guest_city VARCHAR(50),
    guest_state VARCHAR(50),
    guest_postal_code VARCHAR(20),
    guest_country VARCHAR(50),
    dietary_restrictions TEXT,
    special_requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES rsvp_master_guests(guest_id)
);

-- Guest documents table
CREATE TABLE rsvp_guest_documents (
    document_id INTEGER PRIMARY KEY,
    guest_id INTEGER NOT NULL,
    document_identifier_value text, 
    document_type VARCHAR(50) CHECK (document_type IN ('PAN','AADHAR','Voter ID', 'Driving License','Passport')),
    document_path VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES rsvp_master_guests(guest_id)
);

-- Guest event allocation table
CREATE TABLE rsvp_guest_event_allocation (
    allocation_id INTEGER PRIMARY KEY,
    guest_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    subevent_id integer not null, 
    invitation_status VARCHAR(20) DEFAULT 'Invited',
    allocation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES rsvp_master_guests(guest_id),
    FOREIGN KEY (event_id) REFERENCES rsvp_master_events(event_id),
        FOREIGN KEY (subevent_id) REFERENCES rsvp_master_subevents(subevent_id)
);


-- Guest group details table
CREATE TABLE rsvp_guest_group_details (
    group_detail_id INTEGER PRIMARY KEY,
    guest_group_id INTEGER NOT NULL,
    guest_id INTEGER NOT NULL,
    group_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_group_id) REFERENCES rsvp_master_guest_groups(guest_group_id),
    FOREIGN KEY (guest_id) REFERENCES rsvp_master_guests(guest_id)
);

-- Guest travel table
CREATE TABLE rsvp_guest_travel (
    travel_id INTEGER PRIMARY KEY,
    guest_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    travel_from text, 
    travel_to text, 
    travel_type text CHECK (travel_type IN ('arrival', 'departure', 'local', 'international')),
    travel_mode text CHECK (travel_mode IN ('bus', 'train', 'flight', 'ship', 'cab','private', 'other')),
    travel_date DATE,
    travel_time TIME,
    meetup_location VARCHAR(100),
    transportation_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES rsvp_master_guests(guest_id),
    FOREIGN KEY (event_id) REFERENCES rsvp_master_events(event_id)
);

-- Guest stay table
CREATE TABLE rsvp_guest_accommodation (
    guest_accommodation_id INTEGER PRIMARY KEY,
    guest_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    venue_id INTEGER,
    room_id integer, 
    check_in_date DATE,
    check_out_date DATE,
    accommodation_type VARCHAR(50),
    accommodation_details TEXT,
    allocation_status VARCHAR(20) DEFAULT 'Reserved',
    allocation_notes TEXT,
    allocation_type text CHECK (allocation_type IN ('planned', 'actual')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES rsvp_master_guests(guest_id),
    FOREIGN KEY (event_id) REFERENCES rsvp_master_events(event_id),
    FOREIGN KEY (venue_id) REFERENCES rsvp_master_venues(venue_id),
    FOREIGN KEY (room_id) REFERENCES rsvp_master_rooms(room_id)
);

-- Guest communication table
CREATE TABLE rsvp_guest_communication (
    communication_id INTEGER PRIMARY KEY,
    guest_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    notification_template_id integer, 
    communication_type VARCHAR(50),
    communication_date TIMESTAMP,
    communication_content TEXT,
    communication_status VARCHAR(20),
    communication_response text,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES rsvp_master_guests(guest_id),
    FOREIGN KEY (event_id) REFERENCES rsvp_master_events(event_id)
);


-- Guest RSVP table
CREATE TABLE rsvp_guest_rsvp (
    rsvp_id INTEGER PRIMARY KEY,
    guest_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    communication_id integer not null, 
    rsvp_status VARCHAR(20) DEFAULT 'Pending',
    rsvp_date TIMESTAMP,
    notes TEXT,
    question_text TEXT,
    response_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES rsvp_master_guests(guest_id),
    FOREIGN KEY (event_id) REFERENCES rsvp_master_events(event_id),
    FOREIGN KEY (communication_id) REFERENCES rsvp_guest_communication(communication_id)
);


-- Guest vehicle allocation table
CREATE TABLE rsvp_guest_vehicle_allocation (
    vehicle_allocation_id INTEGER PRIMARY KEY,
    guest_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    vehicle_type VARCHAR(50),
    vehicle_allocation_type text CHECK (vehicle_allocation_type IN ('planned','actual')), 
    vehicle_details TEXT,
    pickup_location VARCHAR(100),
    pickup_datetime TIMESTAMP,
    dropoff_location VARCHAR(100),
    dropoff_datetime TIMESTAMP,
    allocation_status VARCHAR(20) DEFAULT 'Reserved',
    allocation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES rsvp_master_guests(guest_id),
    FOREIGN KEY (event_id) REFERENCES rsvp_master_events(event_id)
);

-- Vendor details table
CREATE TABLE rsvp_vendor_details (
    vendor_detail_id INTEGER PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    contact_person VARCHAR(100),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    contract_details TEXT,
    payment_terms TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES rsvp_master_vendors(vendor_id)
);

-- Vendor event allocation table
CREATE TABLE rsvp_vendor_event_allocation (
    event_vendor_allocation_id INTEGER PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    service_description TEXT,
    service_start_datetime TIMESTAMP,
    service_end_datetime TIMESTAMP,
    cost DECIMAL(12,2),
    allocation_status VARCHAR(20) DEFAULT 'Contracted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES rsvp_master_vendors(vendor_id),
    FOREIGN KEY (event_id) REFERENCES rsvp_master_events(event_id)
);

-- Venue details table
CREATE TABLE rsvp_venue_details (
    venue_detail_id INTEGER PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    facilities TEXT,
    amenities TEXT,
    rules_and_restrictions TEXT,
    directions TEXT,
    parking_information TEXT,
    venue_city text, 
    venue_pincode text,
    venue_location text, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES rsvp_master_venues(venue_id)
);

-- Venue event allocation table
CREATE TABLE rsvp_venue_event_allocation (
    venue_event_allocation_id INTEGER PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    booking_start_date DATE,
    booking_end_date DATE,
    booking_status VARCHAR(20) DEFAULT 'Reserved',
    booking_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES rsvp_master_venues(venue_id),
    FOREIGN KEY (event_id) REFERENCES rsvp_master_events(event_id)
);

-- Venue room allocation table
CREATE TABLE rsvp_event_room_allocation (
    event_room_allocation_id INTEGER PRIMARY KEY,
    event_id INTEGER NOT NULL,
    subevent_id INTEGER,
    room_id INTEGER NOT NULL,
    allocation_start_datetime TIMESTAMP,
    allocation_end_datetime TIMESTAMP,
    allocation_status VARCHAR(20) DEFAULT 'Reserved',
    allocation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rsvp_master_rooms(room_id),
    FOREIGN KEY (event_id) REFERENCES rsvp_master_events(event_id),
    FOREIGN KEY (subevent_id) REFERENCES rsvp_master_subevents(subevent_id)
);


-- Task details table
CREATE TABLE rsvp_task_assignment_details (
    task_detail_id INTEGER PRIMARY KEY,
    task_id INTEGER NOT NULL,
    assigned_to INTEGER,
    task_status VARCHAR(20) DEFAULT 'Not Started',
    task_planned_start_datetime DATEtime,
    task_actual_start_datetime DATEtime,
    task_planned_end_datetime DATEtime,
    task_actual_end_datetime DATEtime,
    task_completion_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES rsvp_master_tasks(task_id),
    FOREIGN KEY (assigned_to) REFERENCES rsvp_master_employees(employee_id)
);


-- Team details table
CREATE TABLE rsvp_team_details (
    team_detail_id INTEGER PRIMARY KEY,
    team_id INTEGER NOT NULL,
    employee_id integer, 
    team_size INTEGER,
    team_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES rsvp_master_teams(team_id),
    FOREIGN KEY (employee_id) REFERENCES rsvp_master_employees(employee_id)
);

-- Team event allocation table
CREATE TABLE rsvp_team_event_allocation (
    team_event_allocation_id INTEGER PRIMARY KEY,
    team_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    allocation_start_date DATE,
    allocation_end_date DATE,
    allocation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES rsvp_master_teams(team_id),
    FOREIGN KEY (event_id) REFERENCES rsvp_master_events(event_id)
);

-- Employee details table
CREATE TABLE rsvp_employee_details (
    employee_detail_id INTEGER PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    employee_address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    employee_skills TEXT,
    employee_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES rsvp_master_employees(employee_id)
);

-- Employee role allocation table
CREATE TABLE rsvp_employee_role_allocation (
    employee_role_allocation_id INTEGER PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    role_start_date DATE,
    role_end_date DATE,
    role_status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES rsvp_master_employees(employee_id),
    FOREIGN KEY (role_id) REFERENCES rsvp_master_roles(role_id)
);

-- Employee team allocation table
CREATE TABLE rsvp_employee_team_allocation (
    employee_team_allocation_id INTEGER PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    team_allocation_start_date DATE,
    team_allocation_end_date DATE,
    team_allocation_status VARCHAR(20) DEFAULT 'Active',
    team_allocation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES rsvp_master_employees(employee_id),
    FOREIGN KEY (team_id) REFERENCES rsvp_master_teams(team_id)
);

-- Notification templates table
CREATE TABLE rsvp_notification_templates (
    notification_template_id INTEGER PRIMARY KEY,
    notification_type_id INTEGER,
    template_name VARCHAR(100) NOT NULL,
    subject_template TEXT,
    content_template TEXT,
    template_variables text, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_type_id) REFERENCES rsvp_master_notification_types(notification_type_id)
);


-- Task event subevent mapping table
CREATE TABLE rsvp_task_event_subevent_mapping (
    task_event_subevent_id INTEGER PRIMARY KEY,
    task_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    subevent_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES rsvp_master_tasks(task_id),
    FOREIGN KEY (event_id) REFERENCES rsvp_master_events(event_id),
    FOREIGN KEY (subevent_id) REFERENCES rsvp_master_subevents(subevent_id)
);

-- Client meeting notes table
CREATE TABLE rsvp_client_meeting_notes (
    meeting_note_id INTEGER PRIMARY KEY,
    client_id INTEGER NOT NULL,
    meeting_order integer, 
    meeting_date DATE,
    meeting_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES rsvp_master_clients(client_id)
);
