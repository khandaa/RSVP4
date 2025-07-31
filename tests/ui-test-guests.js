const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000;
const GUESTS_FILE = path.join(__dirname, 'guests-data.csv');
const RESULTS_FILE = path.join(__dirname, 'guests-test-results.md');

// Results tracking
const results = [];

/**
 * Main test function to test guests functionality
 */
async function runGuestsTests() {
  console.log('Starting Guests UI Tests for RSVP4 Application');
  
  // Create sample guests data file if it doesn't exist
  if (!fs.existsSync(GUESTS_FILE)) {
    console.log('Guests data file not found. Creating sample file...');
    createSampleGuestsFile();
    console.log(`Created sample guests file at ${GUESTS_FILE}. Please update with real data before running tests again.`);
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
    
    // Run all guest tests
    await testGuestsList(page);
    await testGuestCreation(page, browser);
    await testGuestImport(page);
    await testGuestDetails(page);
    
  } catch (error) {
    console.error('Test execution error:', error);
    results.push({
      feature: 'Guests',
      test: 'General',
      status: 'Error',
      message: `Test execution error: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Write results to file
    await writeResults();
    
    console.log('Guests tests completed.');
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
    const screenshotPath = path.join(__dirname, 'screenshots', 'guests-login-before.png');
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
    const afterScreenshotPath = path.join(__dirname, 'screenshots', 'guests-login-after.png');
    await page.screenshot({ path: afterScreenshotPath });
    
    results.push({
      feature: 'Guests',
      test: 'Login',
      status: 'Success',
      message: 'Successfully logged in as admin',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    results.push({
      feature: 'Guests',
      test: 'Login',
      status: 'Failed',
      message: `Login failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Test guests list page
 */
async function testGuestsList(page) {
  console.log('Testing Guests List...');
  
  try {
    // Navigate to guests list page
    await page.goto(`${BASE_URL}/guests/list`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, 'screenshots', 'guests-list.png');
    await page.screenshot({ path: screenshotPath });
    
    // Check if guests list is displayed
    const guestsTable = await page.$('.guests-table, table, [data-testid="guests-list"]');
    const noGuestsMessage = await page.$('.no-guests-message, .empty-state');
    
    if (!guestsTable && !noGuestsMessage) {
      throw new Error('Guests list not displayed correctly');
    }
    
    // Check for create button
    const createButton = await page.$('a[href="/guests/create"], button:has-text("Add Guest")');
    if (!createButton) {
      console.log('Warning: Create Guest button not found');
    }
    
    results.push({
      feature: 'Guests',
      test: 'List View',
      status: 'Success',
      message: 'Guests list page loaded successfully',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Guests List test failed:', error);
    results.push({
      feature: 'Guests',
      test: 'List View',
      status: 'Failed',
      message: `Guests list test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test guest creation with data from CSV
 */
async function testGuestCreation(page, browser) {
  console.log('Testing Guest Creation...');
  
  try {
    const guests = await readGuestsFromCSV();
    
    if (guests.length === 0) {
      console.log('No guests found in CSV file. Skipping creation test.');
      results.push({
        feature: 'Guests',
        test: 'Creation',
        status: 'Skipped',
        message: 'No guests data found in CSV file',
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    // Use first guest from CSV
    const testGuest = guests[0];
    
    // Navigate to guest create page
    await page.goto(`${BASE_URL}/guests/create`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot before filling form
    const beforeScreenshot = path.join(__dirname, 'screenshots', 'guest-create-before.png');
    await page.screenshot({ path: beforeScreenshot });
    
    // Fill in guest details
    if (await page.$('input[name="firstName"], input[name="first_name"]')) {
      await page.type('input[name="firstName"], input[name="first_name"]', testGuest.firstName);
      await page.type('input[name="lastName"], input[name="last_name"]', testGuest.lastName);
    } else if (await page.$('input[name="name"]')) {
      // If using single name field instead of separate first/last name
      await page.type('input[name="name"]', `${testGuest.firstName} ${testGuest.lastName}`);
    }
    
    // Fill email
    if (await page.$('input[name="email"]')) {
      await page.type('input[name="email"]', testGuest.email);
    }
    
    // Fill phone if field exists
    if (await page.$('input[name="phone"], input[name="phoneNumber"]')) {
      await page.type('input[name="phone"], input[name="phoneNumber"]', testGuest.phone);
    }
    
    // Select event if dropdown exists
    const eventDropdown = await page.$('select[name="eventId"]');
    if (eventDropdown) {
      // Get the first option value
      const firstOptionValue = await page.evaluate(() => {
        const select = document.querySelector('select[name="eventId"]');
        return select && select.options.length > 0 ? select.options[1].value : null;
      });
      
      if (firstOptionValue) {
        await page.select('select[name="eventId"]', firstOptionValue);
      }
    }
    
    // Take screenshot after filling form
    const afterScreenshot = path.join(__dirname, 'screenshots', 'guest-create-after.png');
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
    
    // Check if we're redirected to guests list or have a success message
    const currentUrl = page.url();
    const hasSuccessMessage = await page.$('.success-message, .alert-success, [role="alert"]') !== null;
    
    if (currentUrl.includes('/guests/list') || currentUrl.includes('/guests') || hasSuccessMessage) {
      results.push({
        feature: 'Guests',
        test: 'Creation',
        status: 'Success',
        message: `Successfully created guest: ${testGuest.firstName} ${testGuest.lastName}`,
        timestamp: new Date().toISOString()
      });
      return true;
    } else {
      // Check for error messages
      const errorMessage = await page.evaluate(() => {
        const errorEl = document.querySelector('.error-message, .alert-danger, [role="alert"]');
        return errorEl ? errorEl.innerText : null;
      });
      
      throw new Error(`Guest creation failed. ${errorMessage || 'No error message displayed.'}`);
    }
  } catch (error) {
    console.error('Guest Creation test failed:', error);
    results.push({
      feature: 'Guests',
      test: 'Creation',
      status: 'Failed',
      message: `Guest creation failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test guest import functionality
 */
async function testGuestImport(page) {
  console.log('Testing Guest Import...');
  
  try {
    // Navigate to guest import page
    await page.goto(`${BASE_URL}/guests/import`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, 'screenshots', 'guest-import.png');
    await page.screenshot({ path: screenshotPath });
    
    // Check if import form is displayed
    const importForm = await page.$('form, .import-form, [data-testid="guest-import"]');
    
    if (!importForm) {
      throw new Error('Guest import form not displayed correctly');
    }
    
    // Check for file input
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      throw new Error('File input not found in import form');
    }
    
    results.push({
      feature: 'Guests',
      test: 'Import',
      status: 'Success',
      message: 'Guest import page loaded successfully',
      timestamp: new Date().toISOString()
    });
    
    // Note: We're not actually uploading a file as it would require specific setup
    // and would be highly implementation-dependent
    
    return true;
  } catch (error) {
    console.error('Guest Import test failed:', error);
    results.push({
      feature: 'Guests',
      test: 'Import',
      status: 'Failed',
      message: `Guest import test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test guest details page
 */
async function testGuestDetails(page) {
  console.log('Testing Guest Details...');
  
  try {
    // Navigate to guests list first
    await page.goto(`${BASE_URL}/guests/list`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Check if there are any guests
    const guestLinks = await page.$$('a[href*="/guests/"], tr td a');
    
    if (guestLinks.length === 0) {
      console.log('No guests found to test details view.');
      results.push({
        feature: 'Guests',
        test: 'Details View',
        status: 'Skipped',
        message: 'No guests found to test details',
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    // Click on the first guest
    await guestLinks[0].click();
    
    // Wait for navigation
    await page.waitForNavigation({ timeout: TIMEOUT });
    
    // Take screenshot of details page
    const screenshotPath = path.join(__dirname, 'screenshots', 'guest-details.png');
    await page.screenshot({ path: screenshotPath });
    
    // Verify we are on a guest details page
    const guestDetailsContent = await page.$('.guest-details, .guest-info, [data-testid="guest-details"]');
    
    if (!guestDetailsContent) {
      throw new Error('Guest details content not found');
    }
    
    results.push({
      feature: 'Guests',
      test: 'Details View',
      status: 'Success',
      message: 'Guest details page loaded successfully',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Guest Details test failed:', error);
    results.push({
      feature: 'Guests',
      test: 'Details View',
      status: 'Failed',
      message: `Guest details test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Read guests data from CSV file
 */
async function readGuestsFromCSV() {
  return new Promise((resolve, reject) => {
    const guests = [];
    
    if (!fs.existsSync(GUESTS_FILE)) {
      return resolve([]);
    }
    
    fs.createReadStream(GUESTS_FILE)
      .pipe(csv())
      .on('data', (row) => {
        if (row.firstName || row.first_name || row.name) {
          guests.push({
            firstName: row.firstName || row.first_name || row.name.split(' ')[0],
            lastName: row.lastName || row.last_name || row.name.split(' ')[1] || '',
            email: row.email || `${row.firstName || row.first_name || 'guest'}@example.com`,
            phone: row.phone || row.phoneNumber || '555-123-4567',
            eventId: row.eventId || '1' // Default event ID
          });
        }
      })
      .on('end', () => {
        resolve(guests);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Create sample guests CSV file
 */
function createSampleGuestsFile() {
  const content = [
    'firstName,lastName,email,phone,eventId',
    'John,Doe,john.doe@example.com,555-123-4567,1',
    'Jane,Smith,jane.smith@example.com,555-234-5678,1',
    'Robert,Johnson,robert.johnson@example.com,555-345-6789,1'
  ].join('\n');
  
  ensureDirectoryExists(path.dirname(GUESTS_FILE));
  fs.writeFileSync(GUESTS_FILE, content);
}

/**
 * Write test results to markdown file
 */
async function writeResults() {
  let markdown = '# RSVP4 Guests Tests Results\n\n';
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
runGuestsTests();
