# RSVP4 Signup/Registration UI Test

This test suite validates the signup/registration functionality with multiple test scenarios.

## Features

- Tests the accessibility of the registration page
- Validates the presence of all required form fields (firstName, lastName, email, password, etc.)
- Runs through multiple registration scenarios to test form validation
- Captures screenshots before and after registration attempts
- Tests various error cases (missing fields, invalid email, password mismatch, etc.)
- Generates detailed test reports in markdown format

## Prerequisites

Make sure you have all dependencies installed:

```bash
npm install
```

The following dependencies are required:
- puppeteer

## Test Files

- `ui-test-signup.js` - The main test script

## Test Scenarios

The script includes several predefined test scenarios:

1. **Valid Registration** - Tests a complete valid registration flow
2. **Missing First Name** - Tests validation when first name is missing
3. **Missing Last Name** - Tests validation when last name is missing
4. **Invalid Email Format** - Tests email format validation
5. **Password Too Short** - Tests minimum password length validation
6. **Password Mismatch** - Tests password confirmation validation
7. **Weak Password** - Tests password strength requirements

You can modify these scenarios or add new ones by editing the `testScenarios` array in the script.

## Running Tests

Before running the tests, make sure your application is running:

```bash
npm start
```

Then run the signup tests in a separate terminal:

```bash
npm run test:signup
```

Or run directly with Node:

```bash
node tests/ui-test-signup.js
```

## Test Results

The test generates two types of outputs:

1. **Markdown Report**: A detailed report is saved to `tests/signup-test-results.md`
2. **Screenshots**: Before and after screenshots are saved to `tests/screenshots/signup/`

## Customizing Tests

You can customize the tests by:

1. Modifying the `TIMEOUT` value for slow connections
2. Changing the `headless` setting to `true` for headless testing
3. Adding or modifying test scenarios in the `testScenarios` array
4. Adjusting the field selectors if your form structure changes

## Troubleshooting

- Check the screenshots for visual verification of what happened during registration attempts
- Look for console errors in the test output
- Verify that your application is running and accessible at http://localhost:3000/register
- Check that the registration form contains all expected fields with proper name attributes (firstName, lastName, email, password, confirmPassword)
- If using a custom registration URL, update the `REGISTER_URL` constant in the script
