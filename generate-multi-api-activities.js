/**
 * Generate activities data from multiple APIs without updating the database
 * 
 * This script fetches data from Ticketmaster, OpenWeather, and Google Gemini APIs
 * and saves the combined data to a JSON file.
 */
require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

// Des Moines coordinates
const DES_MOINES_LAT = 41.5868;
const DES_MOINES_LNG = -93.6250;
const SEARCH_RADIUS_MILES = 50;

// Output file
const outputFile = 'live-activities-data.json';
const logFile = 'multi-api-activities-generation.log';

// Initialize log file
fs.writeFileSync(logFile, 'Multi-API Activities Generation Log\n');
fs.appendFileSync(logFile, `Started at: ${new Date().toISOString()}\n\n`);

/**
 * Get the current week's date range (Monday to Sunday)
 * @returns {Object} - The start and end dates of the current week
 */
function getCurrentWeekDateRange() {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate days to subtract to get to Monday
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
  
  // Create date objects for start (Monday) and end (Sunday) of the week
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - daysToMonday);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}

/**
 * Format date for Ticketmaster API
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string (YYYY-MM-DDTHH:mm:ssZ)
 */
function formatDateForTicketmaster(date) {
  return date.toISOString().slice(0, 19) + 'Z';
}

/**
 * Fetch events from Ticketmaster API
 * @param {Date} startDate - Start date for events
 * @param {Date} endDate - End date for events
 * @returns {Promise<Array>} - Array of events
 */
async function fetchTicketmasterEvents(startDate, endDate) {
  try {
    const apiKey = process.env.TICKETMASTER_API_KEY;
    
    if (!apiKey) {
      throw new Error('Ticketmaster API key not found in environment variables');
    }
    
    console.log('Fetching events from Ticketmaster API...');
    fs.appendFileSync(logFile, 'Fetching events from Ticketmaster API...\n');
    
    // Format dates for Ticketmaster API
    const startDateTime = formatDateForTicketmaster(startDate);
    const endDateTime = formatDateForTicketmaster(endDate);
    
    // Build the API URL
    const apiUrl = 'https://app.ticketmaster.com/discovery/v2/events.json';
    const params = {
      apikey: apiKey,
      latlong: `${DES_MOINES_LAT},${DES_MOINES_LNG}`,
      radius: SEARCH_RADIUS_MILES,
      unit: 'miles',
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      size: 100, // Get up to 100 events
      sort: 'date,asc'
    };
    
    // Make the API request
    const response = await axios.get(apiUrl, { params });
    
    if (!response.data._embedded || !response.data._embedded.events) {
      console.log('No events found in Ticketmaster API response');
      fs.appendFileSync(logFile, 'No events found in Ticketmaster API response\n');
      return [];
    }
    
    const events = response.data._embedded.events;
    console.log(`Found ${events.length} events from Ticketmaster API`);
    fs.appendFileSync(logFile, `Found ${events.length} events from Ticketmaster API\n`);
    
    // Process events into our format
    return events.map(event => {
      // Extract date and time
      const eventDate = event.dates.start.dateTime ? new Date(event.dates.start.dateTime) : null;
      const formattedDate = eventDate ? 
        eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 
        'Date TBD';
      
      const formattedTime = event.dates.start.localTime ? 
        new Date(`2000-01-01T${event.dates.start.localTime}`).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        }) : 
        'Time TBD';
      
      // Extract venue
      const venue = event._embedded && event._embedded.venues && event._embedded.venues[0] ? 
        event._embedded.venues[0].name : 
        'Venue TBD';
      
      // Extract price range
      let ticketPrice = 'Price TBD';
      if (event.priceRanges && event.priceRanges.length > 0) {
        const priceRange = event.priceRanges[0];
        if (priceRange.min === priceRange.max) {
          ticketPrice = `$${priceRange.min.toFixed(2)}`;
        } else {
          ticketPrice = `$${priceRange.min.toFixed(2)} - $${priceRange.max.toFixed(2)}`;
        }
      }
      
      // Determine category
      let category = 'Festivals & Events';
      if (event.classifications && event.classifications.length > 0) {
        const classification = event.classifications[0];
        if (classification.segment && classification.segment.name === 'Music') {
          category = 'Live Music';
        }
      }
      
      return {
        name: event.name,
        date: formattedDate,
        time: formattedTime,
        venue: venue,
        ticketPrice: ticketPrice,
        ticketLink: event.url || '',
        description: event.info || event.name,
        category: category
      };
    });
  } catch (error) {
    console.error('Error fetching Ticketmaster events:', error.message);
    fs.appendFileSync(logFile, `Error fetching Ticketmaster events: ${error.message}\n`);
    if (error.response) {
      fs.appendFileSync(logFile, `Response status: ${error.response.status}\n`);
      fs.appendFileSync(logFile, `Response data: ${JSON.stringify(error.response.data)}\n`);
    }
    return [];
  }
}

