# EmployDEX Base Platform

A foundational system providing essential user management capabilities, including user registration, authentication, role-based access control, and an administrative dashboard.

## Project Structure

```
base_v1/
├── backend/             # Express.js API
│   ├── config/          # Configuration files
│   ├── controllers/     # API route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
│
├── modules/             # Modular functionality
│   └── payment/         # Payment integration module
│       ├── backend/     # Payment backend API
│       └── frontend/    # Payment frontend components
│
├── frontend/            # React frontend
│   ├── public/          # Static files
│   ├── src/             # Source files
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── utils/       # Utility functions
│   │   ├── App.js       # Main app component
│   │   └── index.js     # Entry point
│   └── package.json     # Frontend dependencies
│
├── database/            # SQLite database
│   └── migrations/      # Database migrations
│
├── base_v1.MD           # Project PRD
├── CHANGELOG.md         # Project changelog
├── package.json         # Project dependencies
└── README.md            # Project documentation
```

## Features
- **Customer Management Module**: Complete customer management with listing, creation, editing, detail views and bulk import/export functionality. Includes search and filter capabilities.

- **Client Management Module**: Comprehensive client management with customer association, detailed views, and bulk operations. Supports filtering, sorting, and exporting client data.

- **Event Management Module**: Event planning and coordination with client association, scheduling, and status tracking.

- **Role-Based Dashboards**:
  - **Admin Dashboard**: Complete system overview with user statistics, role management, and system activity monitoring.
  - **Customer Admin Dashboard**: Tailored dashboard for customer administrators showing clients, active events, teams, and employees specific to their customer account.
  - **Client Admin Dashboard**: Specialized dashboard for client administrators displaying events, sub-events, guests, RSVPs, travel arrangements, and accommodation bookings related to their client account.

- **Venue Management Module**: Complete venue management system with role-based access, allowing admin and customer_admin users to create, view, edit, and delete venues, including customer-specific venue listings and venue event associations.

- **Vendor Management Module**: Comprehensive vendor management system restricted to admin and customer_admin roles. Features include:
  - Complete CRUD operations for vendors with proper role-based access control
  - Integration with customer data for vendor association
  - Vendor event assignment and management
  - Detailed vendor information tracking including contacts and agreements
  - SQLite backend with transaction support for data integrity
  - RESTful API endpoints with validation and error handling
  - Vendor type classification and filtering

- **Payment Integration Module**: A comprehensive payment integration system with QR code management and transaction tracking. Admins can upload, activate, and manage payment QR codes through an intuitive UI. The module automatically creates required database tables on initialization.

- **Feature Toggle System**: Admin and Full Access roles can manage feature flags via a dedicated UI and API. Use toggles to enable/disable features for controlled rollout, including customer, client, event, and payment management modules.

- **Role-Based Access Control**: Fine-grained permission system ensuring users only access features they are authorized to use. Admin and full_access roles always have visibility to all modules regardless of feature toggle settings.

- **Activity Log**: Comprehensive audit trail with timestamps in a readable format and includes a new 'IP Address / Port' column, showing the source of each activity if available.

- **2025-07-10:** Fixed JSX syntax errors in `frontend/src/components/roles/RoleList.js` (missing/mismatched `<tr>` closing tag and action button structure) that caused rendering issues on the Roles List page.
- **2025-07-10:** Improved the Role Management table UI for clarity and modern appearance (better alignment, action buttons, permission badges, and custom styles).


- User registration and authentication with JWT
- Role-based access control (RBAC) system
- User dashboard with activity metrics
- Administrative interface with comprehensive controls
- User, role, and permission management
  - Individual user creation and editing
  - Role management directly from user edit page
  - Bulk user upload via CSV file
  - Bulk role upload via CSV file with permission assignment
  - CSV template download for easy onboarding
