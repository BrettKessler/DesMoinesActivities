// Simple script to check environment and dependencies
console.log('Starting environment check...');

// Check if dotenv is installed
try {
  require('dotenv');
  console.log('✅ dotenv module is installed');
} catch (error) {
  console.error('❌ dotenv module is not installed:', error.message);
}

// Load environment variables
try {
  require('dotenv').config();
  console.log('✅ dotenv.config() executed');
} catch (error) {
  console.error('❌ Error loading environment variables:', error.message);
}

// Check environment variables
console.log('\nEnvironment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('- PORT:', process.env.PORT || 'not set');
console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('- CHATGPT_API_KEY exists:', !!process.env.CHATGPT_API_KEY);

if (process.env.CHATGPT_API_KEY) {
  const apiKey = process.env.CHATGPT_API_KEY;
  console.log('- CHATGPT_API_KEY length:', apiKey.length);
  console.log('- CHATGPT_API_KEY preview:', apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 4));
}

// Check if axios is installed
try {
  require('axios');
  console.log('\n✅ axios module is installed');
} catch (error) {
  console.error('\n❌ axios module is not installed:', error.message);
}

// Check if mongoose is installed
try {
  require('mongoose');
  console.log('✅ mongoose module is installed');
} catch (error) {
  console.error('❌ mongoose module is not installed:', error.message);
}

console.log('\nEnvironment check completed.');
