require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

// Function to test the activities API endpoint
async function testActivitiesAPI() {
  console.log('Testing activities API endpoint...');
  let log = 'Testing activities API endpoint...\n';
  
  try {
    // Test with useLiveData=true
    console.log('\nTesting with useLiveData=true:');
    log += '\nTesting with useLiveData=true:\n';
    
    const liveResponse = await axios.get('http://localhost:3000/api/activities?useLiveData=true');
    
    console.log('Status:', liveResponse.status);
    log += `Status: ${liveResponse.status}\n`;
    
    console.log('Source:', liveResponse.data.source);
    log += `Source: ${liveResponse.data.source}\n`;
    
    // Log the response structure
    console.log('\nResponse structure:');
    log += '\nResponse structure:\n';
    
    // Function to safely stringify objects with circular references
    const safeStringify = (obj, indent = 2) => {
      const cache = new Set();
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (cache.has(value)) {
            return '[Circular]';
          }
          cache.add(value);
        }
        return value;
      }, indent);
    };
    
    const responseStructure = safeStringify(liveResponse.data);
    console.log(responseStructure);
    log += `${responseStructure}\n`;
    
    // Check if weatherForecast exists and has data
    if (liveResponse.data.data.weatherForecast) {
      console.log('Weather Forecast exists:', !!liveResponse.data.data.weatherForecast);
      log += `Weather Forecast exists: ${!!liveResponse.data.data.weatherForecast}\n`;
      
      console.log('Weather Forecast length:', liveResponse.data.data.weatherForecast.length);
      log += `Weather Forecast length: ${liveResponse.data.data.weatherForecast.length}\n`;
      
      // Log the first day's forecast
      if (liveResponse.data.data.weatherForecast.length > 0) {
        const firstDay = liveResponse.data.data.weatherForecast[0];
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
      console.error('❌ Error: weatherForecast not found in the response');
      log += '❌ Error: weatherForecast not found in the response\n';
    }
    
    // Test with useLiveData=false (database)
    console.log('\nTesting with useLiveData=false (database):');
    log += '\nTesting with useLiveData=false (database):\n';
    
    const dbResponse = await axios.get('http://localhost:3000/api/activities');
    
    console.log('Status:', dbResponse.status);
    log += `Status: ${dbResponse.status}\n`;
    
    console.log('Source:', dbResponse.data.source);
    log += `Source: ${dbResponse.data.source}\n`;
    
    // Log the response structure
    console.log('\nDatabase response structure:');
    log += '\nDatabase response structure:\n';
    
    const dbResponseStructure = safeStringify(dbResponse.data);
    console.log(dbResponseStructure);
    log += `${dbResponseStructure}\n`;
    
    // Check if weatherForecast exists and has data
    if (dbResponse.data.data && dbResponse.data.data.weatherForecast) {
      console.log('Weather Forecast exists:', !!dbResponse.data.data.weatherForecast);
      log += `Weather Forecast exists: ${!!dbResponse.data.data.weatherForecast}\n`;
      
      console.log('Weather Forecast length:', dbResponse.data.data.weatherForecast.length);
      log += `Weather Forecast length: ${dbResponse.data.data.weatherForecast.length}\n`;
    } else {
      console.log('Weather Forecast not found in database response');
      log += 'Weather Forecast not found in database response\n';
    }
    
    console.log('\n✅ API test completed successfully!');
    log += '\n✅ API test completed successfully!\n';
    
    // Write the log to a file
    fs.writeFileSync('activities-api-test.log', log);
    console.log('\nLog written to activities-api-test.log');
  } catch (error) {
    const errorMessage = error.response 
      ? `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`
      : error.message;
      
    console.error('❌ Error testing API:', errorMessage);
    log += `❌ Error testing API: ${errorMessage}\n`;
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
      log += `Stack trace: ${error.stack}\n`;
    }
    
    // Write the error to the log file
    fs.writeFileSync('activities-api-test.log', log);
    console.log('\nError log written to activities-api-test.log');
  }
}

// Run the test
testActivitiesAPI()
  .catch(error => {
    console.error('Unhandled promise rejection:', error);
    process.exit(1);
  });
