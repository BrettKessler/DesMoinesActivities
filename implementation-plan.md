# ChatGPT API Integration Implementation Plan

## Overview

This document outlines the recommended steps to improve the ChatGPT API integration in the Des Moines Activities application. Based on our testing, we've identified several areas for improvement to make the integration more robust and reliable.

## Implementation Steps

### 1. Replace the Current Parser

The current parser in `server/services/chatgpt.js` doesn't reliably extract all required fields from the ChatGPT response. Replace the `parseResponse` method with the improved version from `improve-response-parser.js`.

```javascript
// In server/services/chatgpt.js

/**
 * Parse the ChatGPT response into structured data
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
```

### 2. Enhance the Prompt

Modify the `generatePrompt` method in `server/services/chatgpt.js` to request a more structured format:

```javascript
/**
 * Generate the prompt for ChatGPT with the current date range
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
}
```

### 3. Add Validation Layer

Add a validation method to the ChatGPT service to filter out events with too many missing fields:

```javascript
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
        console.log(`Filtered out event with insufficient data: ${event.name || 'Unnamed event'}`);
      }
    });
    
    // Only include categories that have at least one event
    if (validCategory.events.length > 0) {
      validatedData.categories.push(validCategory);
    }
  });
  
  return validatedData;
}
```

Then update the `fetchAndStoreActivities` method to use this validation:

```javascript
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
    
    // Call ChatGPT
    const response = await this.callChatGPT(prompt);
    
    // Parse the response
    const parsedData = this.parseResponse(response);
    
    // Validate and clean up the parsed data
    const validatedData = this.validateParsedData(parsedData);
    
    // Create a new activities document
    const activities = new Activities({
      weekStartDate: startDate,
      weekEndDate: endDate,
      categories: validatedData.categories,
      planningTips: validatedData.planningTips,
      rawResponse: response
    });
    
    // Save to the database
    await activities.save();
    
    return activities;
  } catch (error) {
    console.error('Error fetching and storing activities:', error);
    throw error;
  }
}
```

### 4. Implement Error Recovery

Add a retry mechanism for when the API response doesn't parse well:

```javascript
/**
 * Fetch activities from ChatGPT with retry mechanism
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Object>} - The saved activities
 */
async fetchAndStoreActivitiesWithRetry(maxRetries = 2) {
  let retryCount = 0;
  let lastError = null;
  
  while (retryCount <= maxRetries) {
    try {
      // Get the current week's date range
      const { startDate, endDate } = this.getCurrentWeekDateRange();
      
      // Generate the prompt (with more structure on retries)
      let prompt = this.generatePrompt(startDate, endDate);
      if (retryCount > 0) {
        prompt += `\n\nPrevious attempt failed to parse correctly. Please ensure STRICT adherence to the format specified above. Each event MUST include ALL required fields with the exact field names provided. If information is unknown, use "TBD" rather than omitting the field.`;
      }
      
      // Call ChatGPT
      const response = await this.callChatGPT(prompt);
      
      // Parse the response
      const parsedData = this.parseResponse(response);
      
      // Validate and clean up the parsed data
      const validatedData = this.validateParsedData(parsedData);
      
      // Check if we have enough valid data
      const totalEvents = validatedData.categories.reduce(
        (sum, category) => sum + category.events.length, 0
      );
      
      if (totalEvents < 3 && retryCount < maxRetries) {
        // Not enough valid events, retry
        console.log(`Only found ${totalEvents} valid events. Retrying...`);
        retryCount++;
        continue;
      }
      
      // Create a new activities document
      const activities = new Activities({
        weekStartDate: startDate,
        weekEndDate: endDate,
        categories: validatedData.categories,
        planningTips: validatedData.planningTips,
        rawResponse: response
      });
      
      // Save to the database
      await activities.save();
      
      return activities;
    } catch (error) {
      lastError = error;
      console.error(`Error on attempt ${retryCount + 1}:`, error);
      
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Retrying (${retryCount}/${maxRetries})...`);
      } else {
        break;
      }
    }
  }
  
  // If we get here, all retries failed
  throw lastError || new Error('Failed to fetch and store activities after multiple attempts');
}
```

Update the weekly update job to use this new method:

```javascript
// In server/jobs/weeklyUpdate.js
async function weeklyUpdateJob() {
  console.log('Starting weekly activities update job...');
  
  try {
    // Fetch and store activities with retry
    const activities = await chatgptService.fetchAndStoreActivitiesWithRetry();
    
    console.log(`Successfully updated activities for week of ${activities.weekStartDate.toISOString()} to ${activities.weekEndDate.toISOString()}`);
    console.log(`Added ${activities.categories.reduce((total, category) => total + category.events.length, 0)} events in ${activities.categories.length} categories`);
    
    // Exit successfully
    process.exit(0);
  } catch (error) {
    console.error('Error in weekly update job:', error);
    
    // Exit with error
    process.exit(1);
  }
}
```

### 5. Set Up Automated Tests

Create a test file for the ChatGPT service:

```javascript
// In tests/chatgpt.service.test.js
const chai = require('chai');
const expect = chai.expect;
const chatgptService = require('../server/services/chatgpt');

