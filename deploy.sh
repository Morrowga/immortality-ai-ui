#!/bin/bash
set -e

echo "Deploying frontend..."
cd ~/immortality-ai-ui
git pull
npm install
npm run build
sudo systemctl restart immortality-frontend
echo "Frontend deployed."