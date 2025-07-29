# RSVP4 Database Entity Relationship Diagram

## Master Tables

### Clients and Events
```
rsvp_master_clients
  ↓ client_id
  ├── rsvp_master_events (client_id → client_id)
  │     ↓ event_id
  │     ├── rsvp_master_subevents (event_id → event_id)
  │     │     ↓ subevent_id
  │     │     └── rsvp_subevents_details (subevent_id → subevent_id)
  │     ├── rsvp_event_details (event_id → event_id)
  │     └── rsvp_event_documents (event_id → event_id)
  └── rsvp_client_details (client_id → client_id)
```

### Guests and Groups
```
rsvp_master_guests
  ↓ guest_id
  ├── rsvp_guest_details (guest_id → guest_id)
  ├── rsvp_guest_documents (guest_id → guest_id)
  ├── rsvp_guest_event_allocation (guest_id → guest_id)
  ├── rsvp_guest_subevent_allocation (guest_id → guest_id)
  ├── rsvp_guest_travel (guest_id → guest_id)
  ├── rsvp_guest_stay (guest_id → guest_id)
  ├── rsvp_guest_communication (guest_id → guest_id)
  ├── rsvp_guest_room_allocation (guest_id → guest_id)
  ├── rsvp_guest_rsvp (guest_id → guest_id)
  │     ↓ rsvp_id
  │     └── rsvp_guest_rsvp_response (rsvp_id → rsvp_id)
  ├── rsvp_guest_notification (guest_id → guest_id)
  └── rsvp_guest_vehicle_allocation (guest_id → guest_id)

rsvp_master_guest_groups
  ↓ guest_group_id
  └── rsvp_guest_group_details (guest_group_id → guest_group_id)
       [also links to rsvp_master_guests via guest_id]
```

### Venues and Rooms
```
rsvp_master_venues
  ↓ venue_id
  ├── rsvp_master_rooms (venue_id → venue_id)
  │     ↓ room_id
  │     ├── rsvp_room_details (room_id → room_id)
  │     └── rsvp_guest_room_allocation (room_id → room_id)
  ├── rsvp_venue_details (venue_id → venue_id)
  ├── rsvp_venue_event_allocation (venue_id → venue_id)
  └── rsvp_venue_room_allocation (venue_id → venue_id)
```

### Vendors
```
rsvp_master_vendors
  ↓ vendor_id
  ├── rsvp_vendor_details (vendor_id → vendor_id)
  └── rsvp_vendor_event_allocation (vendor_id → vendor_id)
```

### Tasks and Teams
```
rsvp_master_tasks
  ↓ task_id
  ├── rsvp_task_details (task_id → task_id)
  └── rsvp_task_event_allocation (task_id → task_id)

rsvp_master_teams
  ↓ team_id
  ├── rsvp_team_details (team_id → team_id)
  └── rsvp_team_event_allocation (team_id → team_id)
```

### Employees and Departments
```
rsvp_master_departments
  ↓ department_id
  └── rsvp_master_employees (department_id → department_id)
       ↓ employee_id
       ├── rsvp_employee_details (employee_id → employee_id)
       ├── rsvp_employee_role_allocation (employee_id → employee_id)
       └── rsvp_employee_team_allocation (employee_id → employee_id)

rsvp_master_roles
  ↓ role_id
  └── rsvp_employee_role_allocation (role_id → role_id)
```

### Notifications
```
rsvp_master_notification_types
  ↓ notification_type_id
  ├── rsvp_master_notifications (notification_type_id → notification_type_id)
  ├── rsvp_guest_notification (notification_type_id → notification_type_id)
  └── rsvp_notification_templates (notification_type_id → notification_type_id)
```

## Cross-Relationships

### Events and Resources
```
rsvp_master_events (event_id) → 
  ├── rsvp_guest_event_allocation
  ├── rsvp_guest_travel
  ├── rsvp_guest_stay
  ├── rsvp_guest_communication
  ├── rsvp_guest_room_allocation
  ├── rsvp_guest_rsvp
  ├── rsvp_guest_notification
  ├── rsvp_guest_vehicle_allocation
  ├── rsvp_vendor_event_allocation
  ├── rsvp_venue_event_allocation
  ├── rsvp_venue_room_allocation
  ├── rsvp_task_event_allocation
  └── rsvp_team_event_allocation
```

### Subevents and Resources
```
rsvp_master_subevents (subevent_id) → 
  ├── rsvp_guest_subevent_allocation
  └── rsvp_venue_room_allocation
```

## Table Relationships by Primary Key

