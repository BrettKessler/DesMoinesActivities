// API functions
const api = {
    // Base URL for API calls - adjust for production/development
    baseUrl: window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api',
    
    // Fetch activities from the API
    getActivities: async function(useLiveData = false) {
        try {
            const url = useLiveData 
                ? `${this.baseUrl}/activities?useLiveData=true` 
                : `${this.baseUrl}/activities`;
                
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch activities');
            }
            
            return {
                ...this.processActivities(data.data),
                source: data.source || 'unknown'
            };
        } catch (error) {
            console.error('Error fetching activities:', error);
            throw error;
        }
    },
    
    // Process activities data from the API into a format the frontend expects
    processActivities: function(activitiesData) {
        const result = {
            activities: [],
            planningTips: [],
            weatherForecast: []
        };
        
        // If there's no data, return an empty result
        if (!activitiesData) {
            return result;
        }
        
        // Process each category and its events
        if (activitiesData.categories) {
            activitiesData.categories.forEach(category => {
                category.events.forEach(event => {
                    result.activities.push({
                        id: event._id || Math.random().toString(36).substr(2, 9),
                        name: event.name,
                        date: event.date,
                        time: event.time,
                        location: event.venue,
                        description: event.description,
                        ticketPrice: event.ticketPrice,
                        ticketLink: event.ticketLink
                    });
                });
            });
        }
        
        // Process planning tips if available
        if (activitiesData.planningTips && Array.isArray(activitiesData.planningTips)) {
            result.planningTips = activitiesData.planningTips;
        }
        
        // Process weather forecast if available
        if (activitiesData.weatherForecast && Array.isArray(activitiesData.weatherForecast)) {
            result.weatherForecast = activitiesData.weatherForecast;
        }
        
        return result;
    },
    
    // Get the current week's date range
    getDateRange: async function() {
        try {
            const response = await fetch(`${this.baseUrl}/date-range`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch date range');
            }
            
            return data.data.formattedRange;
        } catch (error) {
            console.error('Error fetching date range:', error);
            
            // Fallback to calculating date range client-side
            return this.calculateDateRange();
        }
    },
    
    // Calculate date range as a fallback
    calculateDateRange: function() {
        const now = new Date();
        const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
        
        // Calculate how many days to go back to get to Monday (or 0 if today is Monday)
        const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
        
        // Get the date for Monday of the current week
        const monday = new Date(now);
        monday.setDate(now.getDate() - daysToMonday);
        
        // Get the date for Sunday of the current week
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        // Format the dates
        const options = { month: 'long', day: 'numeric', year: 'numeric' };
        const mondayStr = monday.toLocaleDateString('en-US', options);
        const sundayStr = sunday.toLocaleDateString('en-US', options);
        
        return `${mondayStr} - ${sundayStr}`;
    },
    
    // Email subscription
    subscribeEmail: async function(email) {
        try {
            const response = await fetch(`${this.baseUrl}/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Subscription failed');
            }
            
            return data;
        } catch (error) {
            console.error('Error subscribing:', error);
            
            // Fallback to simulated response for demo purposes
            if (!email || !email.includes('@')) {
                throw { error: "Invalid email address" };
            }
            
            return { 
                success: true, 
                message: "Thank you for subscribing! Check your email for confirmation." 
            };
        }
    }
};

// Function to format an activity for display
function formatActivity(activity) {
    let html = `
        <div class="activity-item">
            <div class="activity-name">${activity.name}</div>
            <div class="activity-date">📅 ${activity.date} | ${activity.time}</div>
            <div class="activity-location">📍 ${activity.location}</div>
    `;
    
    // Check if the event is free
    const isFree = activity.ticketPrice && 
                  (activity.ticketPrice.toLowerCase().includes('free') || 
                   activity.ticketPrice === '0' || 
                   activity.ticketPrice === '$0');
    
    // Ensure ticket link has http/https prefix
    let ticketLink = activity.ticketLink;
    if (ticketLink && !ticketLink.match(/^https?:\/\//i)) {
        ticketLink = 'https://' + ticketLink;
    }
    
    // Add ticket information if available
    if (activity.ticketPrice) {
        if (ticketLink && !isFree) {
            html += `
                <div class="activity-ticket">🎟️ ${activity.ticketPrice} - <a href="${ticketLink}" target="_blank" rel="noopener noreferrer">Buy Tickets</a></div>
            `;
        } else {
            html += `
                <div class="activity-ticket">🎟️ ${activity.ticketPrice}</div>
            `;
        }
    }
    
    html += `
            <div class="activity-description">${activity.description}</div>
        </div>
    `;
    
    return html;
}

// DOM Elements
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize hero button
    const exploreBtn = document.querySelector('.btn-primary');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
            document.getElementById('activities').scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    const subscribeForm = document.getElementById('subscribe-form');
    const emailInput = document.getElementById('email');
    const subscriptionMessage = document.getElementById('subscription-message');
    const activitiesList = document.getElementById('activities-list');
    const currentWeekRange = document.getElementById('current-week-range');
    
    // Update the current week range
    if (currentWeekRange) {
        try {
            // Try to get the date range from the API
            const dateRange = await api.getDateRange();
            currentWeekRange.textContent = dateRange;
        } catch (error) {
            console.error('Error getting date range:', error);
            // Fallback to empty or default text
            currentWeekRange.textContent = 'Current Week';
        }
    }
    
    // Get toggle state from localStorage or default to false
    const useLiveDataToggle = document.getElementById('use-live-data');
    const dataSourceIndicator = document.getElementById('data-source-indicator');
    
    // Initialize toggle state from localStorage
    useLiveDataToggle.checked = localStorage.getItem('useLiveData') === 'true';
    
    // Load activities when page loads
    loadActivities(useLiveDataToggle.checked);
    
    // Handle toggle change
    useLiveDataToggle.addEventListener('change', function() {
        // Save preference to localStorage
        localStorage.setItem('useLiveData', this.checked);
        
        // Reload activities with new setting
        loadActivities(this.checked);
    });
    
    // Handle subscription form submission
    subscribeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        try {
            // Show loading state
            subscriptionMessage.textContent = "Processing...";
            subscriptionMessage.className = "";
            subscriptionMessage.style.display = "block";
            
            // Call the API
            const response = await api.subscribeEmail(email);
            
            // Show success message
            subscriptionMessage.textContent = response.message;
            subscriptionMessage.className = "success";
            
            // Clear the form
            emailInput.value = "";
        } catch (error) {
            // Show error message
            subscriptionMessage.textContent = error.error;
            subscriptionMessage.className = "error";
        }
    });
    
    
    // Function to load and display activities, planning tips, and weather forecast
    async function loadActivities(useLiveData = false) {
        try {
            // Show loading state
            activitiesList.innerHTML = "<p class='loading'>Loading activities...</p>";
            document.getElementById('planning-tips-list').innerHTML = "<p class='loading'>Loading planning tips...</p>";
            document.getElementById('weather-forecast-container').innerHTML = "<p class='loading'>Loading weather forecast...</p>";
            
            const result = await api.getActivities(useLiveData);
            
            // Update data source indicator
            if (result.source) {
                dataSourceIndicator.textContent = result.source === 'live-data' ? 'Live Data' : 'Database';
                dataSourceIndicator.className = 'data-source-indicator ' + 
                    (result.source === 'live-data' ? 'live' : 'database');
            } else {
                dataSourceIndicator.textContent = '';
                dataSourceIndicator.className = 'data-source-indicator';
            }
            
            displayActivities(result.activities);
            displayPlanningTips(result.planningTips);
            displayWeatherForecast(result.weatherForecast);
        } catch (error) {
            activitiesList.innerHTML = "<p class='error'>Error loading activities. Please refresh the page.</p>";
            document.getElementById('planning-tips-list').innerHTML = "<p class='error'>Error loading planning tips. Please refresh the page.</p>";
            document.getElementById('weather-forecast-container').innerHTML = "<p class='error'>Error loading weather forecast. Please refresh the page.</p>";
            
            // Reset data source indicator
            dataSourceIndicator.textContent = 'Error';
            dataSourceIndicator.className = 'data-source-indicator';
        }
    }
    
    // Function to display weather forecast
    function displayWeatherForecast(forecast) {
        const weatherContainer = document.getElementById('weather-forecast-container');
        
        if (!forecast || forecast.length === 0) {
            weatherContainer.innerHTML = "<p>No weather forecast available.</p>";
            return;
        }
        
        let html = "";
        
        // Weather icons mapping
        const weatherIcons = {
            'Clear': '☀️',
            'Clouds': '☁️',
            'Rain': '🌧️',
            'Drizzle': '🌦️',
            'Thunderstorm': '⛈️',
            'Snow': '❄️',
            'Mist': '🌫️',
            'Fog': '🌫️',
            'Haze': '🌫️',
            'Smoke': '🌫️',
            'Dust': '🌫️',
            'Sand': '🌫️',
            'Ash': '🌫️',
            'Squall': '💨',
            'Tornado': '🌪️'
        };
        
        forecast.forEach(day => {
            const icon = weatherIcons[day.weather] || '🌡️';
            const precipitationChance = Math.round(day.precipitation);
            
            html += `
                <div class="weather-day">
                    <div class="weather-date">${day.date.split(',')[0]}</div>
                    <div class="weather-icon">${icon}</div>
                    <div class="weather-temp">${day.temp.min}°F - ${day.temp.max}°F</div>
                    <div class="weather-description">${day.description}</div>
                    <div class="weather-precipitation">
                        <span class="weather-precipitation-icon">💧</span> ${precipitationChance}%
                    </div>
                </div>
            `;
        });
        
        weatherContainer.innerHTML = html;
    }
    
    // Function to display activities in the list
    function displayActivities(activities) {
        if (!activities || activities.length === 0) {
            activitiesList.innerHTML = "<p>No upcoming activities found.</p>";
            return;
        }
        
        let html = "";
        
        activities.forEach(activity => {
            html += formatActivity(activity);
        });
        
        activitiesList.innerHTML = html;
    }
    
    // Function to display planning tips
    function displayPlanningTips(tips) {
        const planningTipsList = document.getElementById('planning-tips-list');
        
        if (!tips || tips.length === 0) {
            planningTipsList.innerHTML = "<p>No planning tips available.</p>";
            return;
        }
        
        let html = "<ul class='planning-tips'>";
        
        tips.forEach(tip => {
            html += `<li class="planning-tip">${tip}</li>`;
        });
        
        html += "</ul>";
        
        planningTipsList.innerHTML = html;
    }
    
});
