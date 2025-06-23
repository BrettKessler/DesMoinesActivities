const fs = require('fs');

// Create a simple log file
fs.writeFileSync('test-output.txt', 'This is a test file.\n');
fs.appendFileSync('test-output.txt', `Current time: ${new Date().toISOString()}\n`);

// Check if .env file exists and read it
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  fs.appendFileSync('test-output.txt', 'Environment file exists.\n');
  
  // Check for API key in .env (without revealing the full key)
  if (envContent.includes('CHATGPT_API_KEY')) {
    fs.appendFileSync('test-output.txt', 'CHATGPT_API_KEY found in .env file.\n');
    
    // Extract the API key
    const match = envContent.match(/CHATGPT_API_KEY=(.+)/);
    if (match && match[1]) {
      const apiKey = match[1].trim();
      fs.appendFileSync('test-output.txt', `API key length: ${apiKey.length}\n`);
      
      if (apiKey.length > 10) {
        const preview = `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`;
        fs.appendFileSync('test-output.txt', `API key preview: ${preview}\n`);
      } else {
        fs.appendFileSync('test-output.txt', 'API key is too short or not properly formatted.\n');
      }
    } else {
      fs.appendFileSync('test-output.txt', 'Could not extract API key value.\n');
    }
  } else {
    fs.appendFileSync('test-output.txt', 'CHATGPT_API_KEY not found in .env file.\n');
  }
} else {
  fs.appendFileSync('test-output.txt', '.env file does not exist.\n');
}

// List files in the current directory
try {
  const files = fs.readdirSync('.');
  fs.appendFileSync('test-output.txt', '\nFiles in current directory:\n');
  files.forEach(file => {
    fs.appendFileSync('test-output.txt', `- ${file}\n`);
  });
} catch (error) {
  fs.appendFileSync('test-output.txt', `Error listing files: ${error.message}\n`);
}

console.log('Test completed. Check test-output.txt for results.');
