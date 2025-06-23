/**
 * Test script for the multi-API integration
 * 
 * This script tests the integration with Ticketmaster, OpenWeather, and Google Gemini APIs
 * to fetch events, weather, and activities for Des Moines.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Import the multi-API service
const multiApiService = require('./server/services/multi-api');

// Output file for test results
const outputFile = 'multi-api-test-results.txt';
fs.writeFileSync(outputFile, 'Multi-API Integration Test Results\n');
fs.appendFileSync(outputFile, `Started at: ${new Date().toISOString()}\n\n`);

/**
 * Test the individual APIs
 */
async function testIndividualApis() {
  fs.appendFileSync(outputFile, 'Testing individual APIs...\n\n');
  
  // Test Ticketmaster API
  try {
    const apiKey = process.env.TICKETMASTER_API_KEY;
    
    if (!apiKey) {
      throw new Error('Ticketmaster API key not found in environment variables');
    }
    
    console.log('Testing Ticketmaster API...');
    fs.appendFileSync(outputFile, 'Ticketmaster API Test:\n');
    
    // Build the API URL
    const apiUrl = 'https://app.ticketmaster.com/discovery/v2/events.json';
    const params = {
      apikey: apiKey,
      city: 'Des Moines',
      stateCode: 'IA',
      size: 1 // Just get one event for testing
    };
    
    // Make the API request
    const response = await axios.get(apiUrl, { params });
    
    if (response.data && response.data._embedded && response.data._embedded.events) {
      fs.appendFileSync(outputFile, '✅ Ticketmaster API test successful\n');
      fs.appendFileSync(outputFile, `Found ${response.data._embedded.events.length} events\n`);
      fs.appendFileSync(outputFile, `Example event: ${response.data._embedded.events[0].name}\n\n`);
    } else {
      fs.appendFileSync(outputFile, '❌ Ticketmaster API test failed: No events found\n\n');
    }
  } catch (error) {
    fs.appendFileSync(outputFile, `❌ Ticketmaster API test failed: ${error.message}\n`);
    if (error.response) {
      fs.appendFileSync(outputFile, `Response status: ${error.response.status}\n`);
      fs.appendFileSync(outputFile, `Response data: ${JSON.stringify(error.response.data)}\n\n`);
    } else {
      fs.appendFileSync(outputFile, '\n');
    }
  }
  
  // Test OpenWeather API
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenWeather API key not found in environment variables');
    }
    
    console.log('Testing OpenWeather API...');
    fs.appendFileSync(outputFile, 'OpenWeather API Test:\n');
    
    try {
      // Try One Call API 3.0 first (requires subscription)
      const apiUrl = 'https://api.openweathermap.org/data/3.0/onecall';
      const params = {
        lat: 41.5868, // Des Moines latitude
        lon: -93.6250, // Des Moines longitude
        exclude: 'minutely,hourly,alerts',
        units: 'imperial',
        appid: apiKey
      };
      
      // Make the API request
      const response = await axios.get(apiUrl, { params });
      
      if (response.data && response.data.current) {
        fs.appendFileSync(outputFile, '✅ OpenWeather One Call API 3.0 test successful\n');
        fs.appendFileSync(outputFile, `Current temperature in Des Moines: ${response.data.current.temp}°F\n`);
        fs.appendFileSync(outputFile, `Weather: ${response.data.current.weather[0].main} - ${response.data.current.weather[0].description}\n\n`);
        
        // Log daily forecast
        if (response.data.daily && response.data.daily.length > 0) {
          fs.appendFileSync(outputFile, `7-day forecast available with ${response.data.daily.length} days\n`);
          fs.appendFileSync(outputFile, `Example day: ${response.data.daily[0].temp.min}°F to ${response.data.daily[0].temp.max}°F\n\n`);
        }
      } else {
        fs.appendFileSync(outputFile, '❌ OpenWeather API test failed: Invalid response\n\n');
      }
    } catch (oneCallError) {
      // Check if the error is due to subscription requirements
      if (oneCallError.response && oneCallError.response.status === 401 && 
          oneCallError.response.data && oneCallError.response.data.message && 
          oneCallError.response.data.message.includes('One Call 3.0 requires a separate subscription')) {
        
        fs.appendFileSync(outputFile, '⚠️ OpenWeather One Call API 3.0 requires a subscription\n');
        fs.appendFileSync(outputFile, 'Falling back to Current Weather Data API (free tier)...\n');
        
        try {
          // Fall back to the free tier API (Current Weather Data)
          const fallbackApiUrl = 'https://api.openweathermap.org/data/2.5/weather';
          const fallbackParams = {
            lat: 41.5868, // Des Moines latitude
            lon: -93.6250, // Des Moines longitude
            units: 'imperial',
            appid: apiKey
          };
          
          const fallbackResponse = await axios.get(fallbackApiUrl, { params: fallbackParams });
          
          if (fallbackResponse.data && fallbackResponse.data.main && fallbackResponse.data.weather) {
            fs.appendFileSync(outputFile, '✅ OpenWeather Current Weather API test successful\n');
            fs.appendFileSync(outputFile, `Current temperature in Des Moines: ${fallbackResponse.data.main.temp}°F\n`);
            fs.appendFileSync(outputFile, `Weather: ${fallbackResponse.data.weather[0].main} - ${fallbackResponse.data.weather[0].description}\n\n`);
          } else {
            fs.appendFileSync(outputFile, '❌ OpenWeather Current Weather API test failed: Invalid response\n\n');
          }
        } catch (fallbackError) {
          fs.appendFileSync(outputFile, `❌ OpenWeather Current Weather API test failed: ${fallbackError.message}\n`);
          if (fallbackError.response) {
            fs.appendFileSync(outputFile, `Response status: ${fallbackError.response.status}\n`);
            fs.appendFileSync(outputFile, `Response data: ${JSON.stringify(fallbackError.response.data)}\n\n`);
          } else {
            fs.appendFileSync(outputFile, '\n');
          }
        }
      } else {
        fs.appendFileSync(outputFile, `❌ OpenWeather API test failed: ${oneCallError.message}\n`);
        if (oneCallError.response) {
          fs.appendFileSync(outputFile, `Response status: ${oneCallError.response.status}\n`);
          fs.appendFileSync(outputFile, `Response data: ${JSON.stringify(oneCallError.response.data)}\n\n`);
        } else {
          fs.appendFileSync(outputFile, '\n');
        }
      }
    }
  } catch (error) {
    fs.appendFileSync(outputFile, `❌ OpenWeather API test failed: ${error.message}\n`);
    if (error.response) {
      fs.appendFileSync(outputFile, `Response status: ${error.response.status}\n`);
      fs.appendFileSync(outputFile, `Response data: ${JSON.stringify(error.response.data)}\n\n`);
    } else {
      fs.appendFileSync(outputFile, '\n');
    }
  }
  
  // Test Gemini API
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Gemini AI API key not found in environment variables');
    }
    
    console.log('Testing Gemini API...');
    fs.appendFileSync(outputFile, 'Gemini API Test:\n');
    
    // Create a simple test prompt
    const prompt = 'List 3 popular attractions in Des Moines, Iowa. Format as a JSON array.';
    
    // Build the API URL
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    const params = {
      key: apiKey
    };
    
    // Make the API request
    const response = await axios.post(apiUrl, {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024
      }
    }, { params });
    
    if (response.data && response.data.candidates && response.data.candidates.length > 0) {
      fs.appendFileSync(outputFile, '✅ Gemini API test successful\n');
      const text = response.data.candidates[0].content.parts[0].text;
      fs.appendFileSync(outputFile, `Response: ${text}\n\n`);
    } else {
      fs.appendFileSync(outputFile, '❌ Gemini API test failed: Invalid response\n\n');
    }
  } catch (error) {
    fs.appendFileSync(outputFile, `❌ Gemini API test failed: ${error.message}\n`);
    if (error.response) {
      fs.appendFileSync(outputFile, `Response status: ${error.response.status}\n`);
      fs.appendFileSync(outputFile, `Response data: ${JSON.stringify(error.response.data)}\n\n`);
    } else {
      fs.appendFileSync(outputFile, '\n');
    }
  }
}

