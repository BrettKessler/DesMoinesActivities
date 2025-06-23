/**
 * Script to generate live activities data from ChatGPT API
 * This script makes a call to the ChatGPT API, parses the response,
 * and saves the structured data to a JSON file.
 */
require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

// Output file path
const outputFile = 'live-activities-data.json';

// Log file
const logFile = 'live-activities-generation.log';
fs.writeFileSync(logFile, 'Live Activities Generation Log\n');
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
 * Generate the improved prompt for ChatGPT with the current date range
 * @param {Date} startDate - The start date of the week (Monday)
 * @param {Date} endDate - The end date of the week (Sunday)
 * @returns {string} - The formatted prompt
 */
function generatePrompt(startDate, endDate) {
  // Format dates as "Month Day, Year"
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  const startDateStr = startDate.toLocaleDateString('en-US', options);
  const endDateStr = endDate.toLocaleDateString('en-US', options);

  return `Generate a list of all real, verified events happening within a 50-mile radius of Des Moines, Iowa for the week of [Month Day] to [Month Day] (Monday through Sunday).

  Include:
  • All concerts and live music (regardless of age restriction)
  • Festivals, art shows, food events, public markets
  • Theater, opera, comedy, and sports games
  • Theme parks, nightlife, pop-up events, community happenings
  
  All events must be **real** and **currently listed** on reputable sources like venue calendars, official city/organization websites, or verified ticketing platforms.
  
  For each event, include:
  
  • Event Name  
  • Date (Day of week, Month Day)  
  • Time  
  • Venue or Location  
  • Ticket/Admission Info (Free, $ amount, or TBD)  
  • Website or Ticket Link  
  • 1–2 sentence description (e.g., artist bio, event purpose, style, or theme)
  
  List **at least 20 events** across all types. Do not filter out based on age restrictions, time of day, or genre.
  
  ### PLANNING TIPS
  
  * **Parking & Transit**: [insert helpful tip based on expected event locations]  
  * **Weather Prep**: [insert weekly forecast guidance]  
  * **Other Considerations**: [highlight age restrictions, free options, etc.]
  
  Do not add or change any section formatting. All events must be confirmed as real and scheduled for this specific week in this region.
  `;
}

/**
 * Call the ChatGPT API with the given prompt
 * @param {string} prompt - The prompt to send to ChatGPT
 * @returns {Promise<string>} - The response from ChatGPT
 */
async function callChatGPT(prompt) {
  try {
    const apiKey = process.env.CHATGPT_API_KEY;
    
    if (!apiKey) {
      throw new Error('ChatGPT API key not found in environment variables');
    }
    
    fs.appendFileSync(logFile, 'Calling ChatGPT API...\n');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: `${prompt}`
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    fs.appendFileSync(logFile, 'Received response from ChatGPT API\n');
    
    return response.data.choices[0].message.content;
  } catch (error) {
    fs.appendFileSync(logFile, `Error calling ChatGPT API: ${error.message}\n`);
    if (error.response) {
      fs.appendFileSync(logFile, `Response status: ${error.response.status}\n`);
      fs.appendFileSync(logFile, `Response data: ${JSON.stringify(error.response.data)}\n`);
    }
    throw error;
  }
}

/**
 * Parse the ChatGPT response into structured data
 * @param {string} response - The raw response from ChatGPT
 * @returns {Object} - Structured data
 */
