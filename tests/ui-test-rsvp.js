const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000;
const RSVP_FILE = path.join(__dirname, 'rsvp-data.csv');
const RESULTS_FILE = path.join(__dirname, 'rsvp-test-results.md');

// Results tracking
const results = [];

/**
 * Main test function to test RSVP functionality
 */
async function runRSVPTests() {
  console.log('Starting RSVP UI Tests for RSVP4 Application');
  
  // Create sample RSVP data file if it doesn't exist
  if (!fs.existsSync(RSVP_FILE)) {
    console.log('RSVP data file not found. Creating sample file...');
    createSampleRSVPFile();
    console.log(`Created sample RSVP file at ${RSVP_FILE}. Please update with real data before running tests again.`);
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
    
    // Run all RSVP tests
    await testRSVPDashboard(page);
    await testRSVPForm(page);
    await testRSVPBulkManagement(page);
    
  } catch (error) {
    console.error('Test execution error:', error);
    results.push({
      feature: 'RSVP',
      test: 'General',
      status: 'Error',
      message: `Test execution error: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Write results to file
    await writeResults();
    
    console.log('RSVP tests completed.');
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
    const screenshotPath = path.join(__dirname, 'screenshots', 'rsvp-login-before.png');
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
    const afterScreenshotPath = path.join(__dirname, 'screenshots', 'rsvp-login-after.png');
    await page.screenshot({ path: afterScreenshotPath });
    
    results.push({
      feature: 'RSVP',
      test: 'Login',
      status: 'Success',
      message: 'Successfully logged in as admin',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    results.push({
      feature: 'RSVP',
      test: 'Login',
      status: 'Failed',
      message: `Login failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Test RSVP dashboard
 */
async function testRSVPDashboard(page) {
  console.log('Testing RSVP Dashboard...');
  
  try {
    // Navigate to RSVP dashboard
    await page.goto(`${BASE_URL}/rsvps/dashboard`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, 'screenshots', 'rsvp-dashboard.png');
    await page.screenshot({ path: screenshotPath });
    
    // Check if dashboard is displayed
    const dashboardContent = await page.$('.rsvp-dashboard, .dashboard-container, [data-testid="rsvp-dashboard"]');
    
    if (!dashboardContent) {
      throw new Error('RSVP dashboard not displayed correctly');
    }
    
    // Check for stats or charts
    const statsElements = await page.$$('.stats, .chart, .metric, .dashboard-card');
    
    if (statsElements.length === 0) {
      console.log('Warning: No stats or charts found on RSVP dashboard');
    }
    
    results.push({
      feature: 'RSVP',
      test: 'Dashboard',
      status: 'Success',
      message: 'RSVP dashboard loaded successfully',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('RSVP Dashboard test failed:', error);
    results.push({
      feature: 'RSVP',
      test: 'Dashboard',
      status: 'Failed',
      message: `RSVP dashboard test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test RSVP form
 */
async function testRSVPForm(page) {
  console.log('Testing RSVP Form...');
  
  try {
    const rsvpData = await readRSVPFromCSV();
    
    // Navigate to RSVP form
    await page.goto(`${BASE_URL}/rsvps/form`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot before filling form
    const beforeScreenshot = path.join(__dirname, 'screenshots', 'rsvp-form-before.png');
    await page.screenshot({ path: beforeScreenshot });
    
    // Check if form is displayed
    const rsvpForm = await page.$('form, .rsvp-form, [data-testid="rsvp-form"]');
    
    if (!rsvpForm) {
      throw new Error('RSVP form not displayed correctly');
    }
    
    // Fill form with test data if available
    if (rsvpData.length > 0) {
      const testRSVP = rsvpData[0];
      
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
      
      // Fill in guest info if required
      if (await page.$('input[name="guestName"], input[name="name"]')) {
        await page.type('input[name="guestName"], input[name="name"]', testRSVP.guestName);
      }
      
      if (await page.$('input[name="email"]')) {
        await page.type('input[name="email"]', testRSVP.email);
      }
      
      // Set RSVP status
      if (await page.$('select[name="status"]')) {
        await page.select('select[name="status"]', testRSVP.status);
      } else {
        // Try finding status radio buttons
        const statusRadio = await page.$(`input[type="radio"][value="${testRSVP.status}"]`);
        if (statusRadio) {
          await statusRadio.click();
        }
      }
      
      // Add additional notes if field exists
      if (await page.$('textarea[name="notes"], textarea[name="comments"]')) {
        await page.type('textarea[name="notes"], textarea[name="comments"]', testRSVP.notes);
      }
      
      // Take screenshot after filling form
      const afterScreenshot = path.join(__dirname, 'screenshots', 'rsvp-form-after.png');
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
      
      // Check if we have a success message
      const hasSuccessMessage = await page.$('.success-message, .alert-success, [role="alert"]') !== null;
      
      if (hasSuccessMessage) {
        results.push({
          feature: 'RSVP',
          test: 'Form Submission',
          status: 'Success',
          message: `Successfully submitted RSVP form for ${testRSVP.guestName}`,
          timestamp: new Date().toISOString()
        });
      } else {
        // Check for error messages
        const errorMessage = await page.evaluate(() => {
          const errorEl = document.querySelector('.error-message, .alert-danger, [role="alert"]');
          return errorEl ? errorEl.innerText : null;
        });
        
        if (errorMessage) {
          console.log('RSVP form submission resulted in error:', errorMessage);
          results.push({
            feature: 'RSVP',
            test: 'Form Submission',
            status: 'Failed',
            message: `RSVP form submission failed: ${errorMessage}`,
            timestamp: new Date().toISOString()
          });
        } else {
          console.log('No success or error message found after RSVP form submission');
          results.push({
            feature: 'RSVP',
            test: 'Form Submission',
            status: 'Unknown',
            message: 'No success or error message found after form submission',
            timestamp: new Date().toISOString()
          });
        }
      }
    } else {
      console.log('No RSVP data found in CSV. Skipping form submission test.');
      results.push({
        feature: 'RSVP',
        test: 'Form',
        status: 'Success',
        message: 'RSVP form loaded successfully, but no test data available for submission',
        timestamp: new Date().toISOString()
      });
    }
    
    return true;
  } catch (error) {
    console.error('RSVP Form test failed:', error);
    results.push({
      feature: 'RSVP',
      test: 'Form',
      status: 'Failed',
      message: `RSVP form test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Test RSVP bulk management
 */
async function testRSVPBulkManagement(page) {
  console.log('Testing RSVP Bulk Management...');
  
  try {
    // Navigate to RSVP bulk management
    await page.goto(`${BASE_URL}/rsvps/bulk`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, 'screenshots', 'rsvp-bulk.png');
    await page.screenshot({ path: screenshotPath });
    
    // Check if bulk management interface exists
    const bulkInterface = await page.$('.rsvp-bulk, .bulk-management, [data-testid="rsvp-bulk"]');
    
    if (!bulkInterface) {
      throw new Error('RSVP bulk management interface not found');
    }
    
    // Check for file upload input
    const fileInput = await page.$('input[type="file"]');
    
    if (!fileInput) {
      console.log('Warning: File upload input not found on bulk management page');
    }
    
    results.push({
      feature: 'RSVP',
      test: 'Bulk Management',
      status: 'Success',
      message: 'RSVP bulk management page loaded successfully',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('RSVP Bulk Management test failed:', error);
    results.push({
      feature: 'RSVP',
      test: 'Bulk Management',
      status: 'Failed',
      message: `RSVP bulk management test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Read RSVP data from CSV file
 */
async function readRSVPFromCSV() {
  return new Promise((resolve, reject) => {
    const rsvps = [];
    
    if (!fs.existsSync(RSVP_FILE)) {
      return resolve([]);
    }
    
    fs.createReadStream(RSVP_FILE)
      .pipe(csv())
      .on('data', (row) => {
        if (row.guestName || row.name || row.guest) {
          rsvps.push({
            guestName: row.guestName || row.name || row.guest,
            email: row.email || `${(row.guestName || row.name || row.guest).replace(/\s+/g, '.').toLowerCase()}@example.com`,
            status: row.status || 'attending',
            notes: row.notes || row.comments || 'Test RSVP response',
            eventId: row.eventId || '1'
          });
        }
      })
      .on('end', () => {
        resolve(rsvps);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Create sample RSVP CSV file
 */
function createSampleRSVPFile() {
  const content = [
    'guestName,email,status,notes,eventId',
    'John Smith,john.smith@example.com,attending,Looking forward to it!,1',
    'Jane Doe,jane.doe@example.com,not_attending,Sorry I cannot make it,1',
    'Bob Johnson,bob.johnson@example.com,maybe,Will try my best to attend,1'
  ].join('\n');
  
  ensureDirectoryExists(path.dirname(RSVP_FILE));
  fs.writeFileSync(RSVP_FILE, content);
}

/**
 * Write test results to markdown file
 */
async function writeResults() {
  let markdown = '# RSVP4 RSVP Tests Results\n\n';
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
runRSVPTests();
