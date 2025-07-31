const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000;
const EVENTS_FILE = path.join(__dirname, 'events-data.csv');
const RESULTS_FILE = path.join(__dirname, 'events-test-results.md');

// Results tracking
const results = [];

/**
 * Main test function to test events functionality
 */
async function runEventsTests() {
  console.log('Starting Events UI Tests for RSVP4 Application');
  
  // Create sample events data file if it doesn't exist
  if (!fs.existsSync(EVENTS_FILE)) {
    console.log('Events data file not found. Creating sample file...');
    createSampleEventsFile();
    console.log(`Created sample events file at ${EVENTS_FILE}. Please update with real data before running tests again.`);
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
    
    // Run all event tests
    await testEventsList(page);
    await testEventCreation(page, browser);
    await testEventDetails(page);
    await testEventEdit(page);
    await testEventCalendar(page);
    
  } catch (error) {
    console.error('Test execution error:', error);
    results.push({
      feature: 'Events',
      test: 'General',
      status: 'Error',
      message: `Test execution error: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Write results to file
    await writeResults();
    
    console.log('Events tests completed.');
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
    const screenshotPath = path.join(__dirname, 'screenshots', 'events-login-before.png');
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
    const afterScreenshotPath = path.join(__dirname, 'screenshots', 'events-login-after.png');
    await page.screenshot({ path: afterScreenshotPath });
    
    results.push({
      feature: 'Events',
      test: 'Login',
      status: 'Success',
      message: 'Successfully logged in as admin',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    results.push({
      feature: 'Events',
      test: 'Login',
      status: 'Failed',
      message: `Login failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Test events list page
 */
async function testEventsList(page) {
  console.log('Testing Events List...');
  
  try {
    // Navigate to events list page
    await page.goto(`${BASE_URL}/events/list`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, 'screenshots', 'events-list.png');
    await page.screenshot({ path: screenshotPath });
    
    // Check if events list is displayed
    const eventsTable = await page.$('.events-table, table, [data-testid="events-list"]');
    const noEventsMessage = await page.$('.no-events-message, .empty-state');
    
    if (!eventsTable && !noEventsMessage) {
      throw new Error('Events list not displayed correctly');
    }
    
    // Check for create button
    const createButton = await page.$('a[href="/events/create"], button:has-text("Create Event")');
    if (!createButton) {
      throw new Error('Create Event button not found');
    }
    
    results.push({
      feature: 'Events',
      test: 'List View',
      status: 'Success',
      message: 'Events list page loaded successfully',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Events List test failed:', error);
    results.push({
      feature: 'Events',
      test: 'List View',
      status: 'Failed',
      message: `Events list test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test event creation with data from CSV
 */
async function testEventCreation(page, browser) {
  console.log('Testing Event Creation...');
  
  try {
    const events = await readEventsFromCSV();
    
    if (events.length === 0) {
      console.log('No events found in CSV file. Skipping creation test.');
      results.push({
        feature: 'Events',
        test: 'Creation',
        status: 'Skipped',
        message: 'No events data found in CSV file',
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    // Use first event from CSV
    const testEvent = events[0];
    
    // Navigate to event create page
    await page.goto(`${BASE_URL}/events/create`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot before filling form
    const beforeScreenshot = path.join(__dirname, 'screenshots', 'event-create-before.png');
    await page.screenshot({ path: beforeScreenshot });
    
    // Fill in event details
    await page.type('input[name="name"], input[name="eventName"]', testEvent.name);
    await page.type('input[name="description"], textarea[name="description"]', testEvent.description);
    
    // Handle date inputs
    await page.type('input[name="startDate"], input[name="start_date"]', testEvent.startDate);
    await page.type('input[name="endDate"], input[name="end_date"]', testEvent.endDate);
    
    // Handle location
    if (await page.$('input[name="location"]')) {
      await page.type('input[name="location"]', testEvent.location);
    }
    
    // Select event type if dropdown exists
    const eventTypeDropdown = await page.$('select[name="eventType"], select[name="event_type"]');
    if (eventTypeDropdown) {
      await page.select('select[name="eventType"], select[name="event_type"]', testEvent.eventType);
    }
    
    // Take screenshot after filling form
    const afterScreenshot = path.join(__dirname, 'screenshots', 'event-create-after.png');
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
    
    // Check if we're redirected to events list or have a success message
    const currentUrl = page.url();
    const hasSuccessMessage = await page.$('.success-message, .alert-success, [role="alert"]') !== null;
    
    if (currentUrl.includes('/events/list') || currentUrl.includes('/events/') || hasSuccessMessage) {
      results.push({
        feature: 'Events',
        test: 'Creation',
        status: 'Success',
        message: `Successfully created event: ${testEvent.name}`,
        timestamp: new Date().toISOString()
      });
      return true;
    } else {
      // Check for error messages
      const errorMessage = await page.evaluate(() => {
        const errorEl = document.querySelector('.error-message, .alert-danger, [role="alert"]');
        return errorEl ? errorEl.innerText : null;
      });
      
      throw new Error(`Event creation failed. ${errorMessage || 'No error message displayed.'}`);
    }
  } catch (error) {
    console.error('Event Creation test failed:', error);
    results.push({
      feature: 'Events',
      test: 'Creation',
      status: 'Failed',
      message: `Event creation failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test event details page
 */
async function testEventDetails(page) {
  console.log('Testing Event Details...');
  
  try {
    // Navigate to events list first
    await page.goto(`${BASE_URL}/events/list`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Check if there are any events
    const eventLinks = await page.$$('a[href*="/events/"], tr td a');
    
    if (eventLinks.length === 0) {
      console.log('No events found to test details view.');
      results.push({
        feature: 'Events',
        test: 'Details View',
        status: 'Skipped',
        message: 'No events found to test details',
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    // Click on the first event
    await eventLinks[0].click();
    
    // Wait for navigation
    await page.waitForNavigation({ timeout: TIMEOUT });
    
    // Take screenshot of details page
    const screenshotPath = path.join(__dirname, 'screenshots', 'event-details.png');
    await page.screenshot({ path: screenshotPath });
    
    // Verify we are on an event details page
    const eventDetailsContent = await page.$('.event-details, .event-info, [data-testid="event-details"]');
    
    if (!eventDetailsContent) {
      throw new Error('Event details content not found');
    }
    
    results.push({
      feature: 'Events',
      test: 'Details View',
      status: 'Success',
      message: 'Event details page loaded successfully',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Event Details test failed:', error);
    results.push({
      feature: 'Events',
      test: 'Details View',
      status: 'Failed',
      message: `Event details test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test event edit functionality
 */
async function testEventEdit(page) {
  console.log('Testing Event Edit...');
  
  try {
    // Navigate to events list first
    await page.goto(`${BASE_URL}/events/list`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Check if there are any events
    const eventRows = await page.$$('tr');
    
    if (eventRows.length <= 1) { // Account for header row
      console.log('No events found to test edit functionality.');
      results.push({
        feature: 'Events',
        test: 'Edit',
        status: 'Skipped',
        message: 'No events found to test edit',
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    // Find edit button/link for the first event
    const editButton = await page.$('a[href*="/edit"], button.edit-btn, [data-action="edit"]');
    
    if (!editButton) {
      throw new Error('Edit button not found');
    }
    
    // Click edit button
    await editButton.click();
    
    // Wait for navigation
    await page.waitForNavigation({ timeout: TIMEOUT });
    
    // Take screenshot of edit page
    const screenshotPath = path.join(__dirname, 'screenshots', 'event-edit.png');
    await page.screenshot({ path: screenshotPath });
    
    // Verify we are on an edit page
    const editForm = await page.$('form');
    
    if (!editForm) {
      throw new Error('Edit form not found');
    }
    
    // Update event name with timestamp
    const updatedName = `Updated Event ${new Date().toISOString().split('T')[0]}`;
    
    // Clear existing value and type new name
    await page.evaluate(() => {
      const nameInput = document.querySelector('input[name="name"], input[name="eventName"]');
      if (nameInput) nameInput.value = '';
    });
    
    await page.type('input[name="name"], input[name="eventName"]', updatedName);
    
    // Take screenshot after editing
    const afterEditScreenshot = path.join(__dirname, 'screenshots', 'event-edit-after.png');
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
        feature: 'Events',
        test: 'Edit',
        status: 'Success',
        message: `Successfully edited event: ${updatedName}`,
        timestamp: new Date().toISOString()
      });
      return true;
    } else {
      // Check for error messages
      const errorMessage = await page.evaluate(() => {
        const errorEl = document.querySelector('.error-message, .alert-danger, [role="alert"]');
        return errorEl ? errorEl.innerText : null;
      });
      
      throw new Error(`Event edit failed. ${errorMessage || 'No error message displayed.'}`);
    }
  } catch (error) {
    console.error('Event Edit test failed:', error);
    results.push({
      feature: 'Events',
      test: 'Edit',
      status: 'Failed',
      message: `Event edit test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test event calendar view
 */
async function testEventCalendar(page) {
  console.log('Testing Event Calendar...');
  
  try {
    // Navigate to event calendar
    await page.goto(`${BASE_URL}/events/calendar`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, 'screenshots', 'event-calendar.png');
    await page.screenshot({ path: screenshotPath });
    
    // Verify calendar elements are present
    const calendarElement = await page.$('.calendar, .fc, [data-testid="event-calendar"]');
    
    if (!calendarElement) {
      throw new Error('Calendar element not found');
    }
    
    // Check for month navigation
    const navigationButtons = await page.$$('.fc-button, .calendar-nav, [data-testid="calendar-nav"]');
    
    if (navigationButtons.length === 0) {
      console.log('Warning: Calendar navigation controls not found');
    }
    
    results.push({
      feature: 'Events',
      test: 'Calendar',
      status: 'Success',
      message: 'Event calendar loaded successfully',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Event Calendar test failed:', error);
    results.push({
      feature: 'Events',
      test: 'Calendar',
      status: 'Failed',
      message: `Event calendar test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Read events data from CSV file
 */
async function readEventsFromCSV() {
  return new Promise((resolve, reject) => {
    const events = [];
    
    if (!fs.existsSync(EVENTS_FILE)) {
      return resolve([]);
    }
    
    fs.createReadStream(EVENTS_FILE)
      .pipe(csv())
      .on('data', (row) => {
        if (row.name) {
          events.push({
            name: row.name,
            description: row.description || 'Test event description',
            startDate: row.startDate || formatDate(new Date()),
            endDate: row.endDate || formatDate(new Date(Date.now() + 86400000)), // tomorrow
            location: row.location || 'Test Location',
            eventType: row.eventType || '1' // Default event type ID
          });
        }
      })
      .on('end', () => {
        resolve(events);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Create sample events CSV file
 */
function createSampleEventsFile() {
  const content = [
    'name,description,startDate,endDate,location,eventType',
    'Annual Conference,Our annual company conference,2025-08-15,2025-08-17,Convention Center,1',
    'Team Building,Team building event for employees,2025-09-01,2025-09-01,Recreation Park,2',
    'Product Launch,Launch of our new product line,2025-10-10,2025-10-10,Main Office,3'
  ].join('\n');
  
  ensureDirectoryExists(path.dirname(EVENTS_FILE));
  fs.writeFileSync(EVENTS_FILE, content);
}

/**
 * Write test results to markdown file
 */
async function writeResults() {
  let markdown = '# RSVP4 Events Tests Results\n\n';
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
runEventsTests();
