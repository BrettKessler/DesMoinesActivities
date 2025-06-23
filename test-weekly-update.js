/**
 * Test script for the weekly update job
 * This script simulates running the weekly update job without actually saving to the database
 */
require('dotenv').config();
const fs = require('fs');
const chatgptService = require('./server/services/chatgpt');

// Create a log file
const logFile = 'weekly-update-test.txt';
fs.writeFileSync(logFile, 'Weekly Update Job Test\n');
fs.appendFileSync(logFile, `Test started at: ${new Date().toISOString()}\n\n`);

// Mock the Activities model to prevent actual database operations
const mockActivities = function(data) {
  this.weekStartDate = data.weekStartDate;
  this.weekEndDate = data.weekEndDate;
  this.categories = data.categories;
  this.planningTips = data.planningTips;
  this.rawResponse = data.rawResponse;
  
  // Mock the save method
  this.save = async function() {
    fs.appendFileSync(logFile, 'Mock save called - would save to database in production\n');
    return this;
  };
};

// Override the actual Activities model in the chatgpt service
chatgptService.Activities = mockActivities;

async function testWeeklyUpdateJob() {
  fs.appendFileSync(logFile, 'Starting weekly update job test...\n\n');
  
  try {
    // Log environment info
    const apiKey = process.env.CHATGPT_API_KEY || '';
    fs.appendFileSync(logFile, `API Key exists: ${!!apiKey}\n`);
    fs.appendFileSync(logFile, `API Key length: ${apiKey.length}\n\n`);
    
    // Get the current week's date range
    const { startDate, endDate } = chatgptService.getCurrentWeekDateRange();
    const startDateStr = startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const endDateStr = endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    
    fs.appendFileSync(logFile, `Current week: ${startDateStr} to ${endDateStr}\n\n`);
    
    // Call the fetchAndStoreActivities method
    fs.appendFileSync(logFile, 'Calling fetchAndStoreActivities method...\n');
    const activities = await chatgptService.fetchAndStoreActivities();
    
    // Log the results
    fs.appendFileSync(logFile, '\nResults:\n');
    fs.appendFileSync(logFile, '----------------\n');
    fs.appendFileSync(logFile, `Week: ${activities.weekStartDate.toLocaleDateString()} to ${activities.weekEndDate.toLocaleDateString()}\n`);
    fs.appendFileSync(logFile, `Categories: ${activities.categories.length}\n`);
    
    let totalEvents = 0;
    activities.categories.forEach(category => {
      const eventCount = category.events.length;
      totalEvents += eventCount;
      fs.appendFileSync(logFile, `- ${category.name}: ${eventCount} events\n`);
    });
    
    fs.appendFileSync(logFile, `Total events: ${totalEvents}\n`);
    fs.appendFileSync(logFile, `Planning tips: ${activities.planningTips.length}\n`);
    fs.appendFileSync(logFile, '----------------\n\n');
    
    // Save a sample of the raw response
    const responsePreview = activities.rawResponse.substring(0, 500) + '...';
    fs.appendFileSync(logFile, 'Raw Response Preview:\n');
    fs.appendFileSync(logFile, '----------------\n');
    fs.appendFileSync(logFile, responsePreview + '\n');
    fs.appendFileSync(logFile, '----------------\n\n');
    
    fs.appendFileSync(logFile, '✅ Weekly update job test completed successfully!\n');
    
    return 'Test completed successfully. Check weekly-update-test.txt for results.';
  } catch (error) {
    fs.appendFileSync(logFile, '❌ Error testing weekly update job:\n');
    fs.appendFileSync(logFile, error.stack || error.message || error.toString());
    fs.appendFileSync(logFile, '\n\n');
    
    return `Test failed with error: ${error.message}. Check weekly-update-test.txt for details.`;
  }
}

// Run the test
testWeeklyUpdateJob()
  .then(result => {
    console.log(result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
