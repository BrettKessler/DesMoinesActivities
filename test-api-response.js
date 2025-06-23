require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Function to test the API response
async function testAPIResponse() {
  console.log('Testing API response...');
  let log = 'Testing API response...\n';
  
  try {
    // Test with useLiveData=true
    console.log('\nTesting with useLiveData=true:');
    log += '\nTesting with useLiveData=true:\n';
    
    const liveResponse = await axios.get('http://localhost:3000/api/activities?useLiveData=true');
    
    console.log('Status:', liveResponse.status);
    log += `Status: ${liveResponse.status}\n`;
    
    console.log('Source:', liveResponse.data.source);
    log += `Source: ${liveResponse.data.source}\n`;
    
    // Check if the response has the expected structure
    const data = liveResponse.data.data;
    
    console.log('\nResponse structure:');
    log += '\nResponse structure:\n';
    
    // Log the top-level properties
    const properties = Object.keys(data);
    console.log('Properties:', properties.join(', '));
    log += `Properties: ${properties.join(', ')}\n`;
    
    // Check for weatherForecast
    if (data.weatherForecast) {
      console.log('\nWeather Forecast exists:', true);
      console.log('Weather Forecast length:', data.weatherForecast.length);
      
      log += '\nWeather Forecast exists: true\n';
      log += `Weather Forecast length: ${data.weatherForecast.length}\n`;
      
      // Log the first day's forecast
      if (data.weatherForecast.length > 0) {
        const firstDay = data.weatherForecast[0];
        console.log('\nFirst day forecast:');
        log += '\nFirst day forecast:\n';
        
        console.log('- Date:', firstDay.date);
        log += `- Date: ${firstDay.date}\n`;
        
        console.log('- Temperature:', `${firstDay.temp.min}°F - ${firstDay.temp.max}°F`);
        log += `- Temperature: ${firstDay.temp.min}°F - ${firstDay.temp.max}°F\n`;
        
        console.log('- Weather:', firstDay.weather);
        log += `- Weather: ${firstDay.weather}\n`;
        
        console.log('- Description:', firstDay.description);
        log += `- Description: ${firstDay.description}\n`;
        
        console.log('- Precipitation:', firstDay.precipitation + '%');
        log += `- Precipitation: ${firstDay.precipitation}%\n`;
      }
    } else {
      console.log('\nWeather Forecast exists:', false);
      log += '\nWeather Forecast exists: false\n';
    }
    
    // Check for categories
    if (data.categories) {
      console.log('\nCategories exist:', true);
      console.log('Categories length:', data.categories.length);
      
      log += '\nCategories exist: true\n';
      log += `Categories length: ${data.categories.length}\n`;
    } else {
      console.log('\nCategories exist:', false);
      log += '\nCategories exist: false\n';
    }
    
    // Check for planningTips
    if (data.planningTips) {
      console.log('\nPlanning Tips exist:', true);
      console.log('Planning Tips length:', data.planningTips.length);
      
      log += '\nPlanning Tips exist: true\n';
      log += `Planning Tips length: ${data.planningTips.length}\n`;
    } else {
      console.log('\nPlanning Tips exist:', false);
      log += '\nPlanning Tips exist: false\n';
    }
    
    console.log('\n✅ API test completed successfully!');
    log += '\n✅ API test completed successfully!\n';
    
    // Write the log to a file
    fs.writeFileSync('api-response-test.log', log);
    console.log('\nLog written to api-response-test.log');
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    log += `\n❌ Error testing API: ${error.message}\n`;
    
    if (error.response) {
      console.error('API Error Response:', error.response.data);
      console.error('Status:', error.response.status);
      
      log += `API Error Response: ${JSON.stringify(error.response.data)}\n`;
      log += `Status: ${error.response.status}\n`;
    }
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
      log += `Stack trace: ${error.stack}\n`;
    }
    
    // Write the error log to a file
    fs.writeFileSync('api-response-test.log', log);
    console.log('\nError log written to api-response-test.log');
  }
}

// Run the test
testAPIResponse()
  .catch(error => {
    console.error('Unhandled promise rejection:', error);
    process.exit(1);
  });