| Table | Primary Key | References |
|-------|------------|------------|
| rsvp_master_clients | client_id | - |
| rsvp_master_events | event_id | client_id → rsvp_master_clients |
| rsvp_master_subevents | subevent_id | event_id → rsvp_master_events |
| rsvp_master_guests | guest_id | - |
| rsvp_master_guest_groups | guest_group_id | - |
| rsvp_master_vendors | vendor_id | - |
| rsvp_master_venues | venue_id | - |
| rsvp_master_rooms | room_id | venue_id → rsvp_master_venues |
| rsvp_master_event_types | event_type_id | - |
| rsvp_master_tasks | task_id | - |
| rsvp_master_teams | team_id | - |
| rsvp_master_departments | department_id | - |
| rsvp_master_roles | role_id | - |
| rsvp_master_employees | employee_id | department_id → rsvp_master_departments |
| rsvp_master_notification_types | notification_type_id | - |
| rsvp_master_notifications | notification_id | notification_type_id → rsvp_master_notification_types |
| rsvp_client_details | client_detail_id | client_id → rsvp_master_clients |
| rsvp_event_details | event_detail_id | event_id → rsvp_master_events, event_type_id → rsvp_master_event_types |
| rsvp_event_documents | document_id | event_id → rsvp_master_events |
| rsvp_subevents_details | subevent_detail_id | subevent_id → rsvp_master_subevents, venue_id → rsvp_master_venues, room_id → rsvp_master_rooms |
| rsvp_guest_details | guest_detail_id | guest_id → rsvp_master_guests |
| rsvp_guest_documents | document_id | guest_id → rsvp_master_guests |
| rsvp_guest_event_allocation | allocation_id | guest_id → rsvp_master_guests, event_id → rsvp_master_events |
| rsvp_guest_subevent_allocation | allocation_id | guest_id → rsvp_master_guests, subevent_id → rsvp_master_subevents |
| rsvp_guest_group_details | group_detail_id | guest_group_id → rsvp_master_guest_groups, guest_id → rsvp_master_guests |
| rsvp_guest_travel | travel_id | guest_id → rsvp_master_guests, event_id → rsvp_master_events |
| rsvp_guest_stay | stay_id | guest_id → rsvp_master_guests, event_id → rsvp_master_events, venue_id → rsvp_master_venues |
| rsvp_guest_communication | communication_id | guest_id → rsvp_master_guests, event_id → rsvp_master_events |
| rsvp_guest_room_allocation | allocation_id | guest_id → rsvp_master_guests, room_id → rsvp_master_rooms, venue_id → rsvp_master_venues, event_id → rsvp_master_events |
| rsvp_guest_rsvp | rsvp_id | guest_id → rsvp_master_guests, event_id → rsvp_master_events |
| rsvp_guest_rsvp_response | response_id | rsvp_id → rsvp_guest_rsvp |
| rsvp_guest_notification | notification_id | guest_id → rsvp_master_guests, notification_type_id → rsvp_master_notification_types, event_id → rsvp_master_events |
| rsvp_guest_vehicle_allocation | allocation_id | guest_id → rsvp_master_guests, event_id → rsvp_master_events |
| rsvp_vendor_details | vendor_detail_id | vendor_id → rsvp_master_vendors |
| rsvp_vendor_event_allocation | allocation_id | vendor_id → rsvp_master_vendors, event_id → rsvp_master_events |
| rsvp_venue_details | venue_detail_id | venue_id → rsvp_master_venues |
| rsvp_venue_event_allocation | allocation_id | venue_id → rsvp_master_venues, event_id → rsvp_master_events |
| rsvp_venue_room_allocation | allocation_id | venue_id → rsvp_master_venues, room_id → rsvp_master_rooms, event_id → rsvp_master_events, subevent_id → rsvp_master_subevents |
| rsvp_room_details | room_detail_id | room_id → rsvp_master_rooms |
| rsvp_task_details | task_detail_id | task_id → rsvp_master_tasks, assigned_to_employee_id → rsvp_master_employees |
| rsvp_task_event_allocation | allocation_id | task_id → rsvp_master_tasks, event_id → rsvp_master_events |
| rsvp_team_details | team_detail_id | team_id → rsvp_master_teams, team_leader_employee_id → rsvp_master_employees |
| rsvp_team_event_allocation | allocation_id | team_id → rsvp_master_teams, event_id → rsvp_master_events |
| rsvp_employee_details | employee_detail_id | employee_id → rsvp_master_employees |
| rsvp_employee_role_allocation | allocation_id | employee_id → rsvp_master_employees, role_id → rsvp_master_roles |
| rsvp_employee_team_allocation | allocation_id | employee_id → rsvp_master_employees, team_id → rsvp_master_teams |
| rsvp_notification_templates | template_id | notification_type_id → rsvp_master_notification_types |
