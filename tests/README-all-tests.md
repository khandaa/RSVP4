# RSVP4 Combined UI Test Runner

This document explains how to use the combined UI test runner script for running all RSVP4 UI tests in sequence.

## Overview

The `ui_test_allTests.js` script automatically runs all available UI test scripts in sequence and generates a comprehensive report containing:

- Summary of all tests run
- Success/failure status for each test
- Duration statistics
- Combined output summary
- Links to individual test result files

## Prerequisites

- Node.js installed
- RSVP4 application setup complete
- All dependencies installed (`npm run install:all`)
- Backend and frontend running (`npm start`)

## Running the Combined Tests

You can run all UI tests in sequence using either:

### Method 1: Using npm script

```bash
npm run test:all
```

### Method 2: Direct execution

```bash
node tests/ui_test_allTests.js
```

## Test Files Included

The following test files are executed in sequence:

1. `ui-test.js` - Main UI test suite for core application features
2. `ui-test-login.js` - Login functionality tests using various user roles
3. `ui-test-signup.js` - Registration form validation tests

## Output

After running all tests, the script generates:

- Console output showing progress and results of each test
- A combined markdown report at `tests/combined-results/all-tests-summary.md`
- Individual test reports remain available in their respective output files

## Customizing Tests

To add or remove tests from the sequence, edit the `TEST_FILES` array in `ui_test_allTests.js`:

```javascript
const TEST_FILES = [
  'ui-test.js',
  'ui-test-login.js',
  'ui-test-signup.js'
  // Add more test files here
];
```

## Troubleshooting

- **Browser doesn't close**: The test runner automatically closes browser instances after each test file, but if a test fails unexpectedly, you may need to close browser instances manually.
- **Tests timing out**: Increase the timeout value in the script (currently 5 minutes per test file).
- **Screenshots missing**: Ensure the `screenshots` directory exists and is writable.

## Future Improvements

- Parallel test execution option
- HTML report generation
- Integration with CI/CD pipelines
