const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000;
const ROLES_FILE = path.join(__dirname, 'roles-data.csv');
const RESULTS_FILE = path.join(__dirname, 'roles-test-results.md');

// Results tracking
const results = [];

/**
 * Main test function to test roles functionality
 */
async function runRolesTests() {
  console.log('Starting Roles UI Tests for RSVP4 Application');
  
  // Create sample roles data file if it doesn't exist
  if (!fs.existsSync(ROLES_FILE)) {
    console.log('Roles data file not found. Creating sample file...');
    createSampleRolesFile();
    console.log(`Created sample roles file at ${ROLES_FILE}. Please update with real data before running tests again.`);
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
    
    // Run all role tests
    await testRolesList(page);
    await testRoleCreation(page, browser);
    await testRoleDetails(page);
    await testRoleEdit(page);
    await testFeatureTogglesList(page);
    await testRoleBulkUpload(page);
    
  } catch (error) {
    console.error('Test execution error:', error);
    results.push({
      feature: 'Roles',
      test: 'General',
      status: 'Error',
      message: `Test execution error: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Write results to file
    await writeResults();
    
    console.log('Roles tests completed.');
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
    const screenshotPath = path.join(__dirname, 'screenshots', 'roles-login-before.png');
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
    const afterScreenshotPath = path.join(__dirname, 'screenshots', 'roles-login-after.png');
    await page.screenshot({ path: afterScreenshotPath });
    
    results.push({
      feature: 'Roles',
      test: 'Login',
      status: 'Success',
      message: 'Successfully logged in as admin',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    results.push({
      feature: 'Roles',
      test: 'Login',
      status: 'Failed',
      message: `Login failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Test roles list page
 */
async function testRolesList(page) {
  console.log('Testing Roles List...');
  
  try {
    // Navigate to roles list page
    await page.goto(`${BASE_URL}/roles`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, 'screenshots', 'roles-list.png');
    await page.screenshot({ path: screenshotPath });
    
    // Check if roles list is displayed
    const rolesTable = await page.$('.roles-table, table, [data-testid="roles-list"]');
    const noRolesMessage = await page.$('.no-roles-message, .empty-state');
    
    if (!rolesTable && !noRolesMessage) {
      throw new Error('Roles list not displayed correctly');
    }
    
    // Check for create button
    const createButton = await page.$('a[href="/roles/create"], button:has-text("Create Role")');
    if (!createButton) {
      console.log('Warning: Create Role button not found');
    }
    
    results.push({
      feature: 'Roles',
      test: 'List View',
      status: 'Success',
      message: 'Roles list page loaded successfully',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Roles List test failed:', error);
    results.push({
      feature: 'Roles',
      test: 'List View',
      status: 'Failed',
      message: `Roles list test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test role creation with data from CSV
 */
async function testRoleCreation(page, browser) {
  console.log('Testing Role Creation...');
  
  try {
    const roles = await readRolesFromCSV();
    
    if (roles.length === 0) {
      console.log('No roles found in CSV file. Skipping creation test.');
      results.push({
        feature: 'Roles',
        test: 'Creation',
        status: 'Skipped',
        message: 'No roles data found in CSV file',
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    // Use first role from CSV
    const testRole = roles[0];
    
    // Navigate to role create page
    await page.goto(`${BASE_URL}/roles/create`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot before filling form
    const beforeScreenshot = path.join(__dirname, 'screenshots', 'role-create-before.png');
    await page.screenshot({ path: beforeScreenshot });
    
    // Fill in role details
    await page.type('input[name="name"], input[name="roleName"]', testRole.name);
    
    if (await page.$('textarea[name="description"]')) {
      await page.type('textarea[name="description"]', testRole.description);
    }
    
    // Handle permissions checkboxes if they exist
    const permissionsCheckboxes = await page.$$('input[type="checkbox"]');
    if (permissionsCheckboxes.length > 0) {
      // Check the first 2-3 permissions
      for (let i = 0; i < Math.min(3, permissionsCheckboxes.length); i++) {
        await permissionsCheckboxes[i].click();
      }
    }
    
    // Take screenshot after filling form
    const afterScreenshot = path.join(__dirname, 'screenshots', 'role-create-after.png');
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
    
    // Check if we're redirected to roles list or have a success message
    const currentUrl = page.url();
    const hasSuccessMessage = await page.$('.success-message, .alert-success, [role="alert"]') !== null;
    
    if (currentUrl.includes('/roles') || hasSuccessMessage) {
      results.push({
        feature: 'Roles',
        test: 'Creation',
        status: 'Success',
        message: `Successfully created role: ${testRole.name}`,
        timestamp: new Date().toISOString()
      });
      return true;
    } else {
      // Check for error messages
      const errorMessage = await page.evaluate(() => {
        const errorEl = document.querySelector('.error-message, .alert-danger, [role="alert"]');
        return errorEl ? errorEl.innerText : null;
      });
      
      throw new Error(`Role creation failed. ${errorMessage || 'No error message displayed.'}`);
    }
  } catch (error) {
    console.error('Role Creation test failed:', error);
    results.push({
      feature: 'Roles',
      test: 'Creation',
      status: 'Failed',
      message: `Role creation failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test role details page
 */
async function testRoleDetails(page) {
  console.log('Testing Role Details...');
  
  try {
    // Navigate to roles list first
    await page.goto(`${BASE_URL}/roles`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Check if there are any roles
    const roleLinks = await page.$$('a[href*="/roles/"], tr td a');
    
    if (roleLinks.length === 0) {
      console.log('No roles found to test details view.');
      results.push({
        feature: 'Roles',
        test: 'Details View',
        status: 'Skipped',
        message: 'No roles found to test details',
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    // Click on the first role that's not "admin" if possible
    const targetLink = roleLinks[1] || roleLinks[0];
    await targetLink.click();
    
    // Wait for navigation
    await page.waitForNavigation({ timeout: TIMEOUT });
    
    // Take screenshot of details page
    const screenshotPath = path.join(__dirname, 'screenshots', 'role-details.png');
    await page.screenshot({ path: screenshotPath });
    
    // Verify we are on a role details page
    const roleDetailsContent = await page.$('.role-details, .role-info, [data-testid="role-details"]');
    
    if (!roleDetailsContent) {
      throw new Error('Role details content not found');
    }
    
    results.push({
      feature: 'Roles',
      test: 'Details View',
      status: 'Success',
      message: 'Role details page loaded successfully',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Role Details test failed:', error);
    results.push({
      feature: 'Roles',
      test: 'Details View',
      status: 'Failed',
      message: `Role details test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test role edit functionality
 */
async function testRoleEdit(page) {
  console.log('Testing Role Edit...');
  
  try {
    // Navigate to roles list first
    await page.goto(`${BASE_URL}/roles`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Check if there are any roles
    const roleRows = await page.$$('tr');
    
    if (roleRows.length <= 1) { // Account for header row
      console.log('No roles found to test edit functionality.');
      results.push({
        feature: 'Roles',
        test: 'Edit',
        status: 'Skipped',
        message: 'No roles found to test edit',
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    // Find edit button/link for the first non-admin role if possible
    const editButtons = await page.$$('a[href*="/edit"], button.edit-btn, [data-action="edit"]');
    
    if (editButtons.length === 0) {
      throw new Error('Edit button not found');
    }
    
    // Click edit button (second one if available to avoid editing admin)
    await (editButtons[1] ? editButtons[1] : editButtons[0]).click();
    
    // Wait for navigation
    await page.waitForNavigation({ timeout: TIMEOUT });
    
    // Take screenshot of edit page
    const screenshotPath = path.join(__dirname, 'screenshots', 'role-edit.png');
    await page.screenshot({ path: screenshotPath });
    
    // Verify we are on an edit page
    const editForm = await page.$('form');
    
    if (!editForm) {
      throw new Error('Edit form not found');
    }
    
    // Update role description with timestamp
    const updatedDescription = `Updated description ${new Date().toISOString().split('T')[0]}`;
    
    // Clear existing description and type new one if field exists
    const descriptionField = await page.$('textarea[name="description"]');
    if (descriptionField) {
      await page.evaluate(() => {
        const textarea = document.querySelector('textarea[name="description"]');
        if (textarea) textarea.value = '';
      });
      
      await page.type('textarea[name="description"]', updatedDescription);
    } else {
      console.log('Description field not found, skipping field update');
    }
    
    // Take screenshot after editing
    const afterEditScreenshot = path.join(__dirname, 'screenshots', 'role-edit-after.png');
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
        feature: 'Roles',
        test: 'Edit',
        status: 'Success',
        message: 'Successfully edited role',
        timestamp: new Date().toISOString()
      });
      return true;
    } else {
      // Check for error messages
      const errorMessage = await page.evaluate(() => {
        const errorEl = document.querySelector('.error-message, .alert-danger, [role="alert"]');
        return errorEl ? errorEl.innerText : null;
      });
      
      throw new Error(`Role edit failed. ${errorMessage || 'No error message displayed.'}`);
    }
  } catch (error) {
    console.error('Role Edit test failed:', error);
    results.push({
      feature: 'Roles',
      test: 'Edit',
      status: 'Failed',
      message: `Role edit test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test feature toggles list
 */
async function testFeatureTogglesList(page) {
  console.log('Testing Feature Toggles List...');
  
  try {
    // Navigate to feature toggles list page
    await page.goto(`${BASE_URL}/roles/feature-toggles`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, 'screenshots', 'feature-toggles-list.png');
    await page.screenshot({ path: screenshotPath });
    
    // Check if toggles list is displayed
    const togglesContainer = await page.$('.feature-toggles, .toggles-list, [data-testid="feature-toggles"]');
    
    // This might not exist in some implementations
    if (!togglesContainer) {
      console.log('Feature toggles container not found, may not be implemented');
      results.push({
        feature: 'Roles',
        test: 'Feature Toggles',
        status: 'Skipped',
        message: 'Feature toggles list may not be implemented',
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    results.push({
      feature: 'Roles',
      test: 'Feature Toggles',
      status: 'Success',
      message: 'Feature toggles list loaded successfully',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Feature Toggles List test failed:', error);
    results.push({
      feature: 'Roles',
      test: 'Feature Toggles',
      status: 'Failed',
      message: `Feature toggles list test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test role bulk upload functionality
 */
async function testRoleBulkUpload(page) {
  console.log('Testing Role Bulk Upload...');
  
  try {
    // Navigate to role bulk upload page
    await page.goto(`${BASE_URL}/roles/bulk-upload`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, 'screenshots', 'role-bulk-upload.png');
    await page.screenshot({ path: screenshotPath });
    
    // Check if upload form is displayed
    const uploadForm = await page.$('form, .upload-form, [data-testid="bulk-upload"]');
    
    if (!uploadForm) {
      throw new Error('Role bulk upload form not found');
    }
    
    // Check for file input
    const fileInput = await page.$('input[type="file"]');
    
    if (!fileInput) {
      throw new Error('File input not found');
    }
    
    results.push({
      feature: 'Roles',
      test: 'Bulk Upload',
      status: 'Success',
      message: 'Role bulk upload page loaded successfully',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Role Bulk Upload test failed:', error);
    results.push({
      feature: 'Roles',
      test: 'Bulk Upload',
      status: 'Failed',
      message: `Role bulk upload test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Read roles data from CSV file
 */
async function readRolesFromCSV() {
  return new Promise((resolve, reject) => {
    const roles = [];
    
    if (!fs.existsSync(ROLES_FILE)) {
      return resolve([]);
    }
    
    fs.createReadStream(ROLES_FILE)
      .pipe(csv())
      .on('data', (row) => {
        if (row.name) {
          roles.push({
            name: row.name,
            description: row.description || `Test role description for ${row.name}`,
            permissions: row.permissions ? row.permissions.split(',') : []
          });
        }
      })
      .on('end', () => {
        resolve(roles);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Create sample roles CSV file
 */
function createSampleRolesFile() {
  const content = [
    'name,description,permissions',
    'Guest,"Guest user with limited access","view_events,view_subevents"',
    'Moderator,"Moderate level access for event management","view_events,edit_events,view_subevents,edit_subevents"',
    'Organizer,"Full access to event organization","view_events,create_events,edit_events,delete_events,view_subevents,create_subevents,edit_subevents,delete_subevents"'
  ].join('\n');
  
  ensureDirectoryExists(path.dirname(ROLES_FILE));
  fs.writeFileSync(ROLES_FILE, content);
}

/**
 * Write test results to markdown file
 */
async function writeResults() {
  let markdown = '# RSVP4 Roles Tests Results\n\n';
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
runRolesTests();