/**
 * Test the multi-API integration
 */
async function testMultiApiIntegration() {
  try {
    fs.appendFileSync(outputFile, 'Testing multi-API integration...\n');
    
    // Test individual APIs first
    await testIndividualApis();
    
    // Test the fetchAndStoreActivities function
    fs.appendFileSync(outputFile, 'Fetching activities from multiple APIs...\n');
    
    // Redirect console.log to capture output
    const originalConsoleLog = console.log;
    const logs = [];
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalConsoleLog(...args);
    };
    
    // Call the service function
    const activities = await multiApiService.fetchAndStoreActivities();
    
    // Restore console.log
    console.log = originalConsoleLog;
    
    // Log the results
    fs.appendFileSync(outputFile, 'API Logs:\n');
    fs.appendFileSync(outputFile, logs.join('\n') + '\n\n');
    
    fs.appendFileSync(outputFile, 'Results Summary:\n');
    fs.appendFileSync(outputFile, `Week: ${activities.weekStartDate.toLocaleDateString()} to ${activities.weekEndDate.toLocaleDateString()}\n`);
    fs.appendFileSync(outputFile, `Categories: ${activities.categories.length}\n`);
    
    // Log each category and event count
    activities.categories.forEach(category => {
      fs.appendFileSync(outputFile, `- ${category.name}: ${category.events.length} events\n`);
      
      // Log the first event in each category as an example
      if (category.events.length > 0) {
        const firstEvent = category.events[0];
        fs.appendFileSync(outputFile, `  Example event: ${firstEvent.name}\n`);
        fs.appendFileSync(outputFile, `    Date: ${firstEvent.date}\n`);
        fs.appendFileSync(outputFile, `    Time: ${firstEvent.time}\n`);
        fs.appendFileSync(outputFile, `    Venue: ${firstEvent.venue}\n`);
        fs.appendFileSync(outputFile, `    Price: ${firstEvent.ticketPrice}\n`);
        fs.appendFileSync(outputFile, `    Description: ${firstEvent.description}\n`);
      }
    });
    
    // Log planning tips
    fs.appendFileSync(outputFile, `Planning Tips: ${activities.planningTips.length}\n`);
    activities.planningTips.forEach(tip => {
      fs.appendFileSync(outputFile, `- ${tip}\n`);
    });
    
    // Log weather forecast
    if (activities.weatherForecast && activities.weatherForecast.length > 0) {
      fs.appendFileSync(outputFile, `Weather Forecast: ${activities.weatherForecast.length} days\n`);
      activities.weatherForecast.forEach(day => {
        fs.appendFileSync(outputFile, `- ${day.date}: ${day.temp.min}°F to ${day.temp.max}°F, ${day.weather} (${day.description})\n`);
      });
    } else {
      fs.appendFileSync(outputFile, 'Weather Forecast: Not available\n');
    }
    
    // Log total events
    const totalEvents = activities.categories.reduce((total, category) => total + category.events.length, 0);
    fs.appendFileSync(outputFile, `Total Events: ${totalEvents}\n\n`);
    
    fs.appendFileSync(outputFile, '✅ Multi-API integration test completed successfully!\n');
    console.log(`Multi-API integration test completed successfully. Check ${outputFile} for the results.`);
    
    return activities;
  } catch (error) {
    fs.appendFileSync(outputFile, `❌ Error in multi-API integration test: ${error.message}\n`);
    if (error.stack) {
      fs.appendFileSync(outputFile, `Stack trace: ${error.stack}\n`);
    }
    console.error('Error in multi-API integration test:', error);
    throw error;
  }
}

// Run the test
testMultiApiIntegration()
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
