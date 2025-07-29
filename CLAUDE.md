# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Installation and Setup
```bash
npm run install:all    # Install all dependencies (root, backend, frontend)
```

### Running the Application
```bash
npm run start          # Start both backend (port 5000) and frontend (port 3000) concurrently
npm run start:backend  # Start only backend server
npm run start:frontend # Start only frontend development server
```

### Backend Development
```bash
cd backend
npm start              # Production mode
npm run dev            # Development mode with nodemon
npm test               # Run Jest tests
```

### Frontend Development
```bash
cd frontend
npm start              # Development server with hot reload
npm run build          # Production build
npm test               # Run React tests
```

### Python Environment (for certain modules)
```bash
source /Users/alokk/EmployDEX/Applications/venv/bin/activate
```

## Architecture Overview

### Full-Stack Structure
This is a full-stack RSVP management system built with Express.js backend and React frontend, using SQLite as the database. The architecture follows a modular approach with clear separation of concerns.

### Backend Architecture

#### Modular Backend System
The backend uses a **modular architecture** where each module is self-contained with its own routes, logic, and initialization:

- **Modules Location**: `/modules/[module_name]/backend/index.js`
- **Auto-registration**: Modules are automatically registered in `app.js` based on the `moduleNames` array
- **Module Structure**: Each module exports an Express router that gets mounted at `/api/[module_name]`

**Core Modules:**
- `authentication` - JWT-based auth with login/register
- `user_management` - User CRUD operations
- `role_management` - Role and permission management
- `permission_management` - Permission assignment and checking
- `logging` - Activity logging and monitoring
- `database` - Database utilities and health checks
- `payment` - Payment QR codes and transaction management

#### Database Layer
- **Database**: SQLite with automatic schema initialization
- **Location**: `db/RSVP4.db`
- **Utilities**: Promisified database methods in `modules/database/backend/index.js`
- **Schema**: 56+ tables for comprehensive RSVP management (customers, clients, events, guests, venues, etc.)

#### Authentication & Authorization
- **JWT Tokens**: Using `jsonwebtoken` with secret stored in middleware
- **Middleware**: `middleware/auth.js` for token verification
- **RBAC**: `middleware/rbac.js` for role-based access control
- **Token Structure**: Nested user data under `decoded.user` property

#### Route Structure
Routes are organized into logical groups:
- **Core Entities**: `/routes/customers.js`, `/routes/clients.js`, `/routes/events.js`, etc.
- **Master Data**: `/routes/master-data.js` for lookup tables
- **Employee Management**: `/routes/employee-management.js`
- **Comprehensive CRUD**: `/routes/comprehensive-crud.js` for remaining tables using generic factory pattern

### Frontend Architecture

#### React Structure
- **State Management**: React Context (AuthContext) for global authentication state
- **Routing**: React Router v6 with protected routes
- **UI Framework**: Bootstrap 5 + Material-UI components
- **HTTP Client**: Axios with interceptors for error handling and token management

#### Component Organization
```
src/components/
├── authentication/    # Login, register, password reset
├── common/           # Shared components (Navbar, Sidebar, Layout)
├── dashboard/        # Main dashboard
├── users/           # User management CRUD
├── roles/           # Role management CRUD
├── permissions/     # Permission management
├── payment/         # Payment QR codes and transactions
├── logging/         # Activity logs and analytics
└── feature/         # Feature toggle management
```

#### API Service Layer
- **Centralized API**: `services/api.js` with organized endpoints by domain
- **Error Handling**: Global interceptor for consistent error handling
- **Token Management**: Automatic token attachment and refresh handling

### Key Architectural Patterns

#### Authentication Flow
1. Login credentials sent to `/api/authentication/login`
2. Server validates and returns JWT with nested user data structure
3. Frontend stores token and decodes for user info, permissions, roles
4. All subsequent requests include `Authorization: Bearer <token>` header
5. Backend middleware validates token on protected routes

#### Permission System
- **Role-Based**: Users have roles, roles have permissions
- **Frontend Checks**: `hasPermission()` method in AuthContext
- **Backend Validation**: Middleware checks permissions before route execution
- **Flexible**: Supports both permission-based and role-based access control

#### Database Relationships
The RSVP system uses a hierarchical structure:
- **Customers** → **Clients** → **Events** → **Subevents**/**Guests**
- **Supporting entities**: Venues, Rooms, Employees, Teams, Vendors
- **Transactional data**: Allocations, Communications, RSVPs, Documents

#### Modular Feature System
- **Feature Toggles**: Runtime enable/disable of features via database flags
- **Payment Module**: Self-contained with QR code management and transactions
- **Extensible**: New modules can be added by creating `/modules/[name]/backend/index.js`

## Default Credentials

### Administrator
- Username: `admin`
- Email: `admin@employdex.com`  
- Password: `Admin@123`

### Full Access User
- Username: `fa`
- Email: `fa@employdex.com`
- Password: `User@123`

### Demo Users
All demo users have password `User@123`:
- john.doe@employdex.com
- jane.smith@employdex.com
- robert.johnson@employdex.com
- emily.williams@employdex.com
- michael.brown@employdex.com

## Development Guidelines

### Adding New CRUD Routes
1. Use the generic CRUD factory in `comprehensive-crud.js` for simple tables
2. Create dedicated route files for complex entities with business logic
3. Follow existing patterns for validation, authentication, and error handling
4. Register new routes in `app.js`

### Database Operations
- Use promisified methods from `modules/database/backend/index.js`
- All methods: `dbMethods.run()`, `dbMethods.get()`, `dbMethods.all()`
- Include proper error handling and transaction support where needed

### Frontend Component Development
- Use AuthContext for user state and permission checking
- Follow existing patterns for API calls and error handling
- Implement proper loading states and user feedback
- Use consistent styling with Bootstrap classes and glassmorphism theme

### Module Development
- Create self-contained modules in `/modules/[name]/backend/index.js`
- Export Express router that will be mounted at `/api/[name]`
- Add module name to `moduleNames` array in `app.js` for auto-registration
- Include proper authentication and permission middleware

## Technology Stack

- **Backend**: Express.js, SQLite, JWT, bcryptjs, multer, express-validator
- **Frontend**: React 18, React Router v6, Bootstrap 5, Material-UI, Axios
- **Development**: Nodemon, Jest, Concurrently
- **Deployment**: Node.js with static file serving for production builds