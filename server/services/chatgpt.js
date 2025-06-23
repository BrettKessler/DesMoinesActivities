const axios = require('axios');
const Activities = require('../models/activity');

/**
 * Service to interact with ChatGPT API
 */
class ChatGPTService {
  constructor() {
    this.apiKey = process.env.CHATGPT_API_KEY;
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
  }

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

• Every notable live-music show with date, time, venue, starting ticket price, ticket link, and 1-sentence artist bio.

• Major festivals, family or outdoor events with dates, hours, location, and admission info.

• Brief planning tips (parking, weather, family-friendly notes).

Format it in sections with tables or lists so it's ready to email.`;
  }

  /**
   * Call the ChatGPT API with the prompt
   * @param {string} prompt - The prompt to send to ChatGPT
   * @returns {Promise<string>} - The response from ChatGPT
   */
  async callChatGPT(prompt) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates informative and accurate event listings.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling ChatGPT API:', error.response?.data || error.message);
      throw new Error('Failed to get response from ChatGPT');
    }
  }

  /**
   * Parse the ChatGPT response into structured data
   * @param {string} response - The raw response from ChatGPT
   * @returns {Object} - Structured data for the database
   */
  parseResponse(response) {
    // This is a simplified parser. In a real implementation,
    // you would need more sophisticated parsing based on the actual
    // format of the ChatGPT response.
    
    // For now, we'll create a basic structure with categories
    const categories = [];
    const planningTips = [];
    
    // Look for sections in the response
    const musicSection = response.match(/live-music show|music|concert/i);
    const festivalSection = response.match(/festival|family|outdoor/i);
    const tipsSection = response.match(/planning tips|tips|note/i);
    
    if (musicSection) {
      categories.push({
        name: 'Live Music',
        events: this.extractEvents(response, 'music')
      });
    }
    
    if (festivalSection) {
      categories.push({
        name: 'Festivals & Events',
        events: this.extractEvents(response, 'festival')
      });
    }
    
    // Extract planning tips
    if (tipsSection) {
      const tipsMatch = response.match(/planning tips:?([\s\S]*?)(?=\n\n|\n#|\n\*\*|$)/i);
      if (tipsMatch && tipsMatch[1]) {
        const tips = tipsMatch[1].split('\n').filter(tip => tip.trim().length > 0);
        planningTips.push(...tips.map(tip => tip.trim()));
      }
    }
    
    return {
      categories,
      planningTips
    };
  }
  
  /**
   * Extract events from a section of the response
   * @param {string} response - The full response
   * @param {string} type - The type of events to extract (music, festival, etc.)
   * @returns {Array} - Array of event objects
   */
  extractEvents(response, type) {
    const events = [];
    
    // This is a simplified extraction. In a real implementation,
    // you would need more sophisticated parsing based on the actual
    // format of the ChatGPT response.
    
    // Look for patterns like dates, venues, times, etc.
    const lines = response.split('\n');
    
    let currentEvent = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) continue;
      
      // Check if this line looks like the start of a new event
      const isNewEvent = /^\*|\-|\d+\.|\w+,\s\w+\s\d+/.test(trimmedLine);
      
      if (isNewEvent) {
        // Save the previous event if it exists
        if (currentEvent && currentEvent.name) {
          events.push(currentEvent);
        }
        
        // Start a new event
        currentEvent = {
          name: trimmedLine.replace(/^\*|\-|\d+\.|\s*/, ''),
          date: '',
          time: '',
          venue: '',
          ticketPrice: '',
          ticketLink: '',
          description: ''
        };
      } else if (currentEvent) {
        // Try to extract details for the current event
        if (/date|when/i.test(trimmedLine)) {
          currentEvent.date = this.extractValue(trimmedLine);
        } else if (/time/i.test(trimmedLine)) {
          currentEvent.time = this.extractValue(trimmedLine);
        } else if (/venue|location|place/i.test(trimmedLine)) {
          currentEvent.venue = this.extractValue(trimmedLine);
        } else if (/price|cost|ticket/i.test(trimmedLine)) {
          currentEvent.ticketPrice = this.extractValue(trimmedLine);
        } else if (/link|url|website/i.test(trimmedLine)) {
          currentEvent.ticketLink = this.extractValue(trimmedLine);
        } else if (currentEvent.description === '') {
          // If we haven't set a description yet, use this line
          currentEvent.description = trimmedLine;
        }
      }
    }
    
    // Add the last event if it exists
    if (currentEvent && currentEvent.name) {
      events.push(currentEvent);
    }
    
    return events;
  }
  
  /**
   * Extract a value from a line like "Date: June 25, 2025"
   * @param {string} line - The line to extract from
   * @returns {string} - The extracted value
   */
  extractValue(line) {
    const parts = line.split(/:|–|-/);
    return parts.length > 1 ? parts[1].trim() : line.trim();
  }

  /**
   * Get the current week's date range
   * @returns {Object} - Object with startDate and endDate
   */
  getCurrentWeekDateRange() {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
    
    // Calculate how many days to go back to get to Monday (or 0 if today is Monday)
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    // Get the date for Monday of the current week
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);
    
    // Get the date for Sunday of the current week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return {
      startDate: monday,
      endDate: sunday
    };
  }

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
      
      // Create a new activities document
      const activities = new Activities({
        weekStartDate: startDate,
        weekEndDate: endDate,
        categories: parsedData.categories,
        planningTips: parsedData.planningTips,
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
}

module.exports = new ChatGPTService();
