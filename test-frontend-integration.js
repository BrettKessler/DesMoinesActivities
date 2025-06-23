/**
 * Test script to verify the integration of the improved ChatGPT service with the front end
 * This version uses a mock database instead of connecting to MongoDB
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

// Create a log file
const logFile = 'frontend-integration-test.txt';
fs.writeFileSync(logFile, 'Frontend Integration Test (Mock Database)\n');
fs.appendFileSync(logFile, `Test started at: ${new Date().toISOString()}\n\n`);

// Use live data if available, otherwise fall back to sample data
let activitiesData;
try {
  activitiesData = require('./live-activities-data.json');
  console.log('Using live activities data');
} catch (error) {
  console.log('Live activities data not found, using sample data');
  activitiesData = require('./sample-parsed-data.json');
}

// Mock database for testing
const mockDB = {
  activities: null
};

/**
 * Set up a test server to serve the sample data
 */
async function setupTestServer() {
  try {
    fs.appendFileSync(logFile, 'Setting up mock database\n');

    // Create a sample activities document
    const { startDate, endDate } = getCurrentWeekDateRange();
    
    // Create mock activities data
    mockDB.activities = {
      weekStartDate: startDate,
      weekEndDate: endDate,
      categories: activitiesData.categories,
      planningTips: activitiesData.planningTips,
      rawResponse: activitiesData.rawResponse || JSON.stringify(activitiesData)
    };
    
    fs.appendFileSync(logFile, 'Created mock activities data\n');
    const totalEvents = activitiesData.categories.reduce((total, category) => total + category.events.length, 0);
    fs.appendFileSync(logFile, `Data has ${totalEvents} events in ${activitiesData.categories.length} categories\n`);
    
    return startServer();
  } catch (error) {
    fs.appendFileSync(logFile, `Error setting up test server: ${error.message}\n`);
    console.error('Error setting up test server:', error);
    process.exit(1);
  }
}

/**
 * Start the test server with mock API routes
 */
function startServer() {
  // Initialize express app
  const app = express();
  const PORT = process.env.PORT || 3001; // Use port 3001 to avoid conflicts

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Mock API Routes
  app.get('/api/activities', (req, res) => {
    fs.appendFileSync(logFile, 'API request received: GET /api/activities\n');
    res.json({
      success: true,
      data: mockDB.activities
    });
  });

  app.get('/api/date-range', (req, res) => {
    fs.appendFileSync(logFile, 'API request received: GET /api/date-range\n');
    const { startDate, endDate } = getCurrentWeekDateRange();
    
    // Format the dates
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    const startDateStr = startDate.toLocaleDateString('en-US', options);
    const endDateStr = endDate.toLocaleDateString('en-US', options);
    
    res.json({
      success: true,
      data: {
        startDate: startDate,
        endDate: endDate,
        formattedRange: `${startDateStr} - ${endDateStr}`
      }
    });
  });

  app.post('/api/subscribe', (req, res) => {
    fs.appendFileSync(logFile, `API request received: POST /api/subscribe with email: ${req.body.email}\n`);
    res.json({
      success: true,
      message: 'Thank you for subscribing! Check your email for confirmation.'
    });
  });

  // Serve static files from the client directory
  app.use(express.static(path.join(__dirname, 'client')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/index.html'));
  });

  // Start the server
  const server = app.listen(PORT, () => {
    fs.appendFileSync(logFile, `Test server running on port ${PORT}\n`);
    fs.appendFileSync(logFile, `Open http://localhost:${PORT} in your browser to test the front end\n`);
    console.log(`Test server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser to test the front end`);
  });
  
  return server;
}

/**
 * Get the current week's date range
 * @returns {Object} - Object with startDate and endDate
 */
function getCurrentWeekDateRange() {
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

// Run the test
setupTestServer().then(server => {
  fs.appendFileSync(logFile, 'Test server started successfully\n');
  fs.appendFileSync(logFile, 'Press Ctrl+C to stop the server\n');
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    fs.appendFileSync(logFile, 'Shutting down test server...\n');
    server.close(() => {
      fs.appendFileSync(logFile, 'Test server stopped\n');
      fs.appendFileSync(logFile, 'Test completed\n');
      process.exit(0);
    });
  });
}).catch(error => {
  fs.appendFileSync(logFile, `Error running test: ${error.message}\n`);
  console.error('Error running test:', error);
  process.exit(1);
});
