#!/bin/bash

# Setup script for Nginx reverse proxy configuration
# This script will copy the nginx config and set it up

set -e

echo "Setting up Nginx reverse proxy for dashboard..."

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run this script with sudo:"
    echo "sudo bash setup-nginx.sh"
    exit 1
fi

# Create directories if they don't exist
echo "Creating Nginx directories..."
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONFIG_FILE="$SCRIPT_DIR/nginx-dashboard.conf"
TARGET_FILE="/etc/nginx/sites-available/dashboard"

# Copy configuration file
if [ -f "$CONFIG_FILE" ]; then
    echo "Copying Nginx configuration..."
    cp "$CONFIG_FILE" "$TARGET_FILE"
    echo "Configuration copied to $TARGET_FILE"
else
    echo "Error: Configuration file not found at $CONFIG_FILE"
    exit 1
fi

# Create symbolic link
if [ -L "/etc/nginx/sites-enabled/dashboard" ]; then
    echo "Removing existing symbolic link..."
    rm /etc/nginx/sites-enabled/dashboard
fi

echo "Creating symbolic link..."
ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/dashboard
echo "Symbolic link created."

# Test Nginx configuration
echo "Testing Nginx configuration..."
if nginx -t; then
    echo "✓ Nginx configuration is valid!"
    echo ""
    echo "To apply the configuration, run:"
    echo "  sudo systemctl reload nginx"
    echo "  OR"
    echo "  sudo systemctl restart nginx"
    echo ""
    echo "To check Nginx status:"
    echo "  sudo systemctl status nginx"
else
    echo "✗ Nginx configuration test failed!"
    echo "Please check the configuration file and try again."
    exit 1
fi