/**
 * Fetch weather forecast from OpenWeather API
 * @returns {Promise<Array>} - Array of weather forecast data
 */
async function fetchWeatherForecast() {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenWeather API key not found in environment variables');
    }
    
    console.log('Fetching weather forecast from OpenWeather API...');
    fs.appendFileSync(logFile, 'Fetching weather forecast from OpenWeather API...\n');
    
    // Build the API URL for 7-day forecast
    // Note: One Call API 3.0 requires a separate subscription to the "One Call by Call" plan
    // If the API call fails with a 401 error, we'll fall back to the free tier API
    const apiUrl = 'https://api.openweathermap.org/data/3.0/onecall';
    const params = {
      lat: DES_MOINES_LAT,
      lon: DES_MOINES_LNG,
      exclude: 'current,minutely,hourly,alerts',
      units: 'imperial', // Use Fahrenheit
      appid: apiKey
    };
    
    // Make the API request
    const response = await axios.get(apiUrl, { params });
    
    if (!response.data || !response.data.daily) {
      console.log('No forecast found in OpenWeather API response');
      fs.appendFileSync(logFile, 'No forecast found in OpenWeather API response\n');
      return [];
    }
    
    const forecast = response.data.daily;
    console.log(`Found ${forecast.length} days of weather forecast`);
    fs.appendFileSync(logFile, `Found ${forecast.length} days of weather forecast\n`);
    
    // Process forecast into our format (limit to 7 days)
    return forecast.slice(0, 7).map(day => {
      const date = new Date(day.dt * 1000);
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        temp: {
          min: Math.round(day.temp.min),
          max: Math.round(day.temp.max)
        },
        weather: day.weather[0].main,
        description: day.weather[0].description,
        precipitation: day.pop * 100 // Convert to percentage
      };
    });
  } catch (error) {
    console.error('Error fetching weather forecast:', error.message);
    fs.appendFileSync(logFile, `Error fetching weather forecast: ${error.message}\n`);
    
    // Check if the error is due to subscription requirements for One Call API 3.0
    if (error.response && error.response.status === 401 && 
        error.response.data && error.response.data.message && 
        error.response.data.message.includes('One Call 3.0 requires a separate subscription')) {
      console.warn('OpenWeather One Call API 3.0 requires a separate subscription. See https://openweathermap.org/price for more information.');
      fs.appendFileSync(logFile, 'OpenWeather One Call API 3.0 requires a separate subscription. Falling back to free tier API.\n');
      
      try {
        // Fall back to the free tier API (Current Weather Data)
        console.log('Falling back to Current Weather Data API...');
        fs.appendFileSync(logFile, 'Falling back to Current Weather Data API...\n');
        
        const fallbackApiUrl = 'https://api.openweathermap.org/data/2.5/weather';
        const fallbackParams = {
          lat: DES_MOINES_LAT,
          lon: DES_MOINES_LNG,
          units: 'imperial',
          appid: process.env.OPENWEATHER_API_KEY // Use the API key from environment variables
        };
        
        const fallbackResponse = await axios.get(fallbackApiUrl, { params: fallbackParams });
        
        if (fallbackResponse.data && fallbackResponse.data.main && fallbackResponse.data.weather) {
          console.log('Successfully fetched current weather data');
          fs.appendFileSync(logFile, 'Successfully fetched current weather data\n');
          
          // Create a simplified forecast with just today's weather
          const today = new Date();
          const forecast = [{
            date: today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
            temp: {
              min: Math.round(fallbackResponse.data.main.temp_min),
              max: Math.round(fallbackResponse.data.main.temp_max)
            },
            weather: fallbackResponse.data.weather[0].main,
            description: fallbackResponse.data.weather[0].description,
            precipitation: 0 // Not available in the free tier
          }];
          
          fs.appendFileSync(logFile, `Created simplified forecast with current weather: ${forecast[0].weather} (${forecast[0].description})\n`);
          return forecast;
        }
      } catch (fallbackError) {
        console.error('Error fetching fallback weather data:', fallbackError.message);
        fs.appendFileSync(logFile, `Error fetching fallback weather data: ${fallbackError.message}\n`);
      }
    } else if (error.response) {
      fs.appendFileSync(logFile, `Response status: ${error.response.status}\n`);
      fs.appendFileSync(logFile, `Response data: ${JSON.stringify(error.response.data)}\n`);
    }
    
    return [];
  }
}

