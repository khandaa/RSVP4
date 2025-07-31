const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const USERNAME = 'admin';
const PASSWORD = 'Admin@123';
const TIMEOUT = 10000;
const ISSUES_FILE = path.join(__dirname, '../issues.md');

// Initialize issues tracking
const issues = [];

// Helper function to add an issue
const addIssue = (component, description, severity = 'Medium', steps = '') => {
  issues.push({ component, description, severity, steps });
  console.log(`Issue found: [${component}] ${description} (${severity})`);
};

// Main test function
async function runTests() {
  console.log('Starting UI Tests for RSVP4 Application');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless testing
    defaultViewport: { width: 1280, height: 800 },
    args: ['--window-size=1280,800']
  });
  
  const page = await browser.newPage();
  
  // Setup error handling
  page.on('console', msg => {
    if (msg.type() === 'error') {
      addIssue('Console', `JavaScript error: ${msg.text()}`, 'High');
    }
  });
  
  try {
    // Login tests
    await testLogin(page);
    
    // Dashboard test
    await testDashboard(page);
    
    // Events tests
    await testEvents(page);
    
    // SubEvents tests
    await testSubEvents(page);
    
    // Guests tests
    await testGuests(page);
    
    // RSVP management tests
    await testRSVPManagement(page);
    
    // User management tests
    await testUserManagement(page);
    
    // Settings tests
    await testSettings(page);
    
    console.log('UI Tests completed successfully');
  } catch (error) {
    console.error('Test failed with error:', error);
    addIssue('General', `Test execution error: ${error.message}`, 'Critical', error.stack);
  } finally {
    // Write issues to file
    await writeIssues();
    
    // Close browser
    // await browser.close();
  }
}

// Write issues to markdown file
async function writeIssues() {
  let markdown = '# RSVP4 Application UI Testing Issues\n\n';
  markdown += `*Test executed on: ${new Date().toISOString()}*\n\n`;
  
  if (issues.length === 0) {
    markdown += '**No issues found during testing.**\n';
  } else {
    markdown += `**${issues.length} issues found during testing.**\n\n`;
    
    // Group by severity
    const severities = ['Critical', 'High', 'Medium', 'Low'];
    
    for (const severity of severities) {
      const filteredIssues = issues.filter(issue => issue.severity === severity);
      
      if (filteredIssues.length > 0) {
        markdown += `## ${severity} Severity Issues\n\n`;
        
        filteredIssues.forEach((issue, index) => {
          markdown += `### ${index + 1}. ${issue.component}: ${issue.description}\n\n`;
          
          if (issue.steps) {
            markdown += `**Steps to Reproduce:**\n${issue.steps}\n\n`;
          }
        });
      }
    }
  }
  
  fs.writeFileSync(ISSUES_FILE, markdown);
  console.log(`Issues written to ${ISSUES_FILE}`);
}

