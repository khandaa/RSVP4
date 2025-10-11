**Note (2025-10-11):** The `AGENTS.md` file has been updated with critical "Development Best Practices and Error Prevention" guidelines. All contributors must review this new section to understand standardized procedures for authentication, API development, environment setup, and data handling.

### Authentication Session Persistence

On successful login, the frontend now immediately stores the authenticated user's profile, roles, and permissions in `localStorage` and in the in-memory auth context.

- Source: `frontend/src/contexts/AuthContext.js`
- Stored keys: `token`, `currentUser`, `roles`, `permissions`
- Behavior: Values are rehydrated on app load so components like `frontend/src/components/common/Sidebar.js` can render role/permission-based menus reliably throughout the session.

The backend authentication module now logs helpful debug information upon successful login, including the user's email, roles, and permissions. These logs appear in the server console.

- Source: `modules/authentication/backend/index.js`
- Debug lines: `[Auth] Successful login user: <email>`, `[Auth] Roles: [...]`, `[Auth] Permissions: [...]`

# EmployDEX Base Platform

Note (2025-10-06): Enhanced the Event Detail page to correctly display and update guest RSVP statuses.

Note (2025-10-06): Fixed an issue where error messages were not displayed during bulk guest imports. The backend now sends correctly formatted error messages that the frontend can display.

Note (2025-10-01): Event Type dropdown duplicates fixed. See `frontend/src/components/events/EventCreate.js` where event types are de-duplicated by name (case-insensitive) and sorted before rendering.

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

- **Venue Management Module**: Complete venue management system with role-based access, allowing admin and Customer Admin users to create, view, edit, and delete venues, including customer-specific venue listings and venue event associations.

- **Vendor Management Module**: Comprehensive vendor management system restricted to admin and Customer Admin roles. Features include:
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

- **2025-09-18:** Fixed a silent failure when creating guests from the table view in `GuestCreate.js` by refactoring to use the authenticated `api` service, ensuring proper error handling and redirection only upon complete success.
- **2025-09-18:** Fixed a 404 error on the guest detail page by refactoring `GuestDetail.js` to use the `api` service, correcting API endpoints, and updating response handling for `axios`.
- **2025-09-18:** Fixed a 500 Internal Server Error when creating a sub-event by correcting the API endpoint in `api.js` and fixing data handling in `SubeventCreate.js`.
- **2025-09-18:** Fixed various 404 and 401 errors in the Customer Dashboard by refactoring API calls to use the authenticated `api` instance and correcting endpoints.


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
"proxy": "http://localhost:5001"
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
   This will start the backend API on port 5001 and the frontend on port 3001.

### Production Build

### Testing the Deployment

After deploying, you can run the `test_deployment.sh` script to verify that both the frontend and backend services are running correctly.

```bash
sudo bash backend/scripts/test_deployment.sh
```

This script checks:
- The frontend is accessible and returns a 200 status.
- The backend health check endpoints for both applications are responsive.

### Server Deployment with Nginx

The project includes scripts to configure a production environment with Nginx and Let's Encrypt SSL certificates.

1.  **Generate SSL Certificates**: The `backend/scripts/create_certs.sh` script automates the process of obtaining SSL certificates using Certbot.
    ```bash
    sudo bash backend/scripts/create_certs.sh
    ```
2.  **Configure Nginx**: The `backend/scripts/nginx.conf` file is a template for serving the frontend and proxying the backend. Copy and enable it on your server:
    ```bash
    # Copy the configuration
    sudo cp backend/scripts/nginx.conf /etc/nginx/sites-available/rsvp.hiringtests.in.conf

    # Enable the site
    sudo ln -s /etc/nginx/sites-available/rsvp.hiringtests.in.conf /etc/nginx/sites-enabled/

    # Test and reload Nginx
    sudo nginx -t && sudo systemctl reload nginx
    ```

### Multi-App Deployment with PM2

The `ecosystem.config.js` file is configured to manage multiple applications (`rsvp-app` and `wm-app`). You can start, monitor, and deploy each application independently.

-   **Start all applications**:
    ```bash
    pm2 start ecosystem.config.js
    ```
-   **Start a specific application**:
    ```bash
    pm2 start rsvp-app
    # or
    pm2 start wm-app
    ```
-   **Deploy the RSVP application**:
    ```bash
    pm2 deploy ecosystem.config.js production
    ```
-   **Deploy the WM application**:
    ```bash
    pm2 deploy ecosystem.config.js wm_production
    ```

To create a production-ready build of the frontend application, run the following command in the `frontend` directory:

```bash
cd frontend
npm run build
```

This will create an optimized build in the `frontend/build` directory. As part of the production build process, a bundle analysis report named `report.html` will be generated in the `frontend/build` directory. This report, created by `webpack-bundle-analyzer`, allows you to visualize the contents of your application bundles and identify large dependencies that could be optimized.

### Dependency Management

The project's dependencies are split into two categories:

-   `dependencies`: These are required for the application to run in a production environment.
-   `devDependencies`: These are only needed for local development and testing (e.g., `nodemon`, `jest`, `webpack-bundle-analyzer`).

This separation ensures that production builds are as lightweight as possible.

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

- Backend API: http://localhost:5001
- Frontend application: http://localhost:3001

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

## Stock Screener

A Python script is available to screen for stocks that have experienced recent volume spikes along with a price increase. This can be useful for identifying stocks with potential momentum.

### Features

- Fetches stock data from Yahoo Finance.
- Screens S&P 500 tickers by default, or a custom list of tickers.
- Identifies stocks where the recent volume is a specified multiplier of the average volume.
- Checks for a positive price increase over the last week.
- Saves the results to a timestamped CSV file.

### How to Use

1.  **Install Dependencies:**

    ```bash
    pip install yfinance pandas
    ```

2.  **Run the Screener:**

    Navigate to the `stock_screener` directory and run the script:

    ```bash
    python volume_spike_screener.py
    ```

    You can also customize the screening parameters:

    ```bash
    python volume_spike_screener.py --days 7 --multiplier 2.5 --min-price 10.0
    ```

## License

[MIT](https://choosealicense.com/licenses/mit/)