/**
 * Fetch additional activities from Google Gemini AI
 * @param {Date} startDate - Start date for activities
 * @param {Date} endDate - End date for activities
 * @returns {Promise<Array>} - Array of activities
 */
async function fetchGeminiActivities(startDate, endDate) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Gemini AI API key not found in environment variables');
    }
    
    console.log('Fetching activities from Google Gemini AI...');
    fs.appendFileSync(logFile, 'Fetching activities from Google Gemini AI...\n');
    
    // Format dates for the prompt
    const startDateStr = startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const endDateStr = endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    
    // Create the prompt
    const prompt = `Generate a list of activities within a 50-mile radius of Des Moines, Iowa for the week of ${startDateStr} to ${endDateStr}.
    
Include a mix of:
- Outdoor activities and parks
- Family-friendly attractions
- Cultural and historical sites
- Local restaurants and food experiences
- Shopping destinations

For each activity, provide:
- Name
- Location/Address
- Brief description (1-2 sentences)
- Type of activity (e.g., outdoor, family, cultural)
- Cost estimate (free, $, $$, $$$)

IMPORTANT: Your response must be a valid JSON array with the following structure and nothing else:
[
  {
    "name": "Activity name",
    "location": "Address or venue",
    "description": "Brief description",
    "type": "Activity type",
    "cost": "Cost estimate"
  },
  ...
]

Do not include any explanatory text, markdown formatting, or code blocks. Return only the raw JSON array.`;
    
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
        maxOutputTokens: 2048
      }
    }, { params });
    
    if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
      console.log('No response from Gemini AI');
      fs.appendFileSync(logFile, 'No response from Gemini AI\n');
      return [];
    }
    
    // Check if the response has the expected structure
    if (!response.data.candidates || 
        !response.data.candidates[0] || 
        !response.data.candidates[0].content || 
        !response.data.candidates[0].content.parts || 
        !response.data.candidates[0].content.parts[0] || 
        !response.data.candidates[0].content.parts[0].text) {
      console.log('Unexpected Gemini API response structure');
      fs.appendFileSync(logFile, 'Unexpected Gemini API response structure\n');
      fs.appendFileSync(logFile, `Response: ${JSON.stringify(response.data)}\n`);
      return [];
    }
    
    // Extract the text from the response
    const text = response.data.candidates[0].content.parts[0].text;
    
    // Find the JSON array in the response
    const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
    if (!jsonMatch) {
      console.log('Could not find JSON array in Gemini response');
      fs.appendFileSync(logFile, 'Could not find JSON array in Gemini response\n');
      fs.appendFileSync(logFile, `Response text: ${text}\n`);
      return [];
    }
    
    // Parse the JSON array
    const activities = JSON.parse(jsonMatch[0]);
    console.log(`Found ${activities.length} activities from Gemini AI`);
    fs.appendFileSync(logFile, `Found ${activities.length} activities from Gemini AI\n`);
    
    // Process activities into our format
    return activities.map(activity => {
      return {
        name: activity.name,
        date: 'Available all week',
        time: 'Various times',
        venue: activity.location,
        ticketPrice: activity.cost,
        ticketLink: '',
        description: activity.description,
        category: 'Local Activities'
      };
    });
  } catch (error) {
    console.error('Error fetching Gemini activities:', error.message);
    fs.appendFileSync(logFile, `Error fetching Gemini activities: ${error.message}\n`);
    if (error.response) {
      fs.appendFileSync(logFile, `Response status: ${error.response.status}\n`);
      fs.appendFileSync(logFile, `Response data: ${JSON.stringify(error.response.data)}\n`);
    }
    return [];
  }
}

