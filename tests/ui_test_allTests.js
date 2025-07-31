/**
 * RSVP4 - Master UI Test Runner
 * 
 * This script runs all available UI tests in sequence and generates a combined report.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

// Configuration
const TEST_FILES = [
//   'ui-test.js',       // Main UI test
  'ui-test-login.js',    // Login test
  'ui-test-signup.js',   // Signup test
  'ui-test-events.js',   // Events test
  'ui-test-subevents.js', // Subevents test
  'ui-test-guests.js',   // Guests test
  'ui-test-rsvp.js',     // RSVP test
  'ui-test-users.js',    // Users test
  'ui-test-roles.js'     // Roles test
];

// Constants
const RESULTS_DIR = path.join(__dirname, 'combined-results');
const SUMMARY_FILE = path.join(RESULTS_DIR, 'all-tests-summary.md');

/**
 * Ensure results directory exists
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Run a single test file
 */
async function runTestFile(testFile) {
  console.log(`\n--- Running ${testFile} ---`);
  const startTime = new Date();
  
  try {
    // Execute the test script
    const { stdout, stderr } = await execPromise(`node ${testFile}`, { 
      cwd: __dirname,
      timeout: 300000 // 5 minute timeout
    });
    
    // Output results
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    const endTime = new Date();
    const durationMs = endTime - startTime;
    
    return {
      file: testFile,
      success: true,
      duration: durationMs,
      output: stdout,
      error: stderr || null
    };
  } catch (error) {
    const endTime = new Date();
    const durationMs = endTime - startTime;
    
    console.error(`Error running ${testFile}:`, error.message);
    
    return {
      file: testFile,
      success: false,
      duration: durationMs,
      output: error.stdout || '',
      error: error.stderr || error.message
    };
  }
}

/**
 * Generate a summary report from all test results
 */
function generateSummaryReport(results) {
  const timestamp = new Date().toISOString();
  const totalDuration = results.reduce((sum, result) => sum + result.duration, 0);
  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;
  
  let markdown = `# RSVP4 UI Tests Combined Report\n\n`;
  markdown += `*Test executed on: ${timestamp}*\n\n`;
  
  markdown += `## Summary\n\n`;
  markdown += `- Total Test Files: ${results.length}\n`;
  markdown += `- Successful: ${successCount}\n`;
  markdown += `- Failed: ${failCount}\n`;
  markdown += `- Total Duration: ${(totalDuration / 1000).toFixed(2)} seconds\n\n`;
  
  markdown += `## Test Results\n\n`;
  markdown += `| Test File | Status | Duration | Error |\n`;
  markdown += `|-----------|--------|----------|-------|\n`;
  
  results.forEach(result => {
    const status = result.success ? '✅ Passed' : '❌ Failed';
    const duration = `${(result.duration / 1000).toFixed(2)}s`;
    const error = result.error ? `${result.error.split('\n')[0]}...` : 'None';
    
    markdown += `| ${result.file} | ${status} | ${duration} | ${error} |\n`;
  });
  
  markdown += `\n## Details\n\n`;
  
  results.forEach(result => {
    markdown += `### ${result.file}\n\n`;
    markdown += `- Status: ${result.success ? 'Passed' : 'Failed'}\n`;
    markdown += `- Duration: ${(result.duration / 1000).toFixed(2)} seconds\n`;
    
    if (result.error) {
      markdown += `- Error: \`\`\`\n${result.error}\n\`\`\`\n`;
    }
    
    // Extract key results from output
    const outputSummary = result.output
      .split('\n')
      .filter(line => 
        line.includes('Test') || 
        line.includes('Error') || 
        line.includes('Success') || 
        line.includes('Failed') ||
        line.includes('Results written to')
      )
      .join('\n');
    
    markdown += `- Output Summary: \`\`\`\n${outputSummary}\n\`\`\`\n\n`;
    
    // Get result file path if available
    const resultFilePath = result.output
      .split('\n')
      .find(line => line.includes('Results written to'));
    
    if (resultFilePath) {
      const filePath = resultFilePath.split('Results written to').pop().trim();
      markdown += `- Detailed Results: [${path.basename(filePath)}](../${path.basename(filePath)})\n`;
    }
    
    markdown += `\n---\n\n`;
  });
  
  return markdown;
}

/**
 * Main function to run all tests and generate reports
 */
async function runAllTests() {
  console.log('Starting RSVP4 UI Test Suite');
  console.log(`Found ${TEST_FILES.length} test files to run`);
  
  const startTime = new Date();
  const results = [];
  
  // Run each test file in sequence
  for (const testFile of TEST_FILES) {
    const result = await runTestFile(testFile);
    results.push(result);
  }
  
  const endTime = new Date();
  const totalDuration = endTime - startTime;
  
  console.log(`\n--- All Tests Completed ---`);
  console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)} seconds`);
  console.log(`Success: ${results.filter(r => r.success).length}/${results.length}`);
  
  // Generate and save summary report
  ensureDirectoryExists(RESULTS_DIR);
  const report = generateSummaryReport(results);
  fs.writeFileSync(SUMMARY_FILE, report);
  
  console.log(`\nCombined test report written to ${SUMMARY_FILE}`);
}

// Run the tests
runAllTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
