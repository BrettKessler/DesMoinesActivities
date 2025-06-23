// API functions
const api = {
    // Base URL for API calls - adjust for production/development
    baseUrl: window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api',
    
    // Fetch activities from the API
    getActivities: async function() {
        try {
            const response = await fetch(`${this.baseUrl}/activities`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch activities');
            }
            
            return this.processActivities(data.data);
        } catch (error) {
            console.error('Error fetching activities:', error);
            throw error;
        }
    },
    
    // Process activities data from the API into a format the frontend expects
    processActivities: function(activitiesData) {
        const processedActivities = [];
        
        // If there's no data, return an empty array
        if (!activitiesData || !activitiesData.categories) {
            return [];
        }
        
        // Process each category and its events
        activitiesData.categories.forEach(category => {
            category.events.forEach(event => {
                processedActivities.push({
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
        
        return processedActivities;
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
    
    // Add ticket information if available
    if (activity.ticketPrice && activity.ticketLink) {
        html += `
            <div class="activity-ticket">🎟️ ${activity.ticketPrice} - <a href="${activity.ticketLink}" target="_blank" rel="noopener noreferrer">Buy Tickets</a></div>
        `;
    } else if (activity.ticketPrice) {
        html += `
            <div class="activity-ticket">🎟️ ${activity.ticketPrice}</div>
        `;
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
    
    // Load activities when page loads
    loadActivities();
    
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
    
    
    // Function to load and display activities
    async function loadActivities() {
        try {
            const activities = await api.getActivities();
            displayActivities(activities);
        } catch (error) {
            activitiesList.innerHTML = "<p class='error'>Error loading activities. Please refresh the page.</p>";
        }
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
    
});