/**
 * Generate planning tips based on weather forecast
 * @param {Array} forecast - Weather forecast data
 * @returns {Array} - Array of planning tips
 */
function generateWeatherPlanningTips(forecast) {
  const tips = [];
  
  if (forecast.length === 0) {
    return [
      '**Weather**: Weather forecast unavailable. Check local weather services before heading out.'
    ];
  }
  
  // Check for high temperatures
  const highTempDays = forecast.filter(day => day.temp.max > 85);
  if (highTempDays.length > 0) {
    const dayList = highTempDays.map(day => day.date.split(',')[0]).join(', ');
    tips.push(`**Heat Advisory**: Temperatures will reach above 85°F on ${dayList}. Stay hydrated and wear sunscreen for outdoor events.`);
  }
  
  // Check for rain
  const rainyDays = forecast.filter(day => day.precipitation > 50);
  if (rainyDays.length > 0) {
    const dayList = rainyDays.map(day => day.date.split(',')[0]).join(', ');
    tips.push(`**Rain Alert**: High chance of precipitation on ${dayList}. Consider bringing an umbrella or rain jacket for outdoor activities.`);
  }
  
  // General weather summary
  const averageHigh = Math.round(forecast.reduce((sum, day) => sum + day.temp.max, 0) / forecast.length);
  const averageLow = Math.round(forecast.reduce((sum, day) => sum + day.temp.min, 0) / forecast.length);
  tips.push(`**Weekly Weather**: Expect temperatures ranging from ${averageLow}°F to ${averageHigh}°F this week. ${forecast[0].weather} conditions expected for most of the week.`);
  
  return tips;
}

/**
 * Generate additional planning tips
 * @returns {Array} - Array of planning tips
 */
function generateAdditionalPlanningTips() {
  return [
    '**Parking**: Downtown parking is free on weekends. For the Arts Festival, consider using the free shuttle service from downtown parking garages. Principal Park has paid parking lots nearby for $10.',
    '**Family-Friendly Notes**: The Arts Festival has a dedicated kids\' zone with activities throughout the day. The Farmers Market can get crowded with strollers, so consider baby carriers for small children. Ankeny SummerFest has a family day on Saturday with special activities for children.'
  ];
}

/**
 * Generate activities data from multiple APIs and save to file
 */
