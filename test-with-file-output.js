const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

// Function to append to log file
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // Append to log file
  fs.appendFileSync('chatgpt-test-log.txt', logMessage);
  
  // Also log to console
  console.log(message);
}

// Simple function to test the ChatGPT API directly
async function testChatGPTAPI() {
  log('Starting ChatGPT API test...');
  
  try {
    // Log environment variables (without revealing full API key)
    const apiKey = process.env.CHATGPT_API_KEY || '';
    log(`API Key exists: ${!!apiKey}`);
    log(`API Key length: ${apiKey.length}`);
    
    if (apiKey.length > 10) {
      log(`API Key preview: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);
    } else {
      log('API Key is too short or not set properly');
    }
    
    // Simple prompt for testing
    const prompt = "Generate a short list of 3 fun activities to do in Des Moines this weekend.";
    log(`Test prompt: ${prompt}`);
    
    // Make the API call
    log('Calling ChatGPT API...');
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates informative and accurate event listings.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    // Log the response
    log('API Response:');
    log('----------------');
    log(response.data.choices[0].message.content);
    log('----------------');
    
    log('ChatGPT API test completed successfully!');
    log(`Response status: ${response.status}`);
    log(`Model used: ${response.data.model}`);
    log(`Completion tokens: ${response.data.usage.completion_tokens}`);
    log(`Prompt tokens: ${response.data.usage.prompt_tokens}`);
    log(`Total tokens: ${response.data.usage.total_tokens}`);
    
  } catch (error) {
    log('Error testing ChatGPT API:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      log(`Status: ${error.response.status}`);
      log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      // The request was made but no response was received
      log('No response received from API');
    } else {
      // Something happened in setting up the request that triggered an Error
      log(`Error message: ${error.message}`);
    }
    
    log(`Error stack: ${error.stack}`);
  }
  
  log('Test completed. Check chatgpt-test-log.txt for results.');
}

// Clear previous log file if it exists
if (fs.existsSync('chatgpt-test-log.txt')) {
  fs.unlinkSync('chatgpt-test-log.txt');
}

// Run the test
testChatGPTAPI().catch(error => {
  log(`Unhandled promise rejection: ${error}`);
});
