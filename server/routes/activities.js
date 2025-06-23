const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Activities = require('../models/activity');

// Simple in-memory storage for email subscriptions
// In a production app, this would be stored in a database
const subscribedEmails = new Set();

/**
 * @route   GET /api/activities
 * @desc    Get the current week's activities
 * @access  Public
 */
router.get('/activities', async (req, res) => {
  try {
    // Function to get live data from the JSON file
    const getLiveData = () => {
      const liveDataPath = path.join(__dirname, '../../live-activities-data.json');
      
      // Check if the file exists
      if (fs.existsSync(liveDataPath)) {
        const liveData = JSON.parse(fs.readFileSync(liveDataPath, 'utf8'));
        
        // Log the structure of liveData to debug
        console.log('Live data structure:', Object.keys(liveData));
        if (liveData.weatherForecast) {
          console.log('Weather forecast exists with', liveData.weatherForecast.length, 'days');
        } else {
          console.log('Weather forecast not found in live data');
        }
        
        // Ensure the weatherForecast property is included in the response
        const responseData = {
          ...liveData
        };
        
        // Log the response data structure
        console.log('Response data structure:', Object.keys(responseData));
        
        return responseData;
      }
      return null;
    };

    // Check if the useLiveData query parameter is set to true
    const useLiveData = req.query.useLiveData === 'true';
    
    if (useLiveData) {
      // Use the live data from the JSON file
      const liveData = getLiveData();
      
      if (liveData) {
        return res.json({
          success: true,
          data: liveData,
          source: 'live-data'
        });
      } else {
        console.warn('Live data file not found, falling back to database');
      }
    }
    
    try {
      // If not using live data or if live data file doesn't exist, try to use the database
      const activities = await Activities.getCurrentWeek();
      
      if (!activities) {
        // If no activities found in database, try to fall back to live data
        const liveData = getLiveData();
        if (liveData) {
          console.log('No activities in database, using live data as fallback');
          return res.json({
            success: true,
            data: liveData,
            source: 'live-data-fallback'
          });
        }
        
        return res.status(404).json({ 
          success: false, 
          message: 'No activities found for the current week' 
        });
      }
      
      res.json({
        success: true,
        data: activities,
        source: 'database'
      });
    } catch (dbError) {
      // If database query fails, fall back to live data
      console.error('Database error, falling back to live data:', dbError);
      const liveData = getLiveData();
      
      if (liveData) {
        return res.json({
          success: true,
          data: liveData,
          source: 'live-data-fallback'
        });
      }
      
      // If live data also fails, throw the original error
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/activities/live
 * @desc    Get the activities from the live data file
 * @access  Public
 */
router.get('/activities/live', (req, res) => {
  try {
    const liveDataPath = path.join(__dirname, '../../live-activities-data.json');
    
    // Check if the file exists
    if (!fs.existsSync(liveDataPath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Live activities data not found' 
      });
    }
    
    // Read the file
    const liveData = JSON.parse(fs.readFileSync(liveDataPath, 'utf8'));
    
    res.json({
      success: true,
      data: liveData
    });
  } catch (error) {
    console.error('Error fetching live activities:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/date-range
 * @desc    Get the current week's date range (Monday to Sunday)
 * @access  Public
 */
router.get('/date-range', (req, res) => {
  try {
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
    
    // Format the dates
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    const mondayStr = monday.toLocaleDateString('en-US', options);
    const sundayStr = sunday.toLocaleDateString('en-US', options);
    
    res.json({
      success: true,
      data: {
        startDate: monday,
        endDate: sunday,
        formattedRange: `${mondayStr} - ${sundayStr}`
      }
    });
  } catch (error) {
    console.error('Error calculating date range:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/subscribe
 * @desc    Subscribe an email to the newsletter
 * @access  Public
 */
router.post('/subscribe', (req, res) => {
  try {
    const { email } = req.body;
    
    // Basic validation
    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email address' 
      });
    }
    
    // Check if already subscribed
    if (subscribedEmails.has(email)) {
      return res.json({
        success: true,
        message: 'You are already subscribed to our newsletter!'
      });
    }
    
    // Add to subscribed emails
    subscribedEmails.add(email);
    
    // In a real app, you would save this to a database
    // and potentially trigger a welcome email
    
    res.json({
      success: true,
      message: 'Thank you for subscribing! Check your email for confirmation.'
    });
  } catch (error) {
    console.error('Error subscribing email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;
