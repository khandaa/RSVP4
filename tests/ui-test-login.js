const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Configuration
const BASE_URL = 'http://localhost:3000/login';
const TIMEOUT = 10000;
const CREDENTIALS_FILE = path.join(__dirname, 'user-credentials.csv');
const RESULTS_FILE = path.join(__dirname, 'login-test-results.md');

// Results tracking
const results = [];

/**
 * Main test function to test login with multiple users from CSV
 */
async function runLoginTests() {
  console.log('Starting Login UI Tests for RSVP4 Application');
  
  // Check if credentials file exists
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    console.error(`Error: Credentials file not found at ${CREDENTIALS_FILE}`);
    createSampleCredentialsFile();
    console.log('Created sample credentials file. Please update it with real credentials and run the test again.');
    return;
  }
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless testing
    defaultViewport: { width: 1280, height: 800 },
    args: ['--window-size=1280,800']
  });
  
  try {
    const users = await readCredentialsFromCSV();
    
    if (users.length === 0) {
      console.error('No users found in credentials file. Please add users to the CSV file.');
      return;
    }
    
    console.log(`Found ${users.length} user(s) to test`);
    
    // Test each user
    for (const user of users) {
      try {
        // For each user, use a fresh page to avoid state issues
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await testUserLogin(browser, page, user);
        // Only try to close if page is still valid
        if (page && !page.isClosed()) {
          await page.close().catch(err => console.log(`Warning: Could not close page: ${err.message}`));
        }
      } catch (userError) {
        console.error(`Error testing user ${user.username}:`, userError);
        results.push({
          username: user.username,
          role: user.role,
          status: 'Error',
          message: `Test execution error: ${userError.message}`,
          timestamp: new Date().toISOString()
        });
      }
    }
    
  } catch (error) {
    console.error('Test execution error:', error);
    results.push({
      username: 'System',
      status: 'Error',
      message: `Test execution error: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Write results to file
    await writeResults();
    
    console.log('Tests completed.');
    console.log(`Results written to ${RESULTS_FILE}`);
    
    // Close the browser when done
    await browser.close();
  }
}

/**
 * Test login for a specific user
 */
async function testUserLogin(browser, page, user) {
  const { username, password, role } = user;
  console.log(`Testing login for user: ${username} (${role || 'No role specified'})`);
  
  let status = 'Failed';
  let message = '';
  
  try {
    // Setup console error logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        message += `Console error: ${msg.text()}; `;
      }
    });
    
    // Always navigate directly to login page instead of homepage
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Add a small delay to ensure the page is fully loaded
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Wait for login form
    const loginForm = await page.$('form input[name="username"], form input[type="password"]');
    
    if (!loginForm) {
      throw new Error('Login form not found on login page');
    }
    
    // Attempt login
    await page.type('input[name="username"]', username);
    await page.type('input[name="password"]', password);
    
    // Take screenshot before submitting
    const screenshotPath = path.join(__dirname, 'screenshots', `login-${username}-before.png`);
    await ensureDirectoryExists(path.dirname(screenshotPath));
    await page.screenshot({ path: screenshotPath });
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error message
    await page.waitForNavigation({ timeout: TIMEOUT }).catch(() => {
      // If navigation timeout, we might be still on login page (failed login)
    });
    
    // Take screenshot after login attempt
    const afterScreenshotPath = path.join(__dirname, 'screenshots', `login-${username}-after.png`);
    await page.screenshot({ path: afterScreenshotPath });
    
    // Check if login was successful by looking for dashboard elements or staying on login page
    const currentUrl = page.url();
    const isLoggedIn = await page.$('.dashboard-container, .main-content, .app-container') !== null;
    const hasErrorMessage = await page.$('.alert-danger, .error-message, [role="alert"]') !== null;
    
    if (isLoggedIn && !currentUrl.includes('/login')) {
      status = 'Success';
      message = `Login successful. Redirected to ${currentUrl}`;
      
      // Check for role-specific elements if role is specified
      if (role) {
        const roleSpecificElements = await checkRoleSpecificElements(page, role);
        if (!roleSpecificElements.success) {
          message += ` Warning: Some role-specific elements for ${role} were not found: ${roleSpecificElements.missing.join(', ')}`;
        }
      }
      
      // Log out using programmatic approach
      try {
        // Take screenshot before logout
        const beforeLogoutScreenshot = path.join(__dirname, 'screenshots', `logout-${username}-before.png`);
        await page.screenshot({ path: beforeLogoutScreenshot });
        
        // Execute logout function directly through localStorage
        await page.evaluate(() => {
          // Clear auth token from localStorage to simulate logout
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.clear();
          sessionStorage.clear();
    
          
          // Redirect to login page
          window.location.href = '/login';
        });
        
        // Wait for redirect to complete
        await page.waitForNavigation({ timeout: TIMEOUT }).catch(() => {
          // This is fine, might already be redirected
        });
        
        // Check if we're back at login page
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          message += ' Successfully logged out by clearing auth tokens.';
        } else {
          message += ` Logout may have failed. Current URL: ${currentUrl}`;
        }
      } catch (error) {
        message += ` Logout attempt failed: ${error.message}`;
      }
    } else {
      status = 'Failed';
      if (hasErrorMessage) {
        const errorText = await page.evaluate(() => {
          const errorElement = document.querySelector('.alert-danger, .error-message, [role="alert"]');
          return errorElement ? errorElement.innerText : 'Unknown error';
        });
        message = `Login failed. Error: ${errorText}`;
      } else {
        message = 'Login failed without visible error message';
      }
    }
    
  } catch (error) {
    status = 'Error';
    message = `Test error: ${error.message}`;
  } finally {
    // Record result
    results.push({
      username,
      role: role || 'Not specified',
      status,
      message,
      timestamp: new Date().toISOString()
    });
    
    // Close page
    await page.close();
  }
}

/**
 * Check for role-specific elements based on user role
 */
async function checkRoleSpecificElements(page, role) {
  const roleElementMap = {
    'admin': ['.admin-panel', '.user-management', '[data-role="admin"]'],
    'manager': ['.events-management', '.guest-management', '[data-role="manager"]'],
    'user': ['.dashboard-view', '.profile-section', '[data-role="user"]']
  };
  
  const elementsToCheck = roleElementMap[role.toLowerCase()] || [];
  const missing = [];
  
  for (const selector of elementsToCheck) {
    const element = await page.$(selector);
    if (!element) {
      missing.push(selector);
    }
  }
  
  return {
    success: missing.length === 0,
    missing
  };
}

/**
 * Read user credentials from CSV file
 */
async function readCredentialsFromCSV() {
  return new Promise((resolve, reject) => {
    const users = [];
    fs.createReadStream(CREDENTIALS_FILE)
      .pipe(csv())
      .on('data', (row) => {
        // Validate required fields
        if (row.username && row.password) {
          users.push({
            username: row.username,
            password: row.password,
            role: row.role || ''
          });
        }
      })
      .on('end', () => {
        resolve(users);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Write test results to markdown file
 */
async function writeResults() {
  let markdown = '# RSVP4 Login Test Results\n\n';
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
  
  markdown += `| Username | Role | Status | Message | Timestamp |\n`;
  markdown += `|----------|------|--------|---------|----------|\n`;
  
  results.forEach(result => {
    markdown += `| ${result.username} | ${result.role} | ${result.status} | ${result.message} | ${result.timestamp} |\n`;
  });
  
  // Write to file
  fs.writeFileSync(RESULTS_FILE, markdown);
}

/**
 * Create sample credentials CSV file if it doesn't exist
 */
function createSampleCredentialsFile() {
  const content = 'username,password,role\nadmin,Admin@123,admin\nmanager,Manager@123,manager\nuser,User@123,user';
  fs.writeFileSync(CREDENTIALS_FILE, content);
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
runLoginTests();
