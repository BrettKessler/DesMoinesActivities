const fs = require('fs');
const https = require('https');

// Create a log file
const logFile = 'api-test-log.txt';
fs.writeFileSync(logFile, 'API Test Log\n');
fs.appendFileSync(logFile, `Test started at: ${new Date().toISOString()}\n\n`);

// Load environment variables
require('dotenv').config();
const apiKey = process.env.CHATGPT_API_KEY || '';

// Log API key info
fs.appendFileSync(logFile, `API Key exists: ${!!apiKey}\n`);
fs.appendFileSync(logFile, `API Key length: ${apiKey.length}\n`);

// Simple test request
const data = JSON.stringify({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Say hello world' }
  ],
  max_tokens: 10
});

const options = {
  hostname: 'api.openai.com',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'Content-Length': data.length
  }
};

// Make the request
fs.appendFileSync(logFile, 'Sending request to OpenAI API...\n');

const req = https.request(options, (res) => {
  fs.appendFileSync(logFile, `Status Code: ${res.statusCode}\n`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    fs.appendFileSync(logFile, 'Response received.\n\n');
    fs.appendFileSync(logFile, 'Raw response:\n');
    fs.appendFileSync(logFile, responseData);
    fs.appendFileSync(logFile, '\n\nTest completed.\n');
    
    // Force the process to exit after writing the response
    setTimeout(() => {
      process.exit(0);
    }, 100);
  });
});

req.on('error', (error) => {
  fs.appendFileSync(logFile, `Error: ${error.message}\n`);
  fs.appendFileSync(logFile, 'Test failed.\n');
  
  // Force the process to exit after writing the error
  setTimeout(() => {
    process.exit(1);
  }, 100);
});

// Send the request
req.write(data);
req.end();

fs.appendFileSync(logFile, 'Request sent. Waiting for response...\n');
