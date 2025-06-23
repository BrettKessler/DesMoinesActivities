require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function testChatGPTAPI() {
  console.log('Testing ChatGPT API connection...');
  let log = 'Testing ChatGPT API connection...\n';
  
  try {
    // Get the API key from environment variables
    const apiKey = process.env.CHATGPT_API_KEY;
    
    if (!apiKey) {
      throw new Error('CHATGPT_API_KEY is not defined in the .env file');
    }
    
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey.length);
    
    log += `API Key exists: ${!!apiKey}\n`;
    log += `API Key length: ${apiKey.length}\n`;
    
    // Simple test prompt
    const prompt = 'Say hello and confirm that the API connection is working.';
    
    console.log('\nSending test prompt to ChatGPT API...');
    log += '\nSending test prompt to ChatGPT API...\n';
    
    // Make the API request
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    // Log the response
    console.log('\nAPI Response:');
    console.log('----------------');
    console.log(response.data.choices[0].message.content);
    console.log('----------------');
    
    log += '\nAPI Response:\n';
    log += '----------------\n';
    log += response.data.choices[0].message.content + '\n';
    log += '----------------\n';
    
    console.log('\n✅ ChatGPT API test completed successfully!');
    log += '\n✅ ChatGPT API test completed successfully!\n';
    
    // Write the log to a file
    fs.writeFileSync('chatgpt-api-test.log', log);
    console.log('\nLog written to chatgpt-api-test.log');
  } catch (error) {
    console.error('❌ Error testing ChatGPT API:');
    log += '❌ Error testing ChatGPT API:\n';
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      console.error('Status:', error.response.status);
      
      log += `API Error Response: ${JSON.stringify(error.response.data)}\n`;
      log += `Status: ${error.response.status}\n`;
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      log += 'No response received\n';
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error details:', error.message);
      log += `Error details: ${error.message}\n`;
    }
    
    console.error('Stack trace:', error.stack);
    log += `Stack trace: ${error.stack}\n`;
    
    // Write the error log to a file
    fs.writeFileSync('chatgpt-api-test.log', log);
    console.log('\nError log written to chatgpt-api-test.log');
  }
}

// Run the test
testChatGPTAPI()
  .catch(error => {
    console.error('Unhandled promise rejection:', error);
    process.exit(1);
  });
