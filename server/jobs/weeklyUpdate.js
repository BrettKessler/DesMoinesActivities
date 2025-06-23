const mongoose = require('mongoose');
require('dotenv').config();

// Import the multi-API service
const multiApiService = require('../services/multi-api');

/**
 * Weekly job to fetch activities from multiple APIs and store them in the database
 */
async function weeklyUpdateJob() {
  console.log('Starting weekly activities update job...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    
    // Fetch and store activities with retry
    const activities = await multiApiService.fetchAndStoreActivitiesWithRetry();
    
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

// Run the job
weeklyUpdateJob();
