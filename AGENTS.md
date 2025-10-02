# AGENTS.md

## Project Overview

This is a full-stack RSVP management application built with a React frontend and an Express.js backend. The application uses a SQLite database for data storage and features user authentication, role-based access control, and a comprehensive set of tools for managing events, guests, and clients.

**Key Technologies:**
- **Frontend**: React, React Router, Axios, Bootstrap, Material-UI
- **Backend**: Express.js, Node.js
- **Database**: SQLite
- **Authentication**: JWT, bcryptjs

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