async function generateActivitiesData() {
  try {
    // Get the current week's date range
    const { startDate, endDate } = getCurrentWeekDateRange();
    
    // Format dates for logging
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    const startDateStr = startDate.toLocaleDateString('en-US', options);
    const endDateStr = endDate.toLocaleDateString('en-US', options);
    
    fs.appendFileSync(logFile, `Current week: ${startDateStr} to ${endDateStr}\n\n`);
    
    // Fetch data from all APIs in parallel
    fs.appendFileSync(logFile, 'Fetching data from all APIs...\n');
    const [ticketmasterEvents, weatherForecast, geminiActivities] = await Promise.all([
      fetchTicketmasterEvents(startDate, endDate),
      fetchWeatherForecast(),
      fetchGeminiActivities(startDate, endDate)
    ]);
    
    // Organize events by category
    const eventsByCategory = {};
    
    // Process Ticketmaster events
    ticketmasterEvents.forEach(event => {
      if (!eventsByCategory[event.category]) {
        eventsByCategory[event.category] = [];
      }
      eventsByCategory[event.category].push(event);
    });
    
    // Process Gemini activities
    if (geminiActivities.length > 0) {
      if (!eventsByCategory['Local Activities']) {
        eventsByCategory['Local Activities'] = [];
      }
      eventsByCategory['Local Activities'].push(...geminiActivities);
    }
    
    // Create categories array
    const categories = Object.keys(eventsByCategory).map(categoryName => {
      return {
        name: categoryName,
        events: eventsByCategory[categoryName].map(event => {
          // Remove category field from event object
          const { category, ...eventData } = event;
          return eventData;
        })
      };
    });
    
    // Generate planning tips
    const weatherTips = generateWeatherPlanningTips(weatherForecast);
    const additionalTips = generateAdditionalPlanningTips();
    const planningTips = [...weatherTips, ...additionalTips];
    
    // Create the activities document
    const activitiesData = {
      weekStartDate: startDate,
      weekEndDate: endDate,
      categories: categories,
      planningTips: planningTips,
      weatherForecast: weatherForecast
    };
    
    // Save to file
    fs.writeFileSync(outputFile, JSON.stringify(activitiesData, null, 2));
    console.log(`Data saved to ${outputFile}`);
    fs.appendFileSync(logFile, `Data saved to ${outputFile}\n`);
    
    // Log data structure
    fs.appendFileSync(logFile, 'Data Structure:\n');
    fs.appendFileSync(logFile, '----------------\n');
    fs.appendFileSync(logFile, `Categories: ${categories.length}\n`);
    
    // Log each category and event count
    categories.forEach(category => {
      fs.appendFileSync(logFile, `- ${category.name}: ${category.events.length} events\n`);
      
      // Log the first event in each category as an example
      if (category.events.length > 0) {
        const firstEvent = category.events[0];
        fs.appendFileSync(logFile, `  Example event: ${firstEvent.name}\n`);
        fs.appendFileSync(logFile, `    Date: ${firstEvent.date}\n`);
        fs.appendFileSync(logFile, `    Time: ${firstEvent.time}\n`);
        fs.appendFileSync(logFile, `    Venue: ${firstEvent.venue}\n`);
        fs.appendFileSync(logFile, `    Price: ${firstEvent.ticketPrice}\n`);
        fs.appendFileSync(logFile, `    Description: ${firstEvent.description}\n`);
      }
    });
    
    // Log total events
    const totalEvents = categories.reduce((total, category) => total + category.events.length, 0);
    fs.appendFileSync(logFile, `Total events: ${totalEvents}\n`);
    fs.appendFileSync(logFile, `Planning tips: ${planningTips.length}\n`);
    fs.appendFileSync(logFile, '----------------\n\n');
    
    fs.appendFileSync(logFile, '✅ Multi-API activities data generation completed successfully!\n');
    console.log('Multi-API activities data generation completed successfully!');
    
    return activitiesData;
  } catch (error) {
    console.error('Error generating activities data:', error);
    fs.appendFileSync(logFile, `❌ Error generating activities data: ${error.message}\n`);
    if (error.stack) {
      fs.appendFileSync(logFile, `Stack trace: ${error.stack}\n`);
    }
    throw error;
  }
}

// Run the script
generateActivitiesData()
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
