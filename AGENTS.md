# AGENTS.md

## Project Overview

This is a full-stack RSVP management application built with a React frontend and an Express.js backend. The application uses a SQLite database for data storage and features user authentication, role-based access control, and a comprehensive set of tools for managing events, guests, and clients.

**Key Technologies:**
- **Frontend**: React, React Router, Axios, Bootstrap, Material-UI
- **Backend**: Express.js, Node.js
- **Database**: SQLite
- **Authentication**: JWT, bcryptjs

## Database Schema

To understand the complete and up-to-date database schema, refer to the `data_update_scripts/migrations/rsvp4.sql` file. Before proposing any database changes, always consult this file to ensure your changes are consistent with the existing structure.

The database is a SQLite database located at `db/RSVP4.db`. The tables are organized by functionality as follows:

### Customer & Client
- **master_customers**: Core customer information.
- **rsvp_master_clients**: Client records, linked to customers.
- **rsvp_client_details**: Additional details for clients.
- **rsvp_client_meeting_notes**: Notes from client meetings.

### Events & Sub-events
- **rsvp_master_events**: Main event records.
- **rsvp_event_details**: Budget, location, and other event details.
- **rsvp_event_documents**: Documents related to an event.
- **rsvp_master_event_types**: Types of events (e.g., Wedding, Corporate).
- **rsvp_master_subevents**: Individual activities or parts of a main event.
- **rsvp_subevents_details**: Additional details for sub-events.

