/**
 * Test script for the improved ChatGPT integration
 * This script demonstrates the improved prompt and parser working together
 */
require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

// Create a log file
const logFile = 'improved-integration-test.txt';
fs.writeFileSync(logFile, 'Improved ChatGPT Integration Test\n');
fs.appendFileSync(logFile, `Test started at: ${new Date().toISOString()}\n\n`);

// Mock the Activities model
const mockActivities = function(data) {
  this.weekStartDate = data.weekStartDate;
  this.weekEndDate = data.weekEndDate;
  this.categories = data.categories;
  this.planningTips = data.planningTips;
  this.rawResponse = data.rawResponse;
  
  // Mock the save method
  this.save = async function() {
    fs.appendFileSync(logFile, 'Mock save called - would save to database in production\n');
    return this;
  };
};

// Improved ChatGPT service with enhanced prompt and parser
const improvedChatGPTService = {
  Activities: mockActivities,
  
  /**
   * Get the current week's date range (Monday to Sunday)
   * @returns {Object} - The start and end dates of the current week
   */
  getCurrentWeekDateRange() {
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
  },
  
  /**
   * Generate the improved prompt for ChatGPT with the current date range
   * @param {Date} startDate - The start date of the week (Monday)
   * @param {Date} endDate - The end date of the week (Sunday)
   * @returns {string} - The formatted prompt
   */
  generatePrompt(startDate, endDate) {
    // Format dates as "Month Day, Year"
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    const startDateStr = startDate.toLocaleDateString('en-US', options);
    const endDateStr = endDate.toLocaleDateString('en-US', options);

    return `Generate a weekly, informational events newsletter for Des Moines and within 50 miles for the week of ${startDateStr}–${endDateStr}.

Include:

• Notable live-music shows
• Major festivals, family or outdoor events
• Brief planning tips (parking, weather, family-friendly notes)

IMPORTANT: You MUST format your response EXACTLY as follows to ensure proper parsing:

### LIVE MUSIC

**[Event Name]**
* Date: [specific date in format: Day of week, Month Day]
* Time: [specific time]
* Venue: [specific venue name]
* Tickets: [price information]
* Ticket Link: [ticket link]
* Description: [brief artist bio or event description]

### FESTIVALS & EVENTS

**[Event Name]**
* Date: [specific date in format: Day of week, Month Day]
* Time: [specific time or hours]
* Venue: [specific venue or location]
* Admission: [price information]
* Website: [event website if available]
* Description: [brief event description]

### PLANNING TIPS

* **[Topic]**: [tip details]
* **[Topic]**: [tip details]
* **[Topic]**: [tip details]

Do not deviate from this format. Each event must include ALL the fields listed above, even if you need to indicate "Free" for tickets or "TBD" for unknown information. Do not add any additional sections or change the formatting.`;
  },
  
  /**
   * Call the ChatGPT API with the given prompt
   * @param {string} prompt - The prompt to send to ChatGPT
   * @returns {Promise<string>} - The response from ChatGPT
   */
  async callChatGPT(prompt) {
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
            { role: 'system', content: 'You are a helpful assistant that provides information about events and activities in Des Moines, Iowa.' },
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
  },
  
  /**
   * Improved parser for the ChatGPT response
   * @param {string} response - The raw response from ChatGPT
   * @returns {Object} - Structured data for the database
   */
  parseResponse(response) {
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
      
      return "";
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
      
      return "";
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
      
      return "";
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
        
        for (let j = 1; j < eventBlocks.length; j++) {
          const eventBlock = eventBlocks[j].trim();
          const eventName = eventBlock.match(/\*\*([^*]+)\*\*/);
          const name = eventName ? eventName[1].trim() : `Event ${j}`;
          
          const event = {
            name: name,
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
        
        for (let j = 1; j < eventBlocks.length; j++) {
          const eventBlock = eventBlocks[j].trim();
          const eventName = eventBlock.match(/\*\*([^*]+)\*\*/);
          const name = eventName ? eventName[1].trim() : `Event ${j}`;
          
          const event = {
            name: name,
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
    
    return result;
  },
  
  /**
   * Validate and clean up the parsed data
   * @param {Object} parsedData - The data parsed from the ChatGPT response
   * @returns {Object} - The validated and cleaned data
   */
  validateParsedData(parsedData) {
    const validatedData = {
      categories: [],
      planningTips: parsedData.planningTips
    };
    
    // Process each category
    parsedData.categories.forEach(category => {
      const validCategory = {
        name: category.name,
        events: []
      };
      
      // Filter events with required fields
      category.events.forEach(event => {
        // Check if the event has the minimum required fields
        const hasName = !!event.name && event.name !== 'Event' && !event.name.startsWith('Event ');
        const hasDate = !!event.date && event.date !== 'TBD';
        const hasTime = !!event.time && event.time !== 'TBD';
        const hasVenue = !!event.venue && event.venue !== 'TBD';
        
        // Count how many required fields are present
        const requiredFieldsCount = [hasName, hasDate, hasTime, hasVenue].filter(Boolean).length;
        
        // Only include events that have at least 3 of the 4 required fields
        if (requiredFieldsCount >= 3) {
          validCategory.events.push(event);
        } else {
          fs.appendFileSync(logFile, `Filtered out event with insufficient data: ${event.name || 'Unnamed event'}\n`);
        }
      });
      
      // Only include categories that have at least one event
      if (validCategory.events.length > 0) {
        validatedData.categories.push(validCategory);
      }
    });
    
    return validatedData;
  },
  
  /**
   * Fetch activities from ChatGPT and store them in the database
   * @returns {Promise<Object>} - The saved activities
   */
  async fetchAndStoreActivities() {
    try {
      // Get the current week's date range
      const { startDate, endDate } = this.getCurrentWeekDateRange();
      
      // Generate the prompt
      const prompt = this.generatePrompt(startDate, endDate);
      
      // Log the prompt
      fs.appendFileSync(logFile, 'Generated Prompt:\n');
      fs.appendFileSync(logFile, '----------------\n');
      fs.appendFileSync(logFile, prompt + '\n');
      fs.appendFileSync(logFile, '----------------\n\n');
      
      // Call ChatGPT
      const response = await this.callChatGPT(prompt);
      
      // Log a preview of the response
      fs.appendFileSync(logFile, 'Response Preview (first 500 characters):\n');
      fs.appendFileSync(logFile, '----------------\n');
      fs.appendFileSync(logFile, response.substring(0, 500) + '...\n');
      fs.appendFileSync(logFile, '----------------\n\n');
      
      // Parse the response
      fs.appendFileSync(logFile, 'Parsing response...\n');
      const parsedData = this.parseResponse(response);
      
      // Validate and clean up the parsed data
      fs.appendFileSync(logFile, 'Validating parsed data...\n');
      const validatedData = this.validateParsedData(parsedData);
      
      // Log the parsed data structure
      fs.appendFileSync(logFile, 'Parsed Data Structure:\n');
      fs.appendFileSync(logFile, '----------------\n');
      fs.appendFileSync(logFile, `Categories: ${validatedData.categories.length}\n`);
      
      let totalEvents = 0;
      validatedData.categories.forEach(category => {
        const eventCount = category.events.length;
        totalEvents += eventCount;
        fs.appendFileSync(logFile, `- ${category.name}: ${eventCount} events\n`);
        
        // Log the first event in each category as an example
        if (category.events.length > 0) {
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
      fs.appendFileSync(logFile, `Planning tips: ${validatedData.planningTips.length}\n`);
      fs.appendFileSync(logFile, '----------------\n\n');
      
      // Create a new activities document
      const activities = new this.Activities({
        weekStartDate: startDate,
        weekEndDate: endDate,
        categories: validatedData.categories,
        planningTips: validatedData.planningTips,
        rawResponse: response
      });
      
      // Save to the database (mock)
      await activities.save();
      
      fs.appendFileSync(logFile, '✅ Activities successfully fetched and stored!\n');
      
      return activities;
    } catch (error) {
      fs.appendFileSync(logFile, `❌ Error fetching and storing activities: ${error.message}\n`);
      throw error;
    }
  }
};

// Run the test
async function runTest() {
  try {
    fs.appendFileSync(logFile, 'Starting improved integration test...\n\n');
    
    // Test the improved integration
    const activities = await improvedChatGPTService.fetchAndStoreActivities();
    
    fs.appendFileSync(logFile, '\nTest completed successfully!\n');
    console.log('Test completed successfully. Check improved-integration-test.txt for results.');
    
    return activities;
  } catch (error) {
    fs.appendFileSync(logFile, `\nTest failed: ${error.message}\n`);
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();
