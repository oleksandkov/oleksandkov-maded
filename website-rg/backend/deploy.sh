#!/bin/bash

# Server deployment script
echo "Deploying to production server..."

# Move to project root
cd "$(dirname "$0")/.." || exit 1

# Pull latest code from GitHub
git pull origin main

# Install dependencies
npm install --production

# Run database migrations
npm run seed

# Restart the application with PM2
pm2 restart company-site-api || pm2 start server.js --name company-site-api --interpreter node

# Reload Nginx configuration
sudo nginx -s reload

echo "Deployment completed!"