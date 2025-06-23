require('dotenv').config();
const fs = require('fs');
const chatgptService = require('./server/services/chatgpt');

// Create a log file
const logFile = 'activities-generation-test.txt';
fs.writeFileSync(logFile, 'Des Moines Activities Generation Test\n');
fs.appendFileSync(logFile, `Test started at: ${new Date().toISOString()}\n\n`);

async function testActivitiesGeneration() {
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
    
    // Generate the prompt
    const prompt = chatgptService.generatePrompt(startDate, endDate);
    fs.appendFileSync(logFile, 'Generated Prompt:\n');
    fs.appendFileSync(logFile, '----------------\n');
    fs.appendFileSync(logFile, prompt + '\n');
    fs.appendFileSync(logFile, '----------------\n\n');
    
    // Call ChatGPT API
    fs.appendFileSync(logFile, 'Calling ChatGPT API (this may take a moment)...\n');
    const response = await chatgptService.callChatGPT(prompt);
    
    // Log a preview of the response
    fs.appendFileSync(logFile, '\nAPI Response Preview (first 500 characters):\n');
    fs.appendFileSync(logFile, '----------------\n');
    fs.appendFileSync(logFile, response.substring(0, 500) + '...\n');
    fs.appendFileSync(logFile, '----------------\n\n');
    
    // Test parsing the response
    fs.appendFileSync(logFile, 'Testing response parsing...\n');
    const parsedData = chatgptService.parseResponse(response);
    
    // Log the parsed data structure
    fs.appendFileSync(logFile, '\nParsed Data Structure:\n');
    fs.appendFileSync(logFile, '----------------\n');
    fs.appendFileSync(logFile, `Categories: ${parsedData.categories.length}\n`);
    
    parsedData.categories.forEach(category => {
      fs.appendFileSync(logFile, `- ${category.name}: ${category.events.length} events\n`);
      
      // Log the first event in each category as an example
      if (category.events.length > 0) {
        const firstEvent = category.events[0];
        fs.appendFileSync(logFile, `  Example event: ${firstEvent.name}\n`);
        fs.appendFileSync(logFile, `    Date: ${firstEvent.date}\n`);
        fs.appendFileSync(logFile, `    Venue: ${firstEvent.venue}\n`);
        fs.appendFileSync(logFile, `    Description: ${firstEvent.description}\n`);
      }
    });
    
    fs.appendFileSync(logFile, `Planning Tips: ${parsedData.planningTips.length}\n`);
    if (parsedData.planningTips.length > 0) {
      fs.appendFileSync(logFile, '  Example tip: ' + parsedData.planningTips[0] + '\n');
    }
    fs.appendFileSync(logFile, '----------------\n\n');
    
    fs.appendFileSync(logFile, '✅ Activities generation test completed successfully!\n');
    
    return 'Test completed successfully. Check activities-generation-test.txt for results.';
  } catch (error) {
    fs.appendFileSync(logFile, '❌ Error testing activities generation:\n');
    fs.appendFileSync(logFile, error.stack || error.message || error.toString());
    fs.appendFileSync(logFile, '\n\n');
    
    return `Test failed with error: ${error.message}. Check activities-generation-test.txt for details.`;
  }
}

// Run the test
testActivitiesGeneration()
  .then(result => {
    console.log(result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
