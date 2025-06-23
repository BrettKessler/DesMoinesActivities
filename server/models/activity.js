const mongoose = require('mongoose');

// Define a schema for individual events
const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    required: true,
    trim: true
  },
  time: {
    type: String,
    required: true,
    trim: true
  },
  venue: {
    type: String,
    required: true,
    trim: true
  },
  ticketPrice: {
    type: String,
    trim: true
  },
  ticketLink: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
});

// Define a schema for event categories
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  events: [eventSchema]
});

// Define a schema for weather forecast
const weatherForecastSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    trim: true
  },
  temp: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    }
  },
  weather: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  precipitation: {
    type: Number,
    default: 0
  }
});

// Define the main activities schema
const activitiesSchema = new mongoose.Schema({
  weekStartDate: {
    type: Date,
    required: true
  },
  weekEndDate: {
    type: Date,
    required: true
  },
  fetchedAt: {
    type: Date,
    default: Date.now
  },
  categories: [categorySchema],
  planningTips: [{
    type: String,
    trim: true
  }],
  weatherForecast: [weatherForecastSchema],
  rawResponse: {
    type: String
  }
});

// Create a static method to get the current week's activities
activitiesSchema.statics.getCurrentWeek = async function() {
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
  
  // Find activities for the current week
  return this.findOne({
    weekStartDate: { $lte: now },
    weekEndDate: { $gte: now }
  }).sort({ fetchedAt: -1 });
};

const Activities = mongoose.model('Activities', activitiesSchema);

module.exports = Activities;