describe('ChatGPT Service', () => {
  describe('parseResponse', () => {
    it('should parse a well-formatted response correctly', () => {
      const sampleResponse = `
# Des Moines Weekly Events Newsletter
## June 23-29, 2025

### LIVE MUSIC

**Monday, June 23**
* The Revivalists at Hoyt Sherman Place
  * Date: Monday, June 23
  * Time: 8:00 PM
  * Venue: Hoyt Sherman Place
  * Tickets: Starting at $45
  * Ticket Link: [hoytsherman.org](https://hoytsherman.org)
  * Description: New Orleans-based rock band known for their energetic live performances and soulful sound.
`;
      
      const result = chatgptService.parseResponse(sampleResponse);
      
      expect(result).to.have.property('categories');
      expect(result.categories).to.be.an('array');
      expect(result.categories.length).to.be.at.least(1);
      
      const musicCategory = result.categories.find(c => c.name === 'Live Music');
      expect(musicCategory).to.exist;
      expect(musicCategory.events).to.be.an('array');
      expect(musicCategory.events.length).to.be.at.least(1);
      
      const event = musicCategory.events[0];
      expect(event).to.have.property('name', 'The Revivalists at Hoyt Sherman Place');
      expect(event).to.have.property('date', 'Monday, June 23');
      expect(event).to.have.property('time', '8:00 PM');
      expect(event).to.have.property('venue', 'Hoyt Sherman Place');
    });
    
    it('should handle missing fields gracefully', () => {
      const sampleResponse = `
# Des Moines Weekly Events Newsletter
## June 23-29, 2025

### LIVE MUSIC

**Monday, June 23**
* The Revivalists
  * Time: 8:00 PM
  * Tickets: Starting at $45
`;
      
      const result = chatgptService.parseResponse(sampleResponse);
      
      expect(result).to.have.property('categories');
      expect(result.categories).to.be.an('array');
      
      const musicCategory = result.categories.find(c => c.name === 'Live Music');
      if (musicCategory && musicCategory.events.length > 0) {
        const event = musicCategory.events[0];
        expect(event).to.have.property('name');
        expect(event).to.have.property('time', '8:00 PM');
        expect(event).to.have.property('date');
        expect(event).to.have.property('venue');
      }
    });
  });
  
  describe('validateParsedData', () => {
    it('should filter out events with insufficient data', () => {
      const parsedData = {
        categories: [
          {
            name: 'Live Music',
            events: [
              {
                name: 'Complete Event',
                date: 'Monday, June 23',
                time: '8:00 PM',
                venue: 'Hoyt Sherman Place'
              },
              {
                name: 'Incomplete Event',
                date: 'TBD',
                time: 'TBD',
                venue: 'TBD'
              }
            ]
          }
        ],
        planningTips: ['Tip 1', 'Tip 2']
      };
      
      const result = chatgptService.validateParsedData(parsedData);
      
      expect(result.categories[0].events.length).to.equal(1);
      expect(result.categories[0].events[0].name).to.equal('Complete Event');
    });
  });
});
```

## Additional Recommendations

1. **Logging**: Implement more detailed logging to track API responses and parsing results.

2. **Monitoring**: Set up monitoring for the weekly job to alert if it fails.

3. **Documentation**: Update the documentation to reflect the changes made to the ChatGPT service.

4. **Backup Strategy**: Implement a backup strategy for when the ChatGPT API is unavailable or returns unusable data.

## Conclusion

By implementing these changes, the Des Moines Activities application will have a more robust and reliable ChatGPT API integration. The improved parser will better extract structured data from the API responses, and the validation layer will ensure that only high-quality data is saved to the database.
