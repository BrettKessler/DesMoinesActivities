# Des Moines Activities Newsletter

A weekly newsletter application that displays activities and events in Des Moines, Iowa. The application uses ChatGPT to generate a list of activities for the current week and displays them on a website.

## Features

- Weekly updates of Des Moines activities using ChatGPT
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
│   │   └── chatgpt.js       # ChatGPT integration
│   └── jobs/                # Scheduled jobs
│       └── weeklyUpdate.js  # Weekly ChatGPT fetch
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables (not committed)
├── .env.example             # Example environment variables
└── Procfile                 # Heroku deployment configuration
```

## Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- ChatGPT API key
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

4. Update the `.env` file with your MongoDB connection string and ChatGPT API key.

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

3. Set the ChatGPT API key:
   ```
   heroku config:set CHATGPT_API_KEY=your_chatgpt_api_key
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
