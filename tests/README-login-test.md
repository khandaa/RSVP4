# RSVP4 Login UI Test

This test suite allows for automated login testing with multiple user credentials from a CSV file.

## Features

- Tests login functionality for multiple users defined in a CSV file
- Captures screenshots of login attempts (before and after)
- Generates detailed test reports in markdown format
- Verifies role-specific UI elements based on user role
- Handles login failures and provides detailed error information

## Prerequisites

Make sure you have all dependencies installed:

```bash
npm install
```

The following dependencies are required:
- puppeteer
- csv-parser

## Test Files

- `ui-test-login.js` - The main test script
- `user-credentials.csv` - CSV file containing user credentials

## CSV Format

The `user-credentials.csv` file should contain the following columns:

```
username,password,role
admin,Admin@123,admin
manager,Manager@123,manager
user,User@123,user
```

- `username`: Login username
- `password`: User password
- `role` (optional): User role for role-specific UI verification

## Running Tests

Before running the tests, make sure your application is running:

```bash
npm start
```

Then run the login tests in a separate terminal:

```bash
npm run test:login
```

Or run directly with Node:

```bash
node tests/ui-test-login.js
```

## Test Results

The test generates two types of outputs:

1. **Markdown Report**: A detailed report is saved to `tests/login-test-results.md`
2. **Screenshots**: Before and after login screenshots are saved to `tests/screenshots/`

## Default User Credentials

The default credentials file includes:

| Username | Password  | Role    |
|----------|-----------|---------|
| admin    | Admin@123 | admin   |
| manager  | Manager@123 | manager |
| user     | User@123  | user    |

## Customizing Tests

You can customize the tests by:

1. Modifying the `TIMEOUT` value for slow connections
2. Changing the `headless` setting to `true` for headless testing
3. Adding additional role-specific element checks in the `checkRoleSpecificElements` function
4. Modifying the report format in the `writeResults` function

## Troubleshooting

- If the test fails to find the credentials file, it will create a sample one
- Check the screenshots for visual verification of what happened during login attempts
- Look for console errors in the test output
- Verify that your application is running and accessible at http://localhost:3000
