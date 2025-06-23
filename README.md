# Des Moines Activities Newsletter

A weekly newsletter application that displays activities and events in Des Moines, Iowa. The application uses multiple APIs (Ticketmaster, OpenWeather, and Google Gemini AI) to gather real-time data about events, weather, and local activities in Des Moines.

## Features

- Real-time events data from Ticketmaster API
- Weather forecast integration with OpenWeather API
- Enhanced local activities suggestions using Google Gemini AI
- MongoDB database for storing activities
- Node.js/Express backend API
- Responsive frontend design
- Automatic weekly updates via Heroku Scheduler

## Project Structure

```
des-moines-activities/
├── client/                  # Frontend (HTML/CSS/JS)
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── images/
│       └── logo.svg
├── server/                  # Backend (Node.js)
│   ├── server.js            # Main Express server
│   ├── models/              # MongoDB schemas
│   │   └── activity.js
│   ├── routes/              # API endpoints
│   │   └── activities.js
│   ├── services/            # Business logic
│   │   ├── chatgpt.js       # ChatGPT integration
│   │   ├── improved-chatgpt.js # Improved ChatGPT integration
│   │   └── multi-api.js     # Multi-API integration
│   └── jobs/                # Scheduled jobs
│       └── weeklyUpdate.js  # Weekly data update job
├── scripts/                 # Utility scripts
│   ├── generate-multi-api-activities.js # Generate activities without DB update
│   └── test-multi-api.js    # Test multi-API integration
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables (not committed)
├── .env.example             # Example environment variables
├── multi-api-integration-summary.md # Documentation of multi-API integration
└── Procfile                 # Heroku deployment configuration
```

## Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- API keys for:
  - ChatGPT API
  - Ticketmaster API
  - OpenWeather API
  - Google Gemini AI
- Heroku account (for deployment)

## Local Development Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd des-moines-activities
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Update the `.env` file with your MongoDB connection string and all required API keys (ChatGPT, Ticketmaster, OpenWeather, and Google Gemini AI).

5. Start the development server:
   ```
   npm run dev
   ```

6. The application will be available at `http://localhost:3000`.

## Running the Weekly Update Job Manually

To manually trigger the weekly update job:

```
npm run update-activities
```

## Deployment to Heroku

1. Create a new Heroku app:
   ```
   heroku create des-moines-activities
   ```

2. Add MongoDB add-on or set the MongoDB URI environment variable:
   ```
   heroku config:set MONGODB_URI=your_mongodb_connection_string
   ```

3. Set all required API keys:
   ```
   heroku config:set CHATGPT_API_KEY=your_chatgpt_api_key
   heroku config:set TICKETMASTER_API_KEY=your_ticketmaster_api_key
   heroku config:set OPENWEATHER_API_KEY=your_openweather_api_key
   heroku config:set GEMINI_API_KEY=your_gemini_api_key
   ```

4. Deploy to Heroku:
   ```
   git push heroku main
   ```

5. Set up the Heroku Scheduler add-on:
   ```
   heroku addons:create scheduler:standard
   ```

6. Configure the scheduler to run `node server/jobs/weeklyUpdate.js` every Sunday at midnight CST.

## License

MIT
