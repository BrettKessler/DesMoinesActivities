require('dotenv').config();
const fs = require('fs');
const path = require('path');
const chatgptService = require('./server/services/chatgpt');

// Function to test the ChatGPT API and save the response to a file
async function testChatGPTAPIWithFile() {
  console.log('Testing ChatGPT API and saving response to file...');
  let log = 'Testing ChatGPT API and saving response to file...\n';
  
  try {
    // Get the current week's date range
    const { startDate, endDate } = chatgptService.getCurrentWeekDateRange();
    console.log(`Date range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
    log += `Date range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}\n`;
    
    // Generate the prompt
    const prompt = chatgptService.generatePrompt(startDate, endDate);
    console.log('\nGenerated prompt:');
    console.log('----------------');
    console.log(prompt);
    console.log('----------------\n');
    
    log += '\nGenerated prompt:\n';
    log += '----------------\n';
    log += prompt + '\n';
    log += '----------------\n';
    
    // Call ChatGPT API
    console.log('Calling ChatGPT API (this may take a moment)...');
    log += '\nCalling ChatGPT API (this may take a moment)...\n';
    
    const response = await chatgptService.callChatGPT(prompt);
    
    // Log a preview of the response
    console.log('\nAPI Response Preview (first 300 characters):');
    console.log('----------------');
    console.log(response.substring(0, 300) + '...');
    console.log('----------------\n');
    
    log += '\nAPI Response Preview (first 300 characters):\n';
    log += '----------------\n';
    log += response.substring(0, 300) + '...\n';
    log += '----------------\n';
    
    // Parse the response
    console.log('Parsing the response...');
    log += '\nParsing the response...\n';
    
    const parsedData = chatgptService.parseResponse(response);
    
    // Add weather forecast data
    console.log('Adding weather forecast data...');
    log += '\nAdding weather forecast data...\n';
    
    // Create a sample weather forecast for the week
    const weatherForecast = [];
    const weatherTypes = ['Clear', 'Clouds', 'Rain', 'Thunderstorm'];
    const descriptions = [
      'Sunny with clear skies',
      'Partly cloudy with scattered showers',
      'Light rain throughout the day',
      'Heavy rain with thunderstorms',
      'Mostly cloudy with a chance of rain',
      'Afternoon thunderstorms possible',
      'Mostly sunny with a few clouds'
    ];
    
    // Generate weather forecast for each day of the week
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      
      // Format the date
      const options = { weekday: 'long', month: 'long', day: 'numeric' };
      const dateStr = day.toLocaleDateString('en-US', options);
      
      // Generate random weather data
      const minTemp = 73 + Math.floor(Math.random() * 8); // 73-80
      const maxTemp = minTemp + Math.floor(Math.random() * 8) + 1; // minTemp+1 to minTemp+8
      const weatherIndex = Math.floor(Math.random() * weatherTypes.length);
      const descriptionIndex = Math.floor(Math.random() * descriptions.length);
      const precipitation = Math.floor(Math.random() * 100); // 0-99%
      
      weatherForecast.push({
        date: dateStr,
        temp: {
          min: minTemp,
          max: maxTemp
        },
        weather: weatherTypes[weatherIndex],
        description: descriptions[descriptionIndex],
        precipitation: precipitation
      });
    }
    
    // Create the final data object
    const finalData = {
      ...parsedData,
      weekStartDate: startDate,
      weekEndDate: endDate,
      weatherForecast
    };
    
    // Save to a file
    const outputPath = path.join(__dirname, 'test-activities-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
    
    console.log(`\nData saved to ${outputPath}`);
    log += `\nData saved to ${outputPath}\n`;
    
    // Log the structure of the saved data
    console.log('\nSaved data structure:');
    console.log('----------------');
    console.log(`Categories: ${finalData.categories ? finalData.categories.length : 0}`);
    console.log(`Planning Tips: ${finalData.planningTips ? finalData.planningTips.length : 0}`);
    console.log(`Weather Forecast: ${finalData.weatherForecast ? finalData.weatherForecast.length : 0}`);
    console.log('----------------\n');
    
    log += '\nSaved data structure:\n';
    log += '----------------\n';
    log += `Categories: ${finalData.categories ? finalData.categories.length : 0}\n`;
    log += `Planning Tips: ${finalData.planningTips ? finalData.planningTips.length : 0}\n`;
    log += `Weather Forecast: ${finalData.weatherForecast ? finalData.weatherForecast.length : 0}\n`;
    log += '----------------\n';
    
    console.log('✅ Test completed successfully!');
    log += '\n✅ Test completed successfully!\n';
    
    // Write the log to a file
    fs.writeFileSync('chatgpt-api-with-file-test.log', log);
    console.log('\nLog written to chatgpt-api-with-file-test.log');
  } catch (error) {
    console.error('❌ Error testing ChatGPT API:', error);
    log += `\n❌ Error testing ChatGPT API: ${error.message}\n`;
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
      log += `Stack trace: ${error.stack}\n`;
    }
    
    // Write the error log to a file
    fs.writeFileSync('chatgpt-api-with-file-test.log', log);
    console.log('\nError log written to chatgpt-api-with-file-test.log');
  }
}

// Run the test
testChatGPTAPIWithFile()
  .catch(error => {
    console.error('Unhandled promise rejection:', error);
    process.exit(1);
  });
