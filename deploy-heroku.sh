#!/bin/bash

# Des Moines Activities Newsletter Heroku Deployment Script

echo "=== Des Moines Activities Newsletter Heroku Deployment ==="
echo "This script will help you deploy the application to Heroku."
echo ""

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "Heroku CLI is not installed. Please install it first:"
    echo "https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if user is logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "You are not logged in to Heroku. Please login first:"
    heroku login
fi

# Ask for app name
read -p "Enter a name for your Heroku app (e.g., des-moines-activities): " APP_NAME

# Create Heroku app
echo "Creating Heroku app: $APP_NAME..."
heroku create $APP_NAME

# Add MongoDB add-on
echo "Would you like to add a MongoDB add-on? (y/n)"
read ADD_MONGODB

if [[ $ADD_MONGODB == "y" || $ADD_MONGODB == "Y" ]]; then
    echo "Adding MongoDB add-on..."
    heroku addons:create mongolab:sandbox --app $APP_NAME
    
    # Get MongoDB URI
    MONGODB_URI=$(heroku config:get MONGODB_URI --app $APP_NAME)
    echo "MongoDB URI: $MONGODB_URI"
else
    echo "Please set your MongoDB URI manually:"
    read -p "Enter your MongoDB URI: " MONGODB_URI
    
    # Set MongoDB URI
    heroku config:set MONGODB_URI="$MONGODB_URI" --app $APP_NAME
fi

# Set ChatGPT API key
read -p "Enter your ChatGPT API key: " CHATGPT_API_KEY
heroku config:set CHATGPT_API_KEY="$CHATGPT_API_KEY" --app $APP_NAME

# Set environment to production
heroku config:set NODE_ENV=production --app $APP_NAME

# Add Heroku Scheduler add-on
echo "Adding Heroku Scheduler add-on..."
heroku addons:create scheduler:standard --app $APP_NAME

echo ""
echo "=== Deployment Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Push your code to Heroku:"
echo "   git init"
echo "   git add ."
echo "   git commit -m 'Initial commit'"
echo "   git push heroku main"
echo ""
echo "2. Configure the Heroku Scheduler to run the weekly update job:"
echo "   heroku addons:open scheduler --app $APP_NAME"
echo "   Add a new job with the command: node server/jobs/weeklyUpdate.js"
echo "   Set it to run every Sunday at midnight CST (adjust for UTC time)"
echo ""
echo "3. Open your app:"
echo "   heroku open --app $APP_NAME"
echo ""
