const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const REGISTER_URL = `${BASE_URL}/register`;
const TIMEOUT = 10000;
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'signup');
const RESULTS_FILE = path.join(__dirname, 'signup-test-results.md');

// Test scenarios for registration
const testScenarios = [
  {
    name: 'Valid Registration',
    data: {
      firstName: `Test${Date.now()}`,
      lastName: `User${Date.now()}`,
      email: `testuser_${Date.now()}@example.com`,
      password: 'Admin@123',
      confirmPassword: 'Admin@123'
    },
    expectedResult: 'success'
  },
  {
    name: 'Missing First Name',
    data: {
      firstName: '',
      lastName: 'Lastname',
      email: 'missing_firstname@example.com',
      password: 'Admin@123',
      confirmPassword: 'Admin@123'
    },
    expectedResult: 'validation_error',
    expectedErrorField: 'firstName'
  },
  {
    name: 'Missing Last Name',
    data: {
      firstName: 'Firstname',
      lastName: '',
      email: 'missing_lastname@example.com',
      password: 'Admin@123',
      confirmPassword: 'Admin@123'
    },
    expectedResult: 'validation_error',
    expectedErrorField: 'lastName'
  },
  {
    name: 'Invalid Email Format',
    data: {
      firstName: 'Invalid',
      lastName: 'Email',
      email: 'invalid-email-format',
      password: 'Admin@123',
      confirmPassword: 'Admin@123'
    },
    expectedResult: 'validation_error',
    expectedErrorField: 'email'
  },
  {
    name: 'Password Too Short',
    data: {
      firstName: 'Short',
      lastName: 'Password',
      email: 'short_password@example.com',
      password: 'Pass1!',
      confirmPassword: 'Pass1!'
    },
    expectedResult: 'validation_error',
    expectedErrorField: 'password'
  },
  {
    name: 'Password Mismatch',
    data: {
      firstName: 'Password',
      lastName: 'Mismatch',
      email: 'password_mismatch@example.com',
      password: 'Admin@123',
      confirmPassword: 'DifferentAdmin@456'
    },
    expectedResult: 'validation_error',
    expectedErrorField: 'confirmPassword'
  },
  {
    name: 'Weak Password (No Special Char)',
    data: {
      firstName: 'Weak',
      lastName: 'Password',
      email: 'weak_password@example.com',
      password: 'Password123',
      confirmPassword: 'Password123'
    },
    expectedResult: 'validation_error',
    expectedErrorField: 'password'
  },
];

// Results tracking
const results = [];

/**
 * Main test function to validate the signup page
 */
