require('dotenv').config();
const chatgptService = require('./server/services/chatgpt');

// Add this to see if there are any issues with the environment
console.log('Environment check:');
console.log('- CHATGPT_API_KEY exists:', !!process.env.CHATGPT_API_KEY);
console.log('- CHATGPT_API_KEY length:', process.env.CHATGPT_API_KEY ? process.env.CHATGPT_API_KEY.length : 0);
console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('- NODE_ENV:', process.env.NODE_ENV);

async function testChatGPTAPI() {
  console.log('Testing ChatGPT API connection...');
  
  try {
    // Get the current week's date range
    const { startDate, endDate } = chatgptService.getCurrentWeekDateRange();
    console.log(`Date range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
    
    // Generate the prompt
    const prompt = chatgptService.generatePrompt(startDate, endDate);
    console.log('\nGenerated prompt:');
    console.log('----------------');
    console.log(prompt);
    console.log('----------------\n');
    
    // Call ChatGPT API
    console.log('Calling ChatGPT API (this may take a moment)...');
    const response = await chatgptService.callChatGPT(prompt);
    
    // Log a preview of the response
    console.log('\nAPI Response Preview (first 300 characters):');
    console.log('----------------');
    console.log(response.substring(0, 300) + '...');
    console.log('----------------\n');
    
    // Test parsing the response
    console.log('Testing response parsing...');
    const parsedData = chatgptService.parseResponse(response);
    
    // Log the parsed data structure
    console.log('\nParsed Data Structure:');
    console.log('----------------');
    console.log(`Categories: ${parsedData.categories.length}`);
    
    parsedData.categories.forEach(category => {
      console.log(`- ${category.name}: ${category.events.length} events`);
    });
    
    console.log(`Planning Tips: ${parsedData.planningTips.length}`);
    console.log('----------------\n');
    
    console.log('✅ ChatGPT API test completed successfully!');
  } catch (error) {
    console.error('❌ Error testing ChatGPT API:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('API Error Response:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error details:', error.message);
    }
    
    // Log the stack trace
    console.error('Stack trace:', error.stack);
  }
}

// Run the test and handle any unhandled promise rejections
testChatGPTAPI()
  .catch(error => {
    console.error('Unhandled promise rejection:', error);
    process.exit(1);
  });

// Listen for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
