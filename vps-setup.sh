#!/bin/bash

# GoBudget VPS Setup Script
# Run this on your Hetzner VPS to prepare for deployment

echo "🚀 Setting up GoBudget VPS..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create project directory
echo "📁 Creating project directory..."
mkdir -p ~/gobudget
cd ~/gobudget

# Create external network if it doesn't exist
echo "🌐 Creating Docker network..."
docker network create portfolio_default 2>/dev/null || echo "Network already exists"

# Install git (if not already installed)
echo "📋 Installing git..."
sudo apt install -y git

echo "✅ VPS setup complete!"
echo ""
echo "Next steps:"
echo "1. Set up SSH key authentication from your local machine"
echo "2. Configure GitHub secrets"
echo "3. Push your code to trigger deployment"
echo ""
echo "For detailed instructions, see DEPLOYMENT.md"