function parseResponse(response) {
  // Create the basic structure
  const result = {
    categories: [],
    planningTips: []
  };
  
  // Helper function to extract date from event text
  function extractDate(text) {
    // Look for date patterns
    const datePatterns = [
      /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/i,
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/i,
      /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}/i,
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/,
      /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+\d{1,2}/i
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) return match[0];
    }
    
    // If no specific date pattern is found, look for date ranges
    const dateRangeMatch = text.match(/\b(Dates|Date):\s*(.+?)(?=\n|$)/i);
    if (dateRangeMatch) return dateRangeMatch[2].trim();
    
    return "TBD"; // Default value
  }
  
  // Helper function to extract time from event text
  function extractTime(text) {
    // Look for time patterns
    const timePatterns = [
      /\b(Time|Hours):\s*(.+?)(?=\n|$)/i,
      /\b\d{1,2}:\d{2}\s*(AM|PM)\b/i,
      /\b\d{1,2}\s*(AM|PM)\b/i,
      /\b\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\s*(AM|PM)\b/i,
      /\b\d{1,2}\s*(AM|PM)\s*-\s*\d{1,2}\s*(AM|PM)\b/i,
      /\b\d{1,2}:\d{2}\s*(AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(AM|PM)\b/i
    ];
    
    for (const pattern of timePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (pattern.toString().includes('Time|Hours')) {
          return match[2].trim();
        }
        return match[0];
      }
    }
    
    return "TBD"; // Default value
  }
  
  // Helper function to extract venue from event text
  function extractVenue(text) {
    // Look for venue patterns
    const venuePatterns = [
      /\b(Location|Venue):\s*(.+?)(?=\n|$)/i,
      /\bat\s+([^,\n.]+)/i
    ];
    
    for (const pattern of venuePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (pattern.toString().includes('Location|Venue')) {
          return match[2].trim();
        }
        return match[1].trim();
      }
    }
    
    return "TBD"; // Default value
  }
  
  // Helper function to extract ticket price from event text
  function extractTicketPrice(text) {
    const pricePatterns = [
      /\b(Tickets|Admission|Price|Cost):\s*(.+?)(?=\n|$)/i,
      /\$\d+(\.\d{2})?/,
      /\$\d+\s*-\s*\$\d+/,
      /Starting at \$\d+/i,
      /Free/i
    ];
    
    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (pattern.toString().includes('Tickets|Admission|Price|Cost')) {
          return match[2].trim();
        }
        return match[0];
      }
    }
    
    return "Free"; // Default value
  }
  
  // Helper function to extract ticket link from event text
  function extractTicketLink(text) {
    const linkPatterns = [
      /\b(Ticket Link|Link|Website):\s*(.+?)(?=\n|$)/i,
      /\[(.*?)\]\((https?:\/\/[^\s)]+)\)/
    ];
    
    for (const pattern of linkPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (pattern.toString().includes('Ticket Link|Link|Website')) {
          return match[2].trim();
        } else if (pattern.toString().includes('\\[')) {
          return match[2]; // Return the URL from markdown link
        }
        return match[0];
      }
    }
    
    return ""; // Default value
  }
  
  // Helper function to extract description/bio from event text
  function extractDescription(text) {
    const bioPatterns = [
      /\b(Bio|Description|Details):\s*(.+?)(?=\n|$)/i
    ];
    
    for (const pattern of bioPatterns) {
      const match = text.match(pattern);
      if (match) return match[2].trim();
    }
    
    // If no specific bio pattern is found, use the last line as description
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      const lastLine = lines[lines.length - 1].trim();
      if (!lastLine.match(/^(Time|Date|Venue|Tickets|Link|Location|Hours|Admission)/i)) {
        return lastLine;
      }
    }
    
    return "No description available."; // Default value
  }
  
  // Split the response into sections
  const sections = response.split(/#{2,3}\s+/);
  
  // Process each section
  for (let i = 1; i < sections.length; i++) { // Start from 1 to skip the header
    const section = sections[i].trim();
    const sectionTitle = section.split('\n')[0].trim();
    const sectionContent = section.substring(sectionTitle.length).trim();
    
    if (sectionTitle.match(/live music|music|concerts|shows/i)) {
      // Process music events
      const category = {
        name: 'Live Music',
        events: []
      };
      
      // Split into individual events
      const eventBlocks = sectionContent.split(/\*\*[^*]+\*\*/);
      const eventNames = sectionContent.match(/\*\*([^*]+)\*\*/g) || [];
      
      for (let j = 1; j < eventBlocks.length; j++) {
        const eventBlock = eventBlocks[j].trim();
        const eventName = eventNames[j-1]?.replace(/\*\*/g, '').trim() || `Event ${j}`;
        
        const event = {
          name: eventName,
          date: extractDate(eventBlock),
          time: extractTime(eventBlock),
          venue: extractVenue(eventBlock),
          ticketPrice: extractTicketPrice(eventBlock),
          ticketLink: extractTicketLink(eventBlock),
          description: extractDescription(eventBlock)
        };
        
        category.events.push(event);
      }
      
      result.categories.push(category);
    } else if (sectionTitle.match(/festivals|events|outdoor|family/i)) {
      // Process festivals and events
      const category = {
        name: 'Festivals & Events',
        events: []
      };
      
      // Split into individual events
      const eventBlocks = sectionContent.split(/\*\*[^*]+\*\*/);
      const eventNames = sectionContent.match(/\*\*([^*]+)\*\*/g) || [];
      
      for (let j = 1; j < eventBlocks.length; j++) {
        const eventBlock = eventBlocks[j].trim();
        const eventName = eventNames[j-1]?.replace(/\*\*/g, '').trim() || `Event ${j}`;
        
        const event = {
          name: eventName,
          date: extractDate(eventBlock),
          time: extractTime(eventBlock),
          venue: extractVenue(eventBlock),
          ticketPrice: extractTicketPrice(eventBlock),
          ticketLink: extractTicketLink(eventBlock),
          description: extractDescription(eventBlock)
        };
        
        category.events.push(event);
      }
      
      result.categories.push(category);
    } else if (sectionTitle.match(/planning|tips|notes/i)) {
      // Process planning tips
      const tips = sectionContent.split(/\*\s+/).filter(tip => tip.trim().length > 0);
      
      tips.forEach(tip => {
        const tipText = tip.trim().replace(/^\*\*([^*]+)\*\*:/, '$1:');
        result.planningTips.push(tipText);
      });
    }
  }
  
  // If no categories were found using the section approach, try a different parsing strategy
  if (result.categories.length === 0) {
    // Look for event patterns in the entire response
    const musicEvents = [];
    const festivalEvents = [];
    
    // Extract events using regex patterns
    const eventPatterns = [
      /\*\s+([^\n]+)\n\s+\*\s+Time: ([^\n]+)\n\s+\*\s+(?:Tickets|Admission): ([^\n]+)\n\s+\*\s+(?:Ticket Link|Link|Website): ([^\n]+)\n\s+\*\s+(?:Bio|Description|Details): ([^\n]+)/g,
      /\*\*([^*]+)\*\*\n\s+\*\s+(?:Date|Dates): ([^\n]+)\n\s+\*\s+(?:Time|Hours): ([^\n]+)\n\s+\*\s+(?:Location|Venue): ([^\n]+)/g
    ];
    
    for (const pattern of eventPatterns) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        const eventText = match[0];
        
        if (eventText.match(/concert|music|band|artist|performance|show/i)) {
          musicEvents.push({
            name: match[1].trim(),
            date: extractDate(eventText),
            time: extractTime(eventText),
            venue: extractVenue(eventText),
            ticketPrice: extractTicketPrice(eventText),
            ticketLink: extractTicketLink(eventText),
            description: extractDescription(eventText)
          });
        } else {
          festivalEvents.push({
            name: match[1].trim(),
            date: extractDate(eventText),
            time: extractTime(eventText),
            venue: extractVenue(eventText),
            ticketPrice: extractTicketPrice(eventText),
            ticketLink: extractTicketLink(eventText),
            description: extractDescription(eventText)
          });
        }
      }
    }
    
    if (musicEvents.length > 0) {
      result.categories.push({
        name: 'Live Music',
        events: musicEvents
      });
    }
    
    if (festivalEvents.length > 0) {
      result.categories.push({
        name: 'Festivals & Events',
        events: festivalEvents
      });
    }
  }
  
  return result;
}

