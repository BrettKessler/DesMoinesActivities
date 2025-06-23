// This script tests the client-side weather forecast display functionality
// It simulates the API response and tests the displayWeatherForecast function
const fs = require('fs');

// Create a log string to store all output
let log = '# Client Weather Forecast Test Results\n\n';

// Create a mock document object
const mockDocument = {
  getElementById: function(id) {
    // Return a mock element that captures what would be set
    return {
      id: id,
      innerHTML: '',
      set innerHTML(value) {
        this._innerHTML = value;
        console.log(`Setting innerHTML for #${id}:`);
        console.log(value);
        log += `## Setting innerHTML for #${id}:\n\`\`\`html\n${value}\n\`\`\`\n\n`;
      },
      get innerHTML() {
        return this._innerHTML;
      }
    };
  }
};

// Mock weather forecast data (similar to what's in live-activities-data.json)
const mockWeatherForecast = [
  {
    date: "Monday, June 23",
    temp: {
      min: 77,
      max: 84
    },
    weather: "Rain",
    description: "Heavy rain with thunderstorms",
    precipitation: 80
  },
  {
    date: "Tuesday, June 24",
    temp: {
      min: 75,
      max: 82
    },
    weather: "Clouds",
    description: "Partly cloudy with scattered showers",
    precipitation: 40
  },
  {
    date: "Wednesday, June 25",
    temp: {
      min: 73,
      max: 80
    },
    weather: "Rain",
    description: "Light rain throughout the day",
    precipitation: 60
  }
];

// Copy of the displayWeatherForecast function from client/script.js
function displayWeatherForecast(forecast) {
  const weatherContainer = mockDocument.getElementById('weather-forecast-container');
  
  if (!forecast || forecast.length === 0) {
    weatherContainer.innerHTML = "<p>No weather forecast available.</p>";
    return;
  }
  
  let html = "";
  
  // Weather icons mapping
  const weatherIcons = {
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Mist': '🌫️',
    'Fog': '🌫️',
    'Haze': '🌫️',
    'Smoke': '🌫️',
    'Dust': '🌫️',
    'Sand': '🌫️',
    'Ash': '🌫️',
    'Squall': '💨',
    'Tornado': '🌪️'
  };
  
  forecast.forEach(day => {
    const icon = weatherIcons[day.weather] || '🌡️';
    const precipitationChance = Math.round(day.precipitation);
    
    html += `
        <div class="weather-day">
            <div class="weather-date">${day.date.split(',')[0]}</div>
            <div class="weather-icon">${icon}</div>
            <div class="weather-temp">${day.temp.min}°F - ${day.temp.max}°F</div>
            <div class="weather-description">${day.description}</div>
            <div class="weather-precipitation">
                <span class="weather-precipitation-icon">💧</span> ${precipitationChance}%
            </div>
        </div>
    `;
  });
  
  weatherContainer.innerHTML = html;
  
  return html; // Return for testing
}

// Test the function with the mock data
console.log('Testing displayWeatherForecast function with mock data...');
log += '## Test with mock weather data\n';
const result = displayWeatherForecast(mockWeatherForecast);

// Test with empty data
console.log('\nTesting displayWeatherForecast function with empty data...');
log += '\n## Test with empty data\n';
displayWeatherForecast([]);

// Test with null data
console.log('\nTesting displayWeatherForecast function with null data...');
log += '\n## Test with null data\n';
displayWeatherForecast(null);

console.log('\nTest completed!');
log += '\n## Test completed!\n';

// Write the log to a file
fs.writeFileSync('client-weather-test.log', log);
console.log('Log written to client-weather-test.log');
