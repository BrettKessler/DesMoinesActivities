/**
 * Script to test and improve the ChatGPT response parser
 * This script uses a sample response to test and improve the parsing logic
 */
require('dotenv').config();
const fs = require('fs');
const chatgptService = require('./server/services/chatgpt');

// Create a log file
const logFile = 'parser-improvement-test.txt';
fs.writeFileSync(logFile, 'ChatGPT Response Parser Improvement Test\n');
fs.appendFileSync(logFile, `Test started at: ${new Date().toISOString()}\n\n`);

// Sample response to test the parser
// This is a simplified example of what the ChatGPT API might return
const sampleResponse = `
# Des Moines Weekly Events Newsletter
## June 23-29, 2025

### LIVE MUSIC

**Monday, June 23**
* The Revivalists at Hoyt Sherman Place
  * Time: 8:00 PM
  * Tickets: Starting at $45
  * Ticket Link: [hoytsherman.org](https://hoytsherman.org)
  * Bio: New Orleans-based rock band known for their energetic live performances and soulful sound.

**Tuesday, June 24**
* Jazz Night at Noce
  * Time: 7:00 PM
  * Tickets: $15
  * Ticket Link: [nocedsm.com](https://nocedsm.com)
  * Bio: Weekly showcase featuring the best local jazz musicians in an intimate setting.

**Friday, June 27**
* Taylor Swift Tribute at Wells Fargo Arena
  * Time: 7:30 PM
  * Tickets: Starting at $35
  * Ticket Link: [iowaeventscenter.com](https://iowaeventscenter.com)
  * Bio: Celebrate the music of Taylor Swift with this high-energy tribute show.

### FESTIVALS & OUTDOOR EVENTS

**Des Moines Arts Festival**
* Dates: June 27-29, 2025
* Hours: Friday & Saturday 10 AM-10 PM, Sunday 10 AM-5 PM
* Location: Western Gateway Park
* Admission: Free
* Details: Annual arts festival featuring over 180 artists, live music, food vendors, and interactive activities.

**Farmers Market**
* Date: Saturday, June 28
* Hours: 7 AM-12 PM
* Location: Downtown Court Avenue District
* Admission: Free
* Details: Shop fresh produce, baked goods, and handcrafted items from over 300 vendors.

**Yoga in the Park**
* Date: Sunday, June 29
* Time: 9 AM-10 AM
* Location: Gray's Lake Park
* Admission: Free (donations welcome)
* Details: Bring your own mat for this all-levels outdoor yoga class.

### PLANNING TIPS

* **Parking**: Downtown parking is free on weekends. For the Arts Festival, consider using the free shuttle service from downtown parking garages.
* **Weather**: Forecast shows temperatures in the mid-80s with a chance of afternoon thunderstorms on Saturday. Bring sunscreen and a light rain jacket.
* **Family-Friendly Notes**: The Arts Festival has a dedicated kids' zone with activities throughout the day. The Farmers Market can get crowded with strollers, so consider baby carriers for small children.
`;

/**
 * Improved version of the parseResponse function
 * This function aims to better extract structured data from the ChatGPT response
 */
function improvedParseResponse(response) {
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
    
    return "Date not specified";
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
    
    return "Time not specified";
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
    
    return "Venue not specified";
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
  
  // Ensure all events have the required fields
  result.categories.forEach(category => {
    category.events = category.events.map(event => {
      // Set default values for required fields if they're missing
      if (!event.date || event.date === "Date not specified") {
        event.date = "TBD";
      }
      if (!event.time || event.time === "Time not specified") {
        event.time = "TBD";
      }
      if (!event.venue || event.venue === "Venue not specified") {
        event.venue = "TBD";
      }
      return event;
    });
  });
  
  return result;
}

// Test the improved parser with the sample response
try {
  fs.appendFileSync(logFile, 'Testing original parser...\n');
  const originalResult = chatgptService.parseResponse(sampleResponse);
  
  fs.appendFileSync(logFile, `Original parser found ${originalResult.categories.length} categories\n`);
  originalResult.categories.forEach(category => {
    fs.appendFileSync(logFile, `- ${category.name}: ${category.events.length} events\n`);
  });
  fs.appendFileSync(logFile, `Original parser found ${originalResult.planningTips.length} planning tips\n\n`);
  
  fs.appendFileSync(logFile, 'Testing improved parser...\n');
  const improvedResult = improvedParseResponse(sampleResponse);
  
  fs.appendFileSync(logFile, `Improved parser found ${improvedResult.categories.length} categories\n`);
  improvedResult.categories.forEach(category => {
    fs.appendFileSync(logFile, `- ${category.name}: ${category.events.length} events\n`);
    
    // Check for missing required fields
    let missingFields = 0;
    category.events.forEach(event => {
      if (!event.date || event.date === "TBD") missingFields++;
      if (!event.time || event.time === "TBD") missingFields++;
      if (!event.venue || event.venue === "TBD") missingFields++;
    });
    
    if (missingFields > 0) {
      fs.appendFileSync(logFile, `  ⚠️ Found ${missingFields} missing required fields in this category\n`);
    } else {
      fs.appendFileSync(logFile, `  ✅ All required fields present\n`);
    }
    
    // Log the first event as an example
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
  fs.appendFileSync(logFile, `Improved parser found ${improvedResult.planningTips.length} planning tips\n\n`);
  
  // Compare the results
  fs.appendFileSync(logFile, 'Comparison:\n');
  fs.appendFileSync(logFile, `Original parser: ${originalResult.categories.reduce((total, cat) => total + cat.events.length, 0)} total events\n`);
  fs.appendFileSync(logFile, `Improved parser: ${improvedResult.categories.reduce((total, cat) => total + cat.events.length, 0)} total events\n\n`);
  
  fs.appendFileSync(logFile, '✅ Parser improvement test completed successfully!\n');
  console.log('Parser improvement test completed. Check parser-improvement-test.txt for results.');
} catch (error) {
  fs.appendFileSync(logFile, `❌ Error testing parser: ${error.message}\n`);
  fs.appendFileSync(logFile, error.stack || '');
  console.error('Error testing parser:', error);
}