### Guest Management
- **rsvp_master_guests**: Core guest information.
- **rsvp_guest_details**: Address and other personal details.
- **rsvp_guest_documents**: Guest-specific documents (e.g., ID).
- **rsvp_master_guest_groups**: For grouping guests (e.g., 'Bride's Family').
- **rsvp_guest_group_details**: Links guests to guest groups.
- **rsvp_guest_event_allocation**: Links guests to specific events and sub-events.

### RSVP & Invitations
- **rsvp_guest_rsvp**: Tracks guest responses to invitations.
- **rsvp_guest_communication**: Logs communications sent to guests.
- **rsvp_master_invites**: Stores invite templates.
- **rsvp_invite_versions**: Different versions of an invite.
- **rsvp_invite_distributions**: Tracks which guest received which invite version.
- **rsvp_invite_analytics**: Analytics for sent invites (sent, read, responded).

### Venue, Rooms & Accommodation
- **rsvp_master_venues**: Information about venues.
- **rsvp_venue_details**: Additional details for venues.
- **rsvp_venue_event_allocation**: Links venues to events.
- **rsvp_master_rooms**: Rooms within a venue.
- **rsvp_event_room_allocation**: Allocates rooms to specific events or sub-events.
- **rsvp_guest_accommodation**: Manages guest stays and room assignments.

### Travel & Logistics
- **rsvp_guest_travel**: Guest travel arrangements (arrival, departure).
- **rsvp_guest_vehicle_allocation**: Assigns vehicles to guests.

### Vendor Management
- **rsvp_master_vendors**: Core vendor information.
- **rsvp_vendor_details**: Additional details for vendors.
- **rsvp_vendor_event_allocation**: Links vendors to events.

### User & Team Management
- **users_master**: Application users.
- **roles_master**: User roles (e.g., Admin, Customer).
- **user_roles_tx**: Links users to roles.
- **permissions_master**: System permissions.
- **role_permissions_tx**: Links roles to permissions.
- **rsvp_master_employees**: Employee records.
- **rsvp_employee_details**: Additional details for employees.
- **rsvp_master_departments**: Company departments.
- **rsvp_master_teams**: Teams within the organization.
- **rsvp_employee_team_allocation**: Links employees to teams.

### System & Miscellaneous
- **feature_toggles**: Enables or disables application features.
- **changelog**: Tracks database schema changes.
- **rsvp_master_tasks**: Master list of tasks.
- **rsvp_task_assignment_details**: Assigns tasks to employees.
- **rsvp_task_event_subevent_mapping**: Links tasks to events or sub-events.
- **rsvp_master_notifications**: Master list of notifications.
- **rsvp_master_notification_types**: Types of notifications (e.g., Email, SMS).
- **rsvp_notification_templates**: Templates for notifications.

## Setup Commands

- **Install all dependencies** (root, frontend, and backend):
  ```bash
  npm run install:all
  ```

- **Start development servers** (frontend and backend):
  ```bash
  npm start
  ```

- **Build for production**:
  ```bash
  cd frontend && npm run build
  ```

## Development Workflow

- The frontend development server runs on `http://localhost:3001` and proxies API requests to the backend at `http://localhost:5001`.
- The backend server runs on `http://localhost:5001` and uses `nodemon` for automatic restarts during development (`npm run dev` in the `backend` directory).
- The project is structured as a monorepo with separate `frontend` and `backend` directories, each with its own `package.json` file.

## Testing Instructions

- **Run all UI tests**:
  ```bash
  npm run test:all
  ```

- **Run individual UI tests** (e.g., login test):
  ```bash
  npm run test:login
  ```

- **Run backend tests**:
  ```bash
  cd backend && npm test
  ```

- **Run frontend tests**:
  ```bash
  cd frontend && npm test
  ```

## Code Style

- The project uses ESLint for code linting. Refer to the `.eslintrc` files in the `frontend` directory for specific rules.
- Code formatting should be consistent with the existing style in the codebase.
- Follow standard React and Node.js best practices for file organization and naming conventions.

## Build and Deployment

- The production build of the frontend is created in the `frontend/build` directory.
- The backend is deployed by running the `app.js` file with Node.js.
- Environment variables are used for configuration. Refer to the `.env` files for details.

## Pull Request Guidelines

- **Title format**: `[component] Brief description` (e.g., `[frontend] Fix guest creation form`)
- Before submitting a pull request, ensure that all tests pass and there are no linting errors.

## Application Modules

The application is divided into several modules, each responsible for a specific set of features. The modules are loaded in `backend/app.js` and include:

- **authentication**: Manages user login, registration, and session management.
- **user_management**: Handles user profiles, and permissions.
- **role_management**: Manages user roles and their associated permissions.
- **permission_management**: Defines the permissions available in the system.
- **logging**: Provides logging services for events and errors.
- **database**: Handles the database connection and schema.
- **payment**: Integrates with payment gateways.
- **dashboard**: Provides data for the main application dashboard.

## Backend API Routes

- **Authentication** (`/api/authentication`)
  - `POST /login`: User login
  - `POST /register`: User registration
  - `POST /forgot-password`: Forgot password
  - `POST /reset-password`: Reset password

- **Clients** (`/api/clients`)
  - `GET /`: Get all clients
  - `GET /:id`: Get client by ID
  - `POST /`: Create new client
  - `PUT /:id`: Update client
  - `DELETE /:id`: Delete client

- **Customers** (`/api/customers`)
  - `GET /`: Get all customers
  - `GET /:id`: Get customer by ID
  - `POST /`: Create new customer
  - `PUT /:id`: Update customer
  - `DELETE /:id`: Delete customer
  - `POST /bulk-import`: Bulk import customers

- **Employee Management** (`/api/employee-management`)
  - `GET /departments`: Get all departments
  - `POST /departments`: Create new department
  - `PUT /departments/:id`: Update department
  - `DELETE /departments/:id`: Delete department
  - `GET /teams`: Get all teams
  - `POST /teams`: Create new team
  - `GET /teams/:id`: Get team by ID
  - `PUT /teams/:id`: Update team
  - `DELETE /teams/:id`: Delete team
  - `GET /employees`: Get all employees
  - `POST /employees`: Create new employee
  - `GET /employees/:id`: Get employee by ID
  - `PUT /employees/:id`: Update employee
  - `DELETE /employees/:id`: Delete employee

- **Events** (`/api/events`)
  - `GET /`: Get all events
  - `GET /:id`: Get event by ID
  - `POST /`: Create new event
  - `PUT /:id`: Update event
  - `DELETE /:id`: Delete event

- **Guests** (`/api/guests`)
  - `GET /`: Get all guests
  - `GET /template`: Download CSV template
  - `GET /:id`: Get guest by ID
  - `POST /`: Create new guest
  - `PUT /:id`: Update guest
  - `DELETE /:id`: Delete guest
  - `POST /bulk`: Bulk import guests

- **Master Data** (`/api/master-data`)
  - `GET /event-types`: Get all event types
  - `POST /event-types`: Create new event type
  - `PUT /event-types/:id`: Update event type
  - `DELETE /event-types/:id`: Delete event type

- **Venues** (`/api/venues`)
  - `GET /`: Get all venues
  - `GET /:id`: Get venue by ID
  - `POST /`: Create new venue
  - `PUT /:id`: Update venue
  - `DELETE /:id`: Delete venue

## Frontend Screens

- **Authentication**: Login, Register, Forgot Password, Reset Password
- **Dashboards**: Main dashboard, Customer dashboard, Client dashboard
- **Customer Management**: List, Details, Create, Edit, Bulk Import
- **Client Management**: List, Details, Create, Edit, Bulk Import
- **User Management**: List, Details, Create, Edit, Bulk Upload
- **Role Management**: List, Details, Create, Edit, Bulk Upload
- **Event Management**: List, Details, Create, Edit, Calendar
- **Guest Management**: List, Details, Create, Import, Groups
- **Logistics**: Dashboard, Travel, Accommodation, Vehicles, Reports

## Permission Management

- **Backend**: Permissions are enforced on API routes using the `checkPermissions` middleware, which is part of the `authentication` module. This middleware checks if the authenticated user has the required permissions to access a specific endpoint.
- **Frontend**: The `useAuth` hook provides the `hasRole` and `hasPermission` functions, which are used to conditionally render UI components and control access to frontend routes. The `AuthContext` holds the user's roles and permissions, which are decoded from the JWT upon login.

## Sidebar Creation

- The main sidebar component is `Sidebar.js`, which dynamically constructs the navigation menu based on the user's role.
- Role-specific menu items are defined in separate files within the `frontend/src/components/sidebars/` directory (e.g., `AdminSidebar.js`, `CustomerSidebar.js`).
- The `Sidebar.js` component imports these configurations and merges them based on the user's roles, as determined by the `hasRole` function from `useAuth`.
- Individual menu items can also be conditionally rendered based on specific permissions using the `hasPermission` function.

## Additional Notes

- Default admin credentials are `admin` / `Admin@123`.
- All prompts given to the agent are logged in `prompts_<date>.md` files in the root directory.
