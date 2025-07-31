const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000;
const USERS_FILE = path.join(__dirname, 'users-data.csv');
const RESULTS_FILE = path.join(__dirname, 'users-test-results.md');

// Results tracking
const results = [];

/**
 * Main test function to test users functionality
 */
async function runUsersTests() {
  console.log('Starting Users UI Tests for RSVP4 Application');
  
  // Create sample users data file if it doesn't exist
  if (!fs.existsSync(USERS_FILE)) {
    console.log('Users data file not found. Creating sample file...');
    createSampleUsersFile();
    console.log(`Created sample users file at ${USERS_FILE}. Please update with real data before running tests again.`);
  }
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--window-size=1280,800']
  });
  
  try {
    // Login first
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    await loginAsAdmin(page);
    
    // Run all user tests
    await testUsersList(page);
    await testUserCreation(page, browser);
    await testUserDetails(page);
    await testUserEdit(page);
    await testUserBulkUpload(page);
    
  } catch (error) {
    console.error('Test execution error:', error);
    results.push({
      feature: 'Users',
      test: 'General',
      status: 'Error',
      message: `Test execution error: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Write results to file
    await writeResults();
    
    console.log('Users tests completed.');
    console.log(`Results written to ${RESULTS_FILE}`);
    
    // Close the browser when done
    await browser.close();
  }
}

/**
 * Login as admin user
 */
async function loginAsAdmin(page) {
  console.log('Logging in as admin...');
  
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Check if login form exists
    const loginForm = await page.$('form input[name="username"], form input[type="password"]');
    if (!loginForm) {
      throw new Error('Login form not found');
    }
    
    // Fill in login credentials
    await page.type('input[name="username"]', 'admin');
    await page.type('input[name="password"]', 'Admin@123');
    
    // Take screenshot before submitting
    const screenshotPath = path.join(__dirname, 'screenshots', 'users-login-before.png');
    await ensureDirectoryExists(path.dirname(screenshotPath));
    await page.screenshot({ path: screenshotPath });
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation({ timeout: TIMEOUT });
    
    // Verify login was successful
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('Login failed, still on login page');
    }
    
    console.log('Login successful');
    
    // Take screenshot after login
    const afterScreenshotPath = path.join(__dirname, 'screenshots', 'users-login-after.png');
    await page.screenshot({ path: afterScreenshotPath });
    
    results.push({
      feature: 'Users',
      test: 'Login',
      status: 'Success',
      message: 'Successfully logged in as admin',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    results.push({
      feature: 'Users',
      test: 'Login',
      status: 'Failed',
      message: `Login failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Test users list page
 */
async function testUsersList(page) {
  console.log('Testing Users List...');
  
  try {
    // Navigate to users list page
    await page.goto(`${BASE_URL}/users`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, 'screenshots', 'users-list.png');
    await page.screenshot({ path: screenshotPath });
    
    // Check if users list is displayed
    const usersTable = await page.$('.users-table, table, [data-testid="users-list"]');
    const noUsersMessage = await page.$('.no-users-message, .empty-state');
    
    if (!usersTable && !noUsersMessage) {
      throw new Error('Users list not displayed correctly');
    }
    
    // Check for create button
    const createButton = await page.$('a[href="/users/create"], button:has-text("Create User")');
    if (!createButton) {
      console.log('Warning: Create User button not found');
    }
    
    results.push({
      feature: 'Users',
      test: 'List View',
      status: 'Success',
      message: 'Users list page loaded successfully',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Users List test failed:', error);
    results.push({
      feature: 'Users',
      test: 'List View',
      status: 'Failed',
      message: `Users list test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test user creation with data from CSV
 */
async function testUserCreation(page, browser) {
  console.log('Testing User Creation...');
  
  try {
    const users = await readUsersFromCSV();
    
    if (users.length === 0) {
      console.log('No users found in CSV file. Skipping creation test.');
      results.push({
        feature: 'Users',
        test: 'Creation',
        status: 'Skipped',
        message: 'No users data found in CSV file',
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    // Use first user from CSV
    const testUser = users[0];
    
    // Navigate to user create page
    await page.goto(`${BASE_URL}/users/create`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot before filling form
    const beforeScreenshot = path.join(__dirname, 'screenshots', 'user-create-before.png');
    await page.screenshot({ path: beforeScreenshot });
    
    // Fill in user details
    await page.type('input[name="username"]', testUser.username);
    await page.type('input[name="password"]', testUser.password);
    
    if (await page.$('input[name="email"]')) {
      await page.type('input[name="email"]', testUser.email);
    }
    
    if (await page.$('input[name="firstName"], input[name="first_name"]')) {
      await page.type('input[name="firstName"], input[name="first_name"]', testUser.firstName);
      await page.type('input[name="lastName"], input[name="last_name"]', testUser.lastName);
    }
    
    // Select role if dropdown exists
    const roleDropdown = await page.$('select[name="role"], select[name="roleId"]');
    if (roleDropdown) {
      // Get the first option value
      const firstOptionValue = await page.evaluate(() => {
        const select = document.querySelector('select[name="role"], select[name="roleId"]');
        return select && select.options.length > 0 ? select.options[1].value : null;
      });
      
      if (firstOptionValue) {
        await page.select('select[name="role"], select[name="roleId"]', firstOptionValue);
      }
    }
    
    // Take screenshot after filling form
    const afterScreenshot = path.join(__dirname, 'screenshots', 'user-create-after.png');
    await page.screenshot({ path: afterScreenshot });
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation or success message
    try {
      await Promise.race([
        page.waitForNavigation({ timeout: TIMEOUT }),
        page.waitForSelector('.success-message, .alert-success, [role="alert"]', { timeout: TIMEOUT })
      ]);
    } catch (e) {
      console.log('No navigation or success message detected, continuing test...');
    }
    
    // Check if we're redirected to users list or have a success message
    const currentUrl = page.url();
    const hasSuccessMessage = await page.$('.success-message, .alert-success, [role="alert"]') !== null;
    
    if (currentUrl.includes('/users') || hasSuccessMessage) {
      results.push({
        feature: 'Users',
        test: 'Creation',
        status: 'Success',
        message: `Successfully created user: ${testUser.username}`,
        timestamp: new Date().toISOString()
      });
      return true;
    } else {
      // Check for error messages
      const errorMessage = await page.evaluate(() => {
        const errorEl = document.querySelector('.error-message, .alert-danger, [role="alert"]');
        return errorEl ? errorEl.innerText : null;
      });
      
      throw new Error(`User creation failed. ${errorMessage || 'No error message displayed.'}`);
    }
  } catch (error) {
    console.error('User Creation test failed:', error);
    results.push({
      feature: 'Users',
      test: 'Creation',
      status: 'Failed',
      message: `User creation failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test user details page
 */
async function testUserDetails(page) {
  console.log('Testing User Details...');
  
  try {
    // Navigate to users list first
    await page.goto(`${BASE_URL}/users`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Check if there are any users
    const userLinks = await page.$$('a[href*="/users/"], tr td a');
    
    if (userLinks.length === 0) {
      console.log('No users found to test details view.');
      results.push({
        feature: 'Users',
        test: 'Details View',
        status: 'Skipped',
        message: 'No users found to test details',
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    // Click on the first user that's not the current user (to avoid any special handling)
    await userLinks[1] ? userLinks[1].click() : userLinks[0].click();
    
    // Wait for navigation
    await page.waitForNavigation({ timeout: TIMEOUT });
    
    // Take screenshot of details page
    const screenshotPath = path.join(__dirname, 'screenshots', 'user-details.png');
    await page.screenshot({ path: screenshotPath });
    
    // Verify we are on a user details page
    const userDetailsContent = await page.$('.user-details, .user-info, [data-testid="user-details"]');
    
    if (!userDetailsContent) {
      throw new Error('User details content not found');
    }
    
    results.push({
      feature: 'Users',
      test: 'Details View',
      status: 'Success',
      message: 'User details page loaded successfully',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('User Details test failed:', error);
    results.push({
      feature: 'Users',
      test: 'Details View',
      status: 'Failed',
      message: `User details test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test user edit functionality
 */
async function testUserEdit(page) {
  console.log('Testing User Edit...');
  
  try {
    // Navigate to users list first
    await page.goto(`${BASE_URL}/users`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Check if there are any users
    const userRows = await page.$$('tr');
    
    if (userRows.length <= 1) { // Account for header row
      console.log('No users found to test edit functionality.');
      results.push({
        feature: 'Users',
        test: 'Edit',
        status: 'Skipped',
        message: 'No users found to test edit',
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    // Find edit button/link for the first non-admin user if possible
    const editButtons = await page.$$('a[href*="/edit"], button.edit-btn, [data-action="edit"]');
    
    if (editButtons.length === 0) {
      throw new Error('Edit button not found');
    }
    
    // Click edit button (second one if available to avoid editing admin)
    await (editButtons[1] ? editButtons[1] : editButtons[0]).click();
    
    // Wait for navigation
    await page.waitForNavigation({ timeout: TIMEOUT });
    
    // Take screenshot of edit page
    const screenshotPath = path.join(__dirname, 'screenshots', 'user-edit.png');
    await page.screenshot({ path: screenshotPath });
    
    // Verify we are on an edit page
    const editForm = await page.$('form');
    
    if (!editForm) {
      throw new Error('Edit form not found');
    }
    
    // Update first name with timestamp
    const updatedName = `Updated ${new Date().toISOString().split('T')[0]}`;
    
    // Clear existing value and type new first name
    const firstNameField = await page.$('input[name="firstName"], input[name="first_name"]');
    if (firstNameField) {
      await page.evaluate(() => {
        const input = document.querySelector('input[name="firstName"], input[name="first_name"]');
        if (input) input.value = '';
      });
      
      await page.type('input[name="firstName"], input[name="first_name"]', updatedName);
    } else {
      console.log('First name field not found, skipping field update');
    }
    
    // Take screenshot after editing
    const afterEditScreenshot = path.join(__dirname, 'screenshots', 'user-edit-after.png');
    await page.screenshot({ path: afterEditScreenshot });
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation or success message
    try {
      await Promise.race([
        page.waitForNavigation({ timeout: TIMEOUT }),
        page.waitForSelector('.success-message, .alert-success, [role="alert"]', { timeout: TIMEOUT })
      ]);
    } catch (e) {
      console.log('No navigation or success message detected, continuing test...');
    }
    
    // Check if edit was successful
    const currentUrl = page.url();
    const hasSuccessMessage = await page.$('.success-message, .alert-success, [role="alert"]') !== null;
    
    if (!currentUrl.includes('/edit') || hasSuccessMessage) {
      results.push({
        feature: 'Users',
        test: 'Edit',
        status: 'Success',
        message: `Successfully edited user`,
        timestamp: new Date().toISOString()
      });
      return true;
    } else {
      // Check for error messages
      const errorMessage = await page.evaluate(() => {
        const errorEl = document.querySelector('.error-message, .alert-danger, [role="alert"]');
        return errorEl ? errorEl.innerText : null;
      });
      
      throw new Error(`User edit failed. ${errorMessage || 'No error message displayed.'}`);
    }
  } catch (error) {
    console.error('User Edit test failed:', error);
    results.push({
      feature: 'Users',
      test: 'Edit',
      status: 'Failed',
      message: `User edit test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test user bulk upload functionality
 */
async function testUserBulkUpload(page) {
  console.log('Testing User Bulk Upload...');
  
  try {
    // Navigate to user bulk upload page
    await page.goto(`${BASE_URL}/users/bulk-upload`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, 'screenshots', 'user-bulk-upload.png');
    await page.screenshot({ path: screenshotPath });
    
    // Check if upload form is displayed
    const uploadForm = await page.$('form, .upload-form, [data-testid="bulk-upload"]');
    
    if (!uploadForm) {
      throw new Error('User bulk upload form not found');
    }
    
    // Check for file input
    const fileInput = await page.$('input[type="file"]');
    
    if (!fileInput) {
      throw new Error('File input not found');
    }
    
    results.push({
      feature: 'Users',
      test: 'Bulk Upload',
      status: 'Success',
      message: 'User bulk upload page loaded successfully',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('User Bulk Upload test failed:', error);
    results.push({
      feature: 'Users',
      test: 'Bulk Upload',
      status: 'Failed',
      message: `User bulk upload test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Read users data from CSV file
 */
async function readUsersFromCSV() {
  return new Promise((resolve, reject) => {
    const users = [];
    
    if (!fs.existsSync(USERS_FILE)) {
      return resolve([]);
    }
    
    fs.createReadStream(USERS_FILE)
      .pipe(csv())
      .on('data', (row) => {
        if (row.username && row.password) {
          users.push({
            username: row.username,
            password: row.password,
            email: row.email || `${row.username}@example.com`,
            firstName: row.firstName || row.first_name || 'Test',
            lastName: row.lastName || row.last_name || 'User',
            role: row.role || 'user'
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
 * Create sample users CSV file
 */
function createSampleUsersFile() {
  const content = [
    'username,password,email,firstName,lastName,role',
    'customerAdmin,Admin@123,testuser1@example.com,Test,User1,customer_admin',
    'ClientAdmin,Admin@123,testuser1@example.com,Test,User1,client_admin',
    'FullAccess,Admin@123,testuser2@example.com,Test,User2,full_access',
    'Adm,Admin@123,testmanager@example.com,Test,Manager,admin'
  ].join('\n');
  
  ensureDirectoryExists(path.dirname(USERS_FILE));
  fs.writeFileSync(USERS_FILE, content);
}

/**
 * Write test results to markdown file
 */
async function writeResults() {
  let markdown = '# RSVP4 Users Tests Results\n\n';
  markdown += `*Test executed on: ${new Date().toISOString()}*\n\n`;
  
  // Summary
  const total = results.length;
  const successful = results.filter(r => r.status === 'Success').length;
  const failed = results.filter(r => r.status === 'Failed').length;
  const skipped = results.filter(r => r.status === 'Skipped').length;
  const errors = results.filter(r => r.status === 'Error').length;
  
  markdown += `## Summary\n\n`;
  markdown += `- Total Tests: ${total}\n`;
  markdown += `- Successful: ${successful}\n`;
  markdown += `- Failed: ${failed}\n`;
  markdown += `- Skipped: ${skipped}\n`;
  markdown += `- Errors: ${errors}\n\n`;
  
  // Detailed results
  markdown += `## Detailed Results\n\n`;
  
  markdown += `| Feature | Test | Status | Message | Timestamp |\n`;
  markdown += `|---------|------|--------|---------|----------|\n`;
  
  results.forEach(result => {
    markdown += `| ${result.feature} | ${result.test} | ${result.status} | ${result.message} | ${result.timestamp} |\n`;
  });
  
  // Write to file
  ensureDirectoryExists(path.dirname(RESULTS_FILE));
  fs.writeFileSync(RESULTS_FILE, markdown);
}

/**
 * Ensure directory exists
 */
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

// Run the tests
runUsersTests();