/**
 * Main function to generate live activities data
 */
async function generateLiveActivitiesData() {
  try {
    // Get the current week's date range
    const { startDate, endDate } = getCurrentWeekDateRange();
    
    // Use current date but remove the year to make it more generic
    const options = { month: 'long', day: 'numeric' };
    const startDateStr = startDate.toLocaleDateString('en-US', options);
    const endDateStr = endDate.toLocaleDateString('en-US', options);
    
    fs.appendFileSync(logFile, `Current week: ${startDateStr} to ${endDateStr}\n\n`);
    
    // Create the prompt for sample events
    const prompt = `Generate a full list of all public events happening within a 50-mile radius of Des Moines, Iowa during the week of [Month Day] to [Month Day] (Monday through Sunday). 

    Include:
    • All concerts and live music (regardless of age restriction)
    • Festivals, fairs, art shows, and public markets
    • Theater, opera, comedy, and nightlife events
    • Sports games, theme parks, pop-ups, community events
    
    List at least 20+ events with the following details for each:
    
    • Event Name
    • Date (formatted: Day of week, Month Day)
    • Time
    • Venue or location
    • Ticket/Admission Info (Free or $)
    • Website or Ticket Link
    • 1–2 sentence description
    
    Do **not** filter out events based on family-friendliness. Include 18+ and 21+ events as well. Do not omit any events due to venue type or time of day.`;
    
    fs.appendFileSync(logFile, 'Generated Prompt:\n');
    fs.appendFileSync(logFile, '----------------\n');
    fs.appendFileSync(logFile, prompt + '\n');
    fs.appendFileSync(logFile, '----------------\n\n');
    
    // Call ChatGPT API
    const response = await callChatGPT(prompt);
    
    // Log a preview of the response
    fs.appendFileSync(logFile, 'Response Preview (first 500 characters):\n');
    fs.appendFileSync(logFile, '----------------\n');
    fs.appendFileSync(logFile, response.substring(0, 500) + '...\n');
    fs.appendFileSync(logFile, '----------------\n\n');
    
    // Parse the response
    fs.appendFileSync(logFile, 'Parsing response...\n');
    const parsedData = parseResponse(response);
    
    // Check if we got any events
    let totalEvents = 0;
    parsedData.categories.forEach(category => {
      totalEvents += category.events.length;
    });
    
    // If no events were found, log an error but continue with empty data
    if (totalEvents === 0) {
      fs.appendFileSync(logFile, 'WARNING: No events found in the API response. The API may not have returned real events as requested.\n');
      fs.appendFileSync(logFile, 'Please check the raw response and consider adjusting the prompt or trying again later.\n');
      
      // Create empty categories if none exist
      if (parsedData.categories.length === 0) {
        parsedData.categories = [
          { name: 'Live Music', events: [] },
          { name: 'Festivals & Events', events: [] }
        ];
      }
      
      // Add a planning tip about the issue
      if (parsedData.planningTips.length === 0) {
        parsedData.planningTips.push('**Note**: Our event data service is currently experiencing issues. Please check official venue websites for the most up-to-date event information.');
      }
    } else if (totalEvents < 20) {
      // If fewer than 20 events were found, log a warning
      fs.appendFileSync(logFile, `WARNING: Only ${totalEvents} events found, which is fewer than the requested 20+ events.\n`);
      fs.appendFileSync(logFile, 'The API may not have returned all available events. Consider adjusting the prompt or trying again.\n');
    }
    
    // Log the parsed data structure
    fs.appendFileSync(logFile, 'Parsed Data Structure:\n');
    fs.appendFileSync(logFile, '----------------\n');
    fs.appendFileSync(logFile, `Categories: ${parsedData.categories.length}\n`);
    
    totalEvents = 0;
    parsedData.categories.forEach(category => {
      const eventCount = category.events.length;
      totalEvents += eventCount;
      fs.appendFileSync(logFile, `- ${category.name}: ${eventCount} events\n`);
      
      // Log the first event in each category as an example
      if (eventCount > 0) {
        const firstEvent = category.events[0];
        fs.appendFileSync(logFile, `  Example event: ${firstEvent.name}\n`);
        fs.appendFileSync(logFile, `    Date: ${firstEvent.date}\n`);
        fs.appendFileSync(logFile, `    Time: ${firstEvent.time}\n`);
        fs.appendFileSync(logFile, `    Venue: ${firstEvent.venue}\n`);
        fs.appendFileSync(logFile, `    Price: ${firstEvent.ticketPrice}\n`);
        fs.appendFileSync(logFile, `    Link: ${firstEvent.ticketLink}\n`);
        fs.appendFileSync(logFile, `    Description: ${firstEvent.description}\n`);
      }
    });
    
    fs.appendFileSync(logFile, `Total events: ${totalEvents}\n`);
    fs.appendFileSync(logFile, `Planning tips: ${parsedData.planningTips.length}\n`);
    fs.appendFileSync(logFile, '----------------\n\n');
    
    // Create the output data structure
    const outputData = {
      weekStartDate: startDate,
      weekEndDate: endDate,
      categories: parsedData.categories,
      planningTips: parsedData.planningTips,
      rawResponse: response
    };
    
    // Save to file
    fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
    fs.appendFileSync(logFile, `Data saved to ${outputFile}\n`);
    
    fs.appendFileSync(logFile, '✅ Live activities data generation completed successfully!\n');
    console.log(`Live activities data generated successfully. Check ${outputFile} for the data and ${logFile} for the log.`);
    
    return outputData;
  } catch (error) {
    fs.appendFileSync(logFile, `❌ Error generating live activities data: ${error.message}\n`);
    console.error('Error generating live activities data:', error);
    throw error;
  }
}

// Run the generator
generateLiveActivitiesData()
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