// Login tests
async function testLogin(page) {
  console.log('Testing login functionality');
  
  try {
    // Navigate to login page
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Check if login form exists
    const loginFormExists = await page.$('form') !== null;
    if (!loginFormExists) {
      addIssue('Login', 'Login form not found on homepage', 'Critical');
      throw new Error('Login form not found');
    }
    
    // Test invalid login
    await page.type('input[name="username"]', 'wronguser');
    await page.type('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message or redirect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if still on login page (which we should be with invalid credentials)
    const url = await page.url();
    if (!url.includes('/login') && !url.endsWith('/')) {
      addIssue('Login', 'No error shown for invalid credentials', 'High');
    }
    
    // Test valid login
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await page.type('input[name="username"]', USERNAME);
    await page.type('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if redirected to dashboard
    const dashboardLoaded = await page.$('.dashboard-container, .main-content, .app-container') !== null;
    if (!dashboardLoaded) {
      addIssue('Login', 'Failed to redirect to dashboard after successful login', 'Critical');
      throw new Error('Login failed');
    }
    
    console.log('Login tests completed');
  } catch (error) {
    console.error('Login test failed:', error);
    addIssue('Login', `Login test failed: ${error.message}`, 'Critical');
    throw error;
  }
}

// Dashboard tests
async function testDashboard(page) {
  console.log('Testing dashboard functionality');
  
  try {
    // Navigate to dashboard (if not already there)
    if (!await page.url().includes('dashboard')) {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    }
    
    // Check if dashboard elements exist
    const dashboardElements = [
      { selector: '.dashboard-container, .main-content, .app-container', name: 'Dashboard container' },
      { selector: '.sidebar, nav, .navigation', name: 'Navigation sidebar' },
    ];
    
    for (const element of dashboardElements) {
      const exists = await page.$(element.selector) !== null;
      if (!exists) {
        addIssue('Dashboard', `${element.name} not found`, 'High');
      }
    }
    
    // Check navigation links
    const navLinks = await page.$$('a, .nav-link, .sidebar a');
    if (navLinks.length === 0) {
      addIssue('Dashboard', 'No navigation links found in sidebar', 'High');
    }
    
    console.log('Dashboard tests completed');
  } catch (error) {
    console.error('Dashboard test failed:', error);
    addIssue('Dashboard', `Dashboard test failed: ${error.message}`, 'High');
  }
}

// Events tests
async function testEvents(page) {
  console.log('Testing events functionality');
  
  try {
    // Navigate to events page
    await navigateToSection(page, 'events');
    
    // Test event listing
    const eventsExist = await page.$$('.event-item, .event-card, tr, .event-row');
    if (eventsExist.length === 0) {
      addIssue('Events', 'No events displayed in events list', 'Medium');
    }
    
    // Test creating a new event
    await testCreateEvent(page);
    
    // Test editing an event
    await testEditEvent(page);
    
    // Test event details
    await testEventDetails(page);
    
    console.log('Events tests completed');
  } catch (error) {
    console.error('Events test failed:', error);
    addIssue('Events', `Events test failed: ${error.message}`, 'High');
  }
}

// Helper to navigate to a section
async function navigateToSection(page, section) {
  // Try different ways to navigate to section
  try {
    // Try direct navigation first
    await page.goto(`${BASE_URL}/${section}`, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Check if navigation was successful
    await new Promise(resolve => setTimeout(resolve, 1000));
    const url = await page.url();
    if (!url.includes(section)) {
      // If direct navigation failed, try using sidebar
      const sidebarLinks = await page.$$('a, .nav-link, .sidebar a');
      let clicked = false;
      
      for (const link of sidebarLinks) {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), link);
        const href = await page.evaluate(el => el.getAttribute('href'), link);
        
        if (text.includes(section) || (href && href.includes(section))) {
          await link.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          clicked = true;
          break;
        }
      }
      
      if (!clicked) {
        addIssue('Navigation', `Could not navigate to ${section} section`, 'High');
      }
    }
  } catch (error) {
    console.error(`Navigation to ${section} failed:`, error);
    addIssue('Navigation', `Failed to navigate to ${section}: ${error.message}`, 'High');
  }
}

// Test creating a new event
async function testCreateEvent(page) {
  try {
    // Look for "Add Event" or "Create Event" button
    const addEventButton = await page.$('button, a');
    // Check if any button contains the text "Add" or "Create" and "Event"
    const addEventButtonText = addEventButton ? await page.evaluate(el => el.innerText, addEventButton) : '';
    const isAddEventButton = addEventButtonText.includes('Add Event') || addEventButtonText.includes('Create Event');
    
    if (!addEventButton || !isAddEventButton) {
      addIssue('Events', 'Add/Create Event button not found', 'Medium');
      return;
    }
    
    await addEventButton.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Fill out event form - adapt selectors based on actual form
    const formFields = [
      { selector: 'input[name="name"], input[name="eventName"]', value: 'UI Test Event' },
      { selector: 'input[name="date"], input[name="eventDate"]', value: '2025-08-15' },
      { selector: 'textarea[name="description"], input[name="eventDescription"]', value: 'This is a test event created by Puppeteer UI tests' }
    ];
    
    for (const field of formFields) {
      const input = await page.$(field.selector);
      if (input) {
        await input.click({ clickCount: 3 }); // Select all existing text
        await input.type(field.value);
      } else {
        addIssue('Events', `Form field not found: ${field.selector}`, 'Medium');
      }
    }
    
    // Submit form
    const submitButton = await page.$('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
    if (submitButton) {
      await submitButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      addIssue('Events', 'Submit button not found on event form', 'Medium');
    }
    
  } catch (error) {
    console.error('Create event test failed:', error);
    addIssue('Events', `Create event test failed: ${error.message}`, 'Medium');
  }
}

// Test editing an event
async function testEditEvent(page) {
  try {
    // Find an event to edit (ideally the one we just created)
    const editButtons = await page.$$('button, a, .edit-button, [data-testid="edit-button"]');
    // Filter for edit buttons
    const actualEditButtons = [];
    for (const button of editButtons) {
      const text = await page.evaluate(el => el.innerText, button);
      if (text.includes('Edit')) {
        actualEditButtons.push(button);
      }
    }
    
    if (actualEditButtons.length === 0) {
      addIssue('Events', 'No Edit buttons found for events', 'Medium');
      return;
    }
    
    // Click the first edit button
    await actualEditButtons[0].click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Modify a field
    const descriptionField = await page.$('textarea[name="description"], input[name="eventDescription"]');
    if (descriptionField) {
      await descriptionField.click({ clickCount: 3 }); // Select all existing text
      await descriptionField.type('Updated description from UI tests');
    } else {
      addIssue('Events', 'Description field not found when editing event', 'Medium');
    }
    
    // Submit form
    const submitButton = await page.$('button[type="submit"], button');
    // Check if it's a submit/save/update button
    const submitButtonText = submitButton ? await page.evaluate(el => el.innerText, submitButton) : '';
    const isSubmitButton = submitButtonText.includes('Save') || submitButtonText.includes('Update');
    
    if (submitButton && isSubmitButton) {
      await submitButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      addIssue('Events', 'Submit button not found on event edit form', 'Medium');
    }
    
  } catch (error) {
    console.error('Edit event test failed:', error);
    addIssue('Events', `Edit event test failed: ${error.message}`, 'Medium');
  }
}

// Test viewing event details
async function testEventDetails(page) {
  try {
    // Find an event to view
    const eventLinks = await page.$$('a.event-link, .event-title a, .event-name, tr td a');
    
    if (eventLinks.length === 0) {
      addIssue('Events', 'No clickable events found to view details', 'Medium');
      return;
    }
    
    // Click the first event
    await eventLinks[0].click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if details page loaded
    const detailsContainer = await page.$('.event-details, .details-container, .event-view');
    if (!detailsContainer) {
      addIssue('Events', 'Event details page did not load properly', 'Medium');
    }
    
  } catch (error) {
    console.error('Event details test failed:', error);
    addIssue('Events', `Event details test failed: ${error.message}`, 'Medium');
  }
}

// SubEvents tests
async function testSubEvents(page) {
  console.log('Testing subevents functionality');
  
  try {
    // Navigate to subevents section
    await navigateToSection(page, 'subevents');
    
    // Basic checks for subevent listing
    const subeventsExist = await page.$$('.subevent-item, .subevent-card, tr, .subevent-row');
    if (subeventsExist.length === 0) {
      // Try alternate navigation if subevents page doesn't have content
      // Subevents might be nested under events
      await navigateToSection(page, 'events');
      
      // Try to navigate to subevents from an event
      const eventLinks = await page.$$('a.event-link, .event-title a, .event-name, tr td a');
      if (eventLinks.length > 0) {
        await eventLinks[0].click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Look for subevent section in event details
        const subeventSection = await page.$('.subevents, .subevent-list, .schedule');
        if (!subeventSection) {
          addIssue('SubEvents', 'Could not find subevents section in application', 'Medium');
          return;
        }
      }
    }
    
    // Test adding a subevent (if the interface allows)
    await testAddSubEvent(page);
    
    console.log('SubEvents tests completed');
  } catch (error) {
    console.error('SubEvents test failed:', error);
    addIssue('SubEvents', `SubEvents test failed: ${error.message}`, 'High');
  }
}

// Test adding a subevent
async function testAddSubEvent(page) {
  try {
    // Look for "Add SubEvent" button
    const addButton = await page.$('button, a');
    // Check if any button contains the text "Add" or "Create" and "SubEvent"
    const addButtonText = addButton ? await page.evaluate(el => el.innerText, addButton) : '';
    const isAddSubEventButton = addButtonText.includes('Add SubEvent') || addButtonText.includes('Create SubEvent');
    
    if (!addButton || !isAddSubEventButton) {
      addIssue('SubEvents', 'Add SubEvent button not found', 'Medium');
      return;
    }
    
    await addButton.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Fill out subevent form - adapt selectors based on actual form
    const formFields = [
      { selector: 'input[name="name"], input[name="title"]', value: 'UI Test SubEvent' },
      { selector: 'input[name="startTime"], input[name="time"]', value: '13:00' },
      { selector: 'textarea[name="description"]', value: 'This is a test subevent created by Puppeteer UI tests' }
    ];
    
    for (const field of formFields) {
      const input = await page.$(field.selector);
      if (input) {
        await input.click({ clickCount: 3 }); // Select all existing text
        await input.type(field.value);
      } else {
        addIssue('SubEvents', `Form field not found: ${field.selector}`, 'Medium');
      }
    }
    
    // Submit form
    const submitButton = await page.$('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
    if (submitButton) {
      await submitButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      addIssue('SubEvents', 'Submit button not found on subevent form', 'Medium');
    }
    
  } catch (error) {
    console.error('Add subevent test failed:', error);
    addIssue('SubEvents', `Add subevent test failed: ${error.message}`, 'Medium');
  }
}

// Guests tests
async function testGuests(page) {
  console.log('Testing guests functionality');
  
  try {
    // Navigate to guests section
    await navigateToSection(page, 'guests');
    
    // Test guest listing
    const guestsExist = await page.$$('.guest-item, .guest-card, tr, .guest-row');
    if (guestsExist.length === 0) {
      addIssue('Guests', 'No guests displayed in guests list', 'Medium');
    }
    
    // Test adding a guest
    await testAddGuest(page);
    
    console.log('Guests tests completed');
  } catch (error) {
    console.error('Guests test failed:', error);
    addIssue('Guests', `Guests test failed: ${error.message}`, 'High');
  }
}

// Test adding a guest
async function testAddGuest(page) {
  try {
    // Look for "Add Guest" button
    const addButton = await page.$('button, a');
    // Check if any button contains the text "Add Guest"
    const addButtonText = addButton ? await page.evaluate(el => el.innerText, addButton) : '';
    const isAddGuestButton = addButtonText.includes('Add Guest');
    
    if (!addButton || !isAddGuestButton) {
      addIssue('Guests', 'Add Guest button not found', 'Medium');
      return;
    }
    
    await addButton.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Fill out guest form - adapt selectors based on actual form
    const formFields = [
      { selector: 'input[name="name"], input[name="guestName"]', value: 'Test Guest' },
      { selector: 'input[name="email"], input[type="email"]', value: 'test.guest@example.com' },
      { selector: 'input[name="phone"], input[type="tel"]', value: '5551234567' }
    ];
    
    for (const field of formFields) {
      const input = await page.$(field.selector);
      if (input) {
        await input.click({ clickCount: 3 }); // Select all existing text
        await input.type(field.value);
      } else {
        addIssue('Guests', `Form field not found: ${field.selector}`, 'Medium');
      }
    }
    
    // Submit form
    const submitButton = await page.$('button[type="submit"], button');
    // Check if it's a submit/save/add button
    const submitButtonText = submitButton ? await page.evaluate(el => el.innerText, submitButton) : '';
    const isSubmitButton = submitButtonText.includes('Save') || submitButtonText.includes('Add');
    
    if (submitButton && isSubmitButton) {
      await submitButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      addIssue('Guests', 'Submit button not found on guest form', 'Medium');
    }
    
  } catch (error) {
    console.error('Add guest test failed:', error);
    addIssue('Guests', `Add guest test failed: ${error.message}`, 'Medium');
  }
}

// RSVP Management tests
async function testRSVPManagement(page) {
  console.log('Testing RSVP management functionality');
  
  try {
    // Navigate to RSVP section
    await navigateToSection(page, 'rsvp');
    
    // Check for RSVP list
    const rsvpListExists = await page.$('.rsvp-list, .rsvp-container, .rsvp-management') !== null;
    if (!rsvpListExists) {
      addIssue('RSVP', 'RSVP management section not found', 'Medium');
      return;
    }
    
    // Test RSVP status update if possible
    const statusButtons = await page.$$('.status-button, .update-status, select[name="status"]');
    if (statusButtons.length > 0) {
      await statusButtons[0].click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // If it's a dropdown, select an option
      const dropdownOptions = await page.$$('option');
      if (dropdownOptions.length > 0) {
        await dropdownOptions[1].click(); // Select the second option
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      addIssue('RSVP', 'No RSVP status update controls found', 'Low');
    }
    
    console.log('RSVP management tests completed');
  } catch (error) {
    console.error('RSVP management test failed:', error);
    addIssue('RSVP', `RSVP management test failed: ${error.message}`, 'Medium');
  }
}

// User Management tests
async function testUserManagement(page) {
  console.log('Testing user management functionality');
  
  try {
    // Navigate to user management section
    await navigateToSection(page, 'users');
    
    // Check for users list
    const usersListExists = await page.$('.users-list, .user-container, .user-management, table') !== null;
    if (!usersListExists) {
      addIssue('Users', 'User management section not found', 'Medium');
      return;
    }
    
    // Test user search if available
    const searchField = await page.$('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]');
    if (searchField) {
      await searchField.type('admin');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if search results updated
      const adminUserExists = await page.$$eval('tr, .user-item', elements => 
        elements.some(el => el.textContent.toLowerCase().includes('admin'))
      );
      
      if (!adminUserExists) {
        addIssue('Users', 'User search functionality not working properly', 'Low');
      }
    }
    
    console.log('User management tests completed');
  } catch (error) {
    console.error('User management test failed:', error);
    addIssue('Users', `User management test failed: ${error.message}`, 'Medium');
  }
}

// Settings tests
async function testSettings(page) {
  console.log('Testing settings functionality');
  
  try {
    // Navigate to settings section
    await navigateToSection(page, 'settings');
    
    // Check if settings form exists
    const settingsFormExists = await page.$('form, .settings-container, .settings-panel') !== null;
    if (!settingsFormExists) {
      addIssue('Settings', 'Settings section not found', 'Low');
      return;
    }
    
    // Test changing a simple setting if possible
    const inputFields = await page.$$('input[type="text"], input[type="email"], textarea');
    if (inputFields.length > 0) {
      const testField = inputFields[0];
      await testField.click({ clickCount: 3 });
      await testField.type('Test setting value');
      
      // Look for save button
      const saveButton = await page.$('button[type="submit"], button');
      // Check if it's a save button
      const saveButtonText = saveButton ? await page.evaluate(el => el.innerText, saveButton) : '';
      const isSaveButton = saveButtonText.includes('Save') || saveButtonText.includes('Submit');
      
      if (saveButton && isSaveButton) {
        await saveButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        addIssue('Settings', 'Save button not found in settings', 'Low');
      }
    }
    
    console.log('Settings tests completed');
  } catch (error) {
    console.error('Settings test failed:', error);
    addIssue('Settings', `Settings test failed: ${error.message}`, 'Medium');
  }
}

// Run the tests
runTests();
