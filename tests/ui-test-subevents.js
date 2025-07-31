const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000;
const SUBEVENTS_FILE = path.join(__dirname, 'subevents-data.csv');
const RESULTS_FILE = path.join(__dirname, 'subevents-test-results.md');

// Results tracking
const results = [];

/**
 * Main test function to test subevents functionality
 */
async function runSubeventsTests() {
  console.log('Starting Subevents UI Tests for RSVP4 Application');
  
  // Create sample subevents data file if it doesn't exist
  if (!fs.existsSync(SUBEVENTS_FILE)) {
    console.log('Subevents data file not found. Creating sample file...');
    createSampleSubeventsFile();
    console.log(`Created sample subevents file at ${SUBEVENTS_FILE}. Please update with real data before running tests again.`);
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
    
    // Run all subevent tests
    await testSubeventsList(page);
    await testSubeventCreation(page, browser);
    await testSubeventDetails(page);
    await testSubeventAllocation(page);
    await testSubeventTimeline(page);
    
  } catch (error) {
    console.error('Test execution error:', error);
    results.push({
      feature: 'Subevents',
      test: 'General',
      status: 'Error',
      message: `Test execution error: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Write results to file
    await writeResults();
    
    console.log('Subevents tests completed.');
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
    const screenshotPath = path.join(__dirname, 'screenshots', 'subevents-login-before.png');
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
    const afterScreenshotPath = path.join(__dirname, 'screenshots', 'subevents-login-after.png');
    await page.screenshot({ path: afterScreenshotPath });
    
    results.push({
      feature: 'Subevents',
      test: 'Login',
      status: 'Success',
      message: 'Successfully logged in as admin',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    results.push({
      feature: 'Subevents',
      test: 'Login',
      status: 'Failed',
      message: `Login failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Test subevents list page
 */
async function testSubeventsList(page) {
  console.log('Testing Subevents List...');
  
  try {
    // Navigate to subevents list page
    await page.goto(`${BASE_URL}/subevents/list`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, 'screenshots', 'subevents-list.png');
    await page.screenshot({ path: screenshotPath });
    
    // Check if subevents list is displayed
    const subeventsTable = await page.$('.subevents-table, table, [data-testid="subevents-list"]');
    const noSubeventsMessage = await page.$('.no-subevents-message, .empty-state');
    
    if (!subeventsTable && !noSubeventsMessage) {
      throw new Error('Subevents list not displayed correctly');
    }
    
    // Check for create button
    const createButton = await page.$('a[href="/subevents/create"], button:has-text("Create Subevent")');
    if (!createButton) {
      throw new Error('Create Subevent button not found');
    }
    
    results.push({
      feature: 'Subevents',
      test: 'List View',
      status: 'Success',
      message: 'Subevents list page loaded successfully',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Subevents List test failed:', error);
    results.push({
      feature: 'Subevents',
      test: 'List View',
      status: 'Failed',
      message: `Subevents list test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test subevent creation with data from CSV
 */
async function testSubeventCreation(page, browser) {
  console.log('Testing Subevent Creation...');
  
  try {
    const subevents = await readSubeventsFromCSV();
    
    if (subevents.length === 0) {
      console.log('No subevents found in CSV file. Skipping creation test.');
      results.push({
        feature: 'Subevents',
        test: 'Creation',
        status: 'Skipped',
        message: 'No subevents data found in CSV file',
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    // Use first subevent from CSV
    const testSubevent = subevents[0];
    
    // Navigate to subevent create page
    await page.goto(`${BASE_URL}/subevents/create`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot before filling form
    const beforeScreenshot = path.join(__dirname, 'screenshots', 'subevent-create-before.png');
    await page.screenshot({ path: beforeScreenshot });
    
    // Fill in subevent details
    await page.type('input[name="name"], input[name="subeventName"]', testSubevent.name);
    await page.type('textarea[name="description"]', testSubevent.description);
    
    // Handle date inputs
    await page.type('input[name="startDate"], input[name="startDateTime"]', testSubevent.startDateTime);
    await page.type('input[name="endDate"], input[name="endDateTime"]', testSubevent.endDateTime);
    
    // Handle location
    if (await page.$('input[name="location"], input[name="venue"]')) {
      await page.type('input[name="location"], input[name="venue"]', testSubevent.location);
    }
    
    // Select parent event if dropdown exists
    const eventDropdown = await page.$('select[name="eventId"], select[name="parentEventId"]');
    if (eventDropdown) {
      // Get the first option value
      const firstOptionValue = await page.evaluate(() => {
        const select = document.querySelector('select[name="eventId"], select[name="parentEventId"]');
        return select && select.options.length > 0 ? select.options[1].value : null;
      });
      
      if (firstOptionValue) {
        await page.select('select[name="eventId"], select[name="parentEventId"]', firstOptionValue);
      }
    }
    
    // Take screenshot after filling form
    const afterScreenshot = path.join(__dirname, 'screenshots', 'subevent-create-after.png');
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
    
    // Check if we're redirected to subevents list or have a success message
    const currentUrl = page.url();
    const hasSuccessMessage = await page.$('.success-message, .alert-success, [role="alert"]') !== null;
    
    if (currentUrl.includes('/subevents/list') || currentUrl.includes('/subevents/') || hasSuccessMessage) {
      results.push({
        feature: 'Subevents',
        test: 'Creation',
        status: 'Success',
        message: `Successfully created subevent: ${testSubevent.name}`,
        timestamp: new Date().toISOString()
      });
      return true;
    } else {
      // Check for error messages
      const errorMessage = await page.evaluate(() => {
        const errorEl = document.querySelector('.error-message, .alert-danger, [role="alert"]');
        return errorEl ? errorEl.innerText : null;
      });
      
      throw new Error(`Subevent creation failed. ${errorMessage || 'No error message displayed.'}`);
    }
  } catch (error) {
    console.error('Subevent Creation test failed:', error);
    results.push({
      feature: 'Subevents',
      test: 'Creation',
      status: 'Failed',
      message: `Subevent creation failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test subevent details page
 */
async function testSubeventDetails(page) {
  console.log('Testing Subevent Details...');
  
  try {
    // Navigate to subevents list first
    await page.goto(`${BASE_URL}/subevents/list`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Check if there are any subevents
    const subeventLinks = await page.$$('a[href*="/subevents/"], tr td a');
    
    if (subeventLinks.length === 0) {
      console.log('No subevents found to test details view.');
      results.push({
        feature: 'Subevents',
        test: 'Details View',
        status: 'Skipped',
        message: 'No subevents found to test details',
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    // Click on the first subevent
    await subeventLinks[0].click();
    
    // Wait for navigation
    await page.waitForNavigation({ timeout: TIMEOUT });
    
    // Take screenshot of details page
    const screenshotPath = path.join(__dirname, 'screenshots', 'subevent-details.png');
    await page.screenshot({ path: screenshotPath });
    
    // Verify we are on a subevent details page
    const subeventDetailsContent = await page.$('.subevent-details, .subevent-info, [data-testid="subevent-details"]');
    
    if (!subeventDetailsContent) {
      throw new Error('Subevent details content not found');
    }
    
    results.push({
      feature: 'Subevents',
      test: 'Details View',
      status: 'Success',
      message: 'Subevent details page loaded successfully',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Subevent Details test failed:', error);
    results.push({
      feature: 'Subevents',
      test: 'Details View',
      status: 'Failed',
      message: `Subevent details test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test subevent allocation page
 */
async function testSubeventAllocation(page) {
  console.log('Testing Subevent Allocation...');
  
  try {
    // Navigate to subevent allocation page
    await page.goto(`${BASE_URL}/subevents/allocation`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, 'screenshots', 'subevent-allocation.png');
    await page.screenshot({ path: screenshotPath });
    
    // Check if allocation interface exists
    const allocationInterface = await page.$('.allocation-interface, .subevent-allocation, [data-testid="subevent-allocation"]');
    
    if (!allocationInterface) {
      throw new Error('Subevent allocation interface not found');
    }
    
    results.push({
      feature: 'Subevents',
      test: 'Allocation',
      status: 'Success',
      message: 'Subevent allocation page loaded successfully',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Subevent Allocation test failed:', error);
    results.push({
      feature: 'Subevents',
      test: 'Allocation',
      status: 'Failed',
      message: `Subevent allocation test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test subevent timeline view
 */
async function testSubeventTimeline(page) {
  console.log('Testing Subevent Timeline...');
  
  try {
    // Navigate to subevent timeline
    await page.goto(`${BASE_URL}/subevents/timeline`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, 'screenshots', 'subevent-timeline.png');
    await page.screenshot({ path: screenshotPath });
    
    // Check if timeline exists
    const timelineElement = await page.$('.timeline, .subevent-timeline, [data-testid="subevent-timeline"]');
    
    if (!timelineElement) {
      throw new Error('Subevent timeline not found');
    }
    
    results.push({
      feature: 'Subevents',
      test: 'Timeline',
      status: 'Success',
      message: 'Subevent timeline loaded successfully',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Subevent Timeline test failed:', error);
    results.push({
      feature: 'Subevents',
      test: 'Timeline',
      status: 'Failed',
      message: `Subevent timeline test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Read subevents data from CSV file
 */
async function readSubeventsFromCSV() {
  return new Promise((resolve, reject) => {
    const subevents = [];
    
    if (!fs.existsSync(SUBEVENTS_FILE)) {
      return resolve([]);
    }
    
    fs.createReadStream(SUBEVENTS_FILE)
      .pipe(csv())
      .on('data', (row) => {
        if (row.name) {
          subevents.push({
            name: row.name,
            description: row.description || 'Test subevent description',
            startDateTime: row.startDateTime || formatDate(new Date()),
            endDateTime: row.endDateTime || formatDate(new Date(Date.now() + 86400000)), // tomorrow
            location: row.location || 'Test Location',
            eventId: row.eventId || '1' // Default event ID
          });
        }
      })
      .on('end', () => {
        resolve(subevents);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Create sample subevents CSV file
 */
function createSampleSubeventsFile() {
  const content = [
    'name,description,startDateTime,endDateTime,location,eventId',
    'Opening Ceremony,Kick-off ceremony for the conference,2025-08-15T09:00,2025-08-15T10:30,Main Hall,1',
    'Workshop A,Technical workshop for developers,2025-08-15T11:00,2025-08-15T13:00,Room 101,1',
    'Networking Lunch,Lunch and networking opportunity,2025-08-15T13:00,2025-08-15T14:30,Dining Area,1'
  ].join('\n');
  
  ensureDirectoryExists(path.dirname(SUBEVENTS_FILE));
  fs.writeFileSync(SUBEVENTS_FILE, content);
}

/**
 * Write test results to markdown file
 */
async function writeResults() {
  let markdown = '# RSVP4 Subevents Tests Results\n\n';
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
 * Format date for input fields
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
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
runSubeventsTests();
