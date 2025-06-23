require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Function to test the weather forecast data
async function testWeatherForecast() {
  console.log('Testing weather forecast data...');
  let log = 'Testing weather forecast data...\n';
  
  try {
    // Read the live-activities-data.json file directly
    const liveDataPath = path.join(__dirname, 'live-activities-data.json');
    console.log(`Reading file: ${liveDataPath}`);
    log += `Reading file: ${liveDataPath}\n`;
    
    if (!fs.existsSync(liveDataPath)) {
      throw new Error('Live activities data file not found');
    }
    
    const fileData = JSON.parse(fs.readFileSync(liveDataPath, 'utf8'));
    
    console.log('\nFile data structure:');
    log += '\nFile data structure:\n';
    
    // Log the top-level properties
    const fileProperties = Object.keys(fileData);
    console.log('Properties:', fileProperties.join(', '));
    log += `Properties: ${fileProperties.join(', ')}\n`;
    
    // Check for weatherForecast in the file
    if (fileData.weatherForecast) {
      console.log('\nWeather Forecast exists in file:', true);
      console.log('Weather Forecast length:', fileData.weatherForecast.length);
      
      log += '\nWeather Forecast exists in file: true\n';
      log += `Weather Forecast length: ${fileData.weatherForecast.length}\n`;
      
      // Log the first day's forecast from the file
      if (fileData.weatherForecast.length > 0) {
        const firstDay = fileData.weatherForecast[0];
        console.log('\nFirst day forecast from file:');
        log += '\nFirst day forecast from file:\n';
        
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
      console.log('\nWeather Forecast exists in file:', false);
      log += '\nWeather Forecast exists in file: false\n';
    }
    
    // Now test the API response
    console.log('\nTesting API response with useLiveData=true:');
    log += '\nTesting API response with useLiveData=true:\n';
    
    const liveResponse = await axios.get('http://localhost:3001/api/activities?useLiveData=true');
    
    console.log('Status:', liveResponse.status);
    log += `Status: ${liveResponse.status}\n`;
    
    console.log('Source:', liveResponse.data.source);
    log += `Source: ${liveResponse.data.source}\n`;
    
    // Check if the response has the expected structure
    const apiData = liveResponse.data.data;
    
    console.log('\nAPI response structure:');
    log += '\nAPI response structure:\n';
    
    // Log the top-level properties
    const apiProperties = Object.keys(apiData);
    console.log('Properties:', apiProperties.join(', '));
    log += `Properties: ${apiProperties.join(', ')}\n`;
    
    // Check for weatherForecast in the API response
    if (apiData.weatherForecast) {
      console.log('\nWeather Forecast exists in API response:', true);
      console.log('Weather Forecast length:', apiData.weatherForecast.length);
      
      log += '\nWeather Forecast exists in API response: true\n';
      log += `Weather Forecast length: ${apiData.weatherForecast.length}\n`;
      
      // Log the first day's forecast from the API
      if (apiData.weatherForecast.length > 0) {
        const firstDay = apiData.weatherForecast[0];
        console.log('\nFirst day forecast from API:');
        log += '\nFirst day forecast from API:\n';
        
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
      console.log('\nWeather Forecast exists in API response:', false);
      log += '\nWeather Forecast exists in API response: false\n';
    }
    
    // Compare the file data and API response
    console.log('\nComparing file data and API response:');
    log += '\nComparing file data and API response:\n';
    
    const fileHasWeather = !!fileData.weatherForecast;
    const apiHasWeather = !!apiData.weatherForecast;
    
    console.log('Weather Forecast in file:', fileHasWeather);
    console.log('Weather Forecast in API:', apiHasWeather);
    
    log += `Weather Forecast in file: ${fileHasWeather}\n`;
    log += `Weather Forecast in API: ${apiHasWeather}\n`;
    
    if (fileHasWeather && apiHasWeather) {
      console.log('Match: Both file and API have weather forecast data');
      log += 'Match: Both file and API have weather forecast data\n';
    } else if (fileHasWeather && !apiHasWeather) {
      console.log('Mismatch: File has weather forecast data but API does not');
      log += 'Mismatch: File has weather forecast data but API does not\n';
    } else if (!fileHasWeather && apiHasWeather) {
      console.log('Mismatch: API has weather forecast data but file does not');
      log += 'Mismatch: API has weather forecast data but file does not\n';
    } else {
      console.log('Match: Neither file nor API have weather forecast data');
      log += 'Match: Neither file nor API have weather forecast data\n';
    }
    
    console.log('\n✅ Test completed!');
    log += '\n✅ Test completed!\n';
    
    // Write the log to a file
    fs.writeFileSync('weather-forecast-test.log', log);
    console.log('\nLog written to weather-forecast-test.log');
  } catch (error) {
    console.error('❌ Error testing weather forecast:', error.message);
    log += `\n❌ Error testing weather forecast: ${error.message}\n`;
    
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
    fs.writeFileSync('weather-forecast-test.log', log);
    console.log('\nError log written to weather-forecast-test.log');
  }
}

// Run the test
testWeatherForecast()
  .catch(error => {
    console.error('Unhandled promise rejection:', error);
    process.exit(1);
  });