async function runSignupTests() {
  console.log('Starting Signup UI Tests for RSVP4 Application');
  
  // Ensure screenshots directory exists
  await ensureDirectoryExists(SCREENSHOTS_DIR);
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless testing
    defaultViewport: { width: 1280, height: 800 },
    args: ['--window-size=1280,800']
  });
  
  try {
    // Test registration page accessibility
    await testRegistrationPageAccess(browser);
    
    // Test form field presence
    await testFormFieldsPresence(browser);
    
    // Run test scenarios
    for (const scenario of testScenarios) {
      await testRegistrationScenario(browser, scenario);
    }
    
  } catch (error) {
    console.error('Test execution error:', error);
    results.push({
      name: 'System Error',
      status: 'Error',
      message: `Test execution error: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Write results to file
    await writeResults();
    
    // Keep browser open for inspection
    console.log('Tests completed. Browser will remain open for inspection.');
    console.log(`Results written to ${RESULTS_FILE}`);
    
    // Uncomment to close browser automatically
    // await browser.close();
  }
}

/**
 * Test if the registration page is accessible
 */
async function testRegistrationPageAccess(browser) {
  console.log('Testing registration page accessibility...');
  const page = await browser.newPage();
  
  try {
    // Navigate to registration page
    await page.goto(REGISTER_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Take screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'registration-page.png') });
    
    // Check if registration form exists
    const formExists = await page.$('form') !== null;
    
    if (formExists) {
      results.push({
        name: 'Registration Page Access',
        status: 'Success',
        message: 'Registration page loaded successfully with form present',
        timestamp: new Date().toISOString()
      });
    } else {
      results.push({
        name: 'Registration Page Access',
        status: 'Failed',
        message: 'Registration page loaded but form is missing',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    results.push({
      name: 'Registration Page Access',
      status: 'Error',
      message: `Failed to access registration page: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  } finally {
    await page.close();
  }
}

/**
 * Test if all required form fields are present
 */
async function testFormFieldsPresence(browser) {
  console.log('Testing form fields presence...');
  const page = await browser.newPage();
  
  try {
    // Navigate to registration page
    await page.goto(REGISTER_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Fields to check
    const requiredFields = [
      { name: 'First Name field', selector: 'input[name="firstName"]' },
      { name: 'Last Name field', selector: 'input[name="lastName"]' },
      { name: 'Email field', selector: 'input[type="email"], input[name="email"]' },
      { name: 'Password field', selector: 'input[type="password"][name="password"]' },
      { name: 'Confirm Password field', selector: 'input[type="password"][name="confirmPassword"], input[type="password"][name="password_confirmation"]' },
      { name: 'Submit button', selector: 'button[type="submit"], input[type="submit"]' }
    ];
    
    // Check presence of all fields
    const missingFields = [];
    
    for (const field of requiredFields) {
      const fieldExists = await page.$(field.selector) !== null;
      if (!fieldExists) {
        missingFields.push(field.name);
      }
    }
    
    if (missingFields.length === 0) {
      results.push({
        name: 'Form Fields Presence',
        status: 'Success',
        message: 'All required form fields are present',
        timestamp: new Date().toISOString()
      });
    } else {
      results.push({
        name: 'Form Fields Presence',
        status: 'Failed',
        message: `Missing fields: ${missingFields.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    results.push({
      name: 'Form Fields Presence',
      status: 'Error',
      message: `Error checking form fields: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  } finally {
    await page.close();
  }
}

/**
 * Test a specific registration scenario
 */
async function testRegistrationScenario(browser, scenario) {
  console.log(`Testing scenario: ${scenario.name}...`);
  const page = await browser.newPage();
  
  try {
    // Navigate to registration page
    await page.goto(REGISTER_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Setup console error logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Console error in scenario "${scenario.name}": ${msg.text()}`);
      }
    });
    
    // Fill form
    if (scenario.data.firstName) {
      await page.type('input[name="firstName"]', scenario.data.firstName);
    }
    
    if (scenario.data.lastName) {
      await page.type('input[name="lastName"]', scenario.data.lastName);
    }
    
    if (scenario.data.email) {
      await page.type('input[type="email"], input[name="email"]', scenario.data.email);
    }
    
    if (scenario.data.password) {
      await page.type('input[type="password"][name="password"]', scenario.data.password);
    }
    
    if (scenario.data.confirmPassword) {
      await page.type('input[type="password"][name="confirmPassword"], input[type="password"][name="password_confirmation"]', scenario.data.confirmPassword);
    }
    
    // Take screenshot before submitting
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `before-${scenario.name.toLowerCase().replace(/\s+/g, '-')}.png`) });
    
    // Submit form
    await Promise.all([
      page.click('button[type="submit"], input[type="submit"]'),
      // Don't wait for navigation as it may or may not happen
      page.waitForNavigation({ timeout: TIMEOUT }).catch(() => {}),
    ]);
    
    // Take screenshot after submitting
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `after-${scenario.name.toLowerCase().replace(/\s+/g, '-')}.png`) });
    
    // Check results based on expected outcome
    if (scenario.expectedResult === 'success') {
      // Success should redirect to login or dashboard
      const currentUrl = page.url();
      const isRedirected = !currentUrl.includes('/register');
      const successMessage = await page.$('.alert-success, .success-message, [role="alert"]') !== null;
      
      if (isRedirected || successMessage) {
        results.push({
          name: scenario.name,
          status: 'Success',
          message: `Registration successful. ${isRedirected ? `Redirected to ${currentUrl}` : 'Success message displayed'}`,
          timestamp: new Date().toISOString()
        });
      } else {
        results.push({
          name: scenario.name,
          status: 'Failed',
          message: 'Expected successful registration but no redirection or success message observed',
          timestamp: new Date().toISOString()
        });
      }
    } else if (scenario.expectedResult === 'validation_error') {
      // Check if still on registration page with error
      const currentUrl = page.url();
      const stillOnRegistrationPage = currentUrl.includes('/register');
      const hasError = await page.$('.alert-danger, .error-message, .invalid-feedback, [role="alert"]') !== null;
      
      if (stillOnRegistrationPage && hasError) {
        // Try to get specific error message
        const errorMessage = await page.evaluate(() => {
          const errorElement = document.querySelector('.alert-danger, .error-message, .invalid-feedback, [role="alert"]');
          return errorElement ? errorElement.innerText : 'Unknown validation error';
        });
        
        results.push({
          name: scenario.name,
          status: 'Success',
          message: `Validation error detected as expected: ${errorMessage}`,
          timestamp: new Date().toISOString()
        });
      } else {
        results.push({
          name: scenario.name,
          status: 'Failed',
          message: `Expected validation error but none detected${!stillOnRegistrationPage ? ' (redirected away from registration page)' : ''}`,
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    results.push({
      name: scenario.name,
      status: 'Error',
      message: `Test error: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  } finally {
    await page.close();
  }
}

/**
 * Write test results to markdown file
 */
async function writeResults() {
  let markdown = '# RSVP4 Registration/Signup Test Results\n\n';
  markdown += `*Test executed on: ${new Date().toISOString()}*\n\n`;
  
  // Summary
  const total = results.length;
  const successful = results.filter(r => r.status === 'Success').length;
  const failed = results.filter(r => r.status === 'Failed').length;
  const errors = results.filter(r => r.status === 'Error').length;
  
  markdown += `## Summary\n\n`;
  markdown += `- Total Tests: ${total}\n`;
  markdown += `- Successful: ${successful}\n`;
  markdown += `- Failed: ${failed}\n`;
  markdown += `- Errors: ${errors}\n\n`;
  
  // Detailed results
  markdown += `## Detailed Results\n\n`;
  
  markdown += `| Test | Status | Message | Timestamp |\n`;
  markdown += `|------|--------|---------|----------|\n`;
  
  results.forEach(result => {
    markdown += `| ${result.name} | ${result.status} | ${result.message} | ${result.timestamp} |\n`;
  });
  
  markdown += '\n## Test Scenarios\n\n';
  markdown += 'The following test scenarios were executed:\n\n';
  
  testScenarios.forEach(scenario => {
    markdown += `### ${scenario.name}\n`;
    markdown += `- First Name: ${scenario.data.firstName || '(empty)'}\n`;
    markdown += `- Last Name: ${scenario.data.lastName || '(empty)'}\n`;
    markdown += `- Email: ${scenario.data.email || '(empty)'}\n`;
    markdown += `- Password: ${scenario.data.password ? '****' : '(empty)'}\n`;
    markdown += `- Confirm Password: ${scenario.data.confirmPassword ? '****' : '(empty)'}\n`;
    markdown += `- Expected Result: ${scenario.expectedResult}\n\n`;
  });
  
  // Write to file
  fs.writeFileSync(RESULTS_FILE, markdown);
}

/**
 * Ensure directory exists
 */
async function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

// Run the tests
runSignupTests();
