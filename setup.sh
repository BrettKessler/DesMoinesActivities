#!/bin/bash

# Des Moines Activities Newsletter Setup Script

echo "=== Des Moines Activities Newsletter Setup ==="
echo "This script will help you set up the project for local development."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Node.js version $NODE_VERSION detected. This project requires Node.js v18 or higher."
    exit 1
fi

echo "Node.js v$(node -v | cut -d 'v' -f 2) detected."
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please update the .env file with your MongoDB connection string and ChatGPT API key."
else
    echo ".env file already exists."
    echo "Please make sure your MongoDB connection string and ChatGPT API key are set in the .env file."
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Update the .env file with your MongoDB connection string and ChatGPT API key."
echo "2. Start the development server with: npm run dev"
echo "3. Access the application at: http://localhost:3000"
echo ""
echo "To manually trigger the weekly update job: npm run update-activities"
echo ""
echo "For deployment to Heroku, follow the instructions in the README.md file."
echo ""