- Payment integration with QR code management
  - Upload and manage QR codes for payment collection
  - Activate/deactivate payment methods
  - Track payment transactions
  - Feature toggle for enabling/disabling payment features
- System activity logging and monitoring
- Permission-based UI components

## Technology Stack

- **Backend**: Express.js
- **Frontend**: React.js
- **Database**: SQLite
- **Authentication**: JWT

## Getting Started

### Local Development Proxy

The React frontend is configured to proxy API requests to the Express backend:

```
"proxy": "http://localhost:5000"
```

This allows you to use `/api/*` endpoints in your frontend code without specifying the backend port. If you encounter 404 errors for `/api` requests, ensure the proxy is set and restart the React dev server.


### Prerequisites

- Node.js (v14.x or later)
- npm (v6.x or later)

### Installation

1. Clone the repository
2. Install all dependencies using the provided script:
   ```
   npm run install:all
   ```
   This will install both frontend and backend dependencies.

### Running the Application

1. Start both backend and frontend concurrently:
   ```
   npm run start
   ```
   This will start the backend API on port 5000 and the frontend on port 3000.

### Automated UI Testing

The application includes comprehensive Puppeteer-based UI testing for all major modules:

1. **Individual Module Tests**
   - `ui-test-login.js` - Tests user authentication
   - `ui-test-signup.js` - Tests user registration
   - `ui-test-events.js` - Tests event listing, creation, details, editing, and calendar views
   - `ui-test-subevents.js` - Tests subevent listing, creation, details, allocation, and timeline
   - `ui-test-guests.js` - Tests guest listing, creation, import, and details
   - `ui-test-rsvp.js` - Tests RSVP dashboard, form submission, and bulk management
   - `ui-test-users.js` - Tests user listing, creation, details, editing, and bulk upload
   - `ui-test-roles.js` - Tests role listing, creation, details, editing, and feature toggles

2. **Data-Driven Testing**
   - Each test file supports CSV-driven input for all "create" functionality tests
   - Sample CSV files are automatically created if missing
   - Customize test data by editing the CSV files in the `tests` directory

3. **Running UI Tests**

   Run all tests sequentially:
   ```
   cd tests
   node ui_test_allTests.js
   ```

   Run an individual test module:
   ```
   cd tests
   node ui-test-events.js
   ```

4. **Test Reports**
   - Individual test reports are generated as markdown files in the `tests` directory
   - A consolidated test report is generated at `tests/combined-results/all-tests-summary.md`
   - Test screenshots are captured in the `tests/screenshots` directory

### Using the Virtual Environment (for Python modules)

The project uses a Python virtual environment for certain backend modules:

1. Activate the virtual environment:
   ```
   source /Users/alokk/EmployDEX/Applications/venv/bin/activate
   ```

2. Install any required Python dependencies within the activated environment.

### Default Access Credentials

#### Administrator User
Use the following credentials to log in as an administrator:

- Username: admin
- Email: admin@employdex.com
- Password: Admin@123

The admin user has full permissions to manage users, roles, and permissions in the system.

#### Full Access User
- Username: fa
- Email: fa@employdex.com
- Password: User@123

The FA user has been assigned the "full_access" role which grants all available permissions in the system. This user can be used for testing and validation purposes.

**Note:** The login has been updated to accept either email, username, or mobile number. You can log in with any of these credentials.

### Access Information

After starting the application:

- Backend API: http://localhost:5000
- Frontend application: http://localhost:3000

### Demo Users

The following demo users are available with the standard "User" role:

1. John Doe (john.doe@employdex.com)
2. Jane Smith (jane.smith@employdex.com)
3. Robert Johnson (robert.johnson@employdex.com)
4. Emily Williams (emily.williams@employdex.com)
5. Michael Brown (michael.brown@employdex.com)

All demo users share the password: User@123

## Database Structure

Refer to the PRD (`base_v1.MD`) for detailed database structure information.

## License

[MIT](https://choosealicense.com/licenses/mit/)
