#!/bin/bash

# Complete installation and setup script for Nginx reverse proxy
# This script will install Nginx and configure it for the dashboard

set -e

echo "=========================================="
echo "Nginx Installation and Setup Script"
echo "=========================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run this script with sudo:"
    echo "sudo bash install-and-setup-nginx.sh"
    exit 1
fi

# Step 1: Install Nginx
echo "Step 1: Installing Nginx..."
if command -v nginx &> /dev/null; then
    echo "✓ Nginx is already installed"
    nginx -v
else
    echo "Installing Nginx..."
    apt update
    apt install -y nginx
    echo "✓ Nginx installed successfully"
    nginx -v
fi

echo ""

# Step 2: Start and enable Nginx service
echo "Step 2: Starting Nginx service..."
systemctl start nginx
systemctl enable nginx
echo "✓ Nginx service started and enabled"

echo ""

# Step 3: Create directories
echo "Step 3: Creating Nginx directories..."
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled
echo "✓ Directories created"

echo ""

# Step 4: Copy configuration file
echo "Step 4: Copying Nginx configuration..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONFIG_FILE="$SCRIPT_DIR/nginx-dashboard.conf"
TARGET_FILE="/etc/nginx/sites-available/dashboard"

if [ -f "$CONFIG_FILE" ]; then
    cp "$CONFIG_FILE" "$TARGET_FILE"
    echo "✓ Configuration copied to $TARGET_FILE"
else
    echo "✗ Error: Configuration file not found at $CONFIG_FILE"
    exit 1
fi

echo ""

# Step 5: Create symbolic link
echo "Step 5: Creating symbolic link..."
if [ -L "/etc/nginx/sites-enabled/dashboard" ]; then
    echo "Removing existing symbolic link..."
    rm /etc/nginx/sites-enabled/dashboard
fi

ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/dashboard
echo "✓ Symbolic link created"

echo ""

# Step 6: Check if default Nginx site conflicts
echo "Step 6: Checking for default Nginx site..."
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    echo "Warning: Default Nginx site is enabled and may conflict with port 80"
    echo "The dashboard config uses port 4100, so this should be fine."
    echo "If you want to disable the default site, run:"
    echo "  sudo rm /etc/nginx/sites-enabled/default"
fi

echo ""

# Step 7: Test Nginx configuration
echo "Step 7: Testing Nginx configuration..."
if nginx -t; then
    echo "✓ Nginx configuration is valid!"
else
    echo "✗ Nginx configuration test failed!"
    echo "Please check the configuration file and try again."
    exit 1
fi

echo ""

# Step 8: Reload Nginx
echo "Step 8: Reloading Nginx..."
systemctl reload nginx
echo "✓ Nginx reloaded successfully"

echo ""

# Step 9: Check Nginx status
echo "Step 9: Checking Nginx status..."
systemctl status nginx --no-pager -l | head -n 10

echo ""

# Step 10: Verify port 4100 is listening
echo "Step 10: Verifying port 4100..."
if command -v ss &> /dev/null; then
    if ss -tlnp | grep -q ":4100"; then
        echo "✓ Nginx is listening on port 4100"
        ss -tlnp | grep ":4100"
    else
        echo "⚠ Warning: Port 4100 is not listening. Check Nginx logs:"
        echo "  sudo tail -f /var/log/nginx/error.log"
    fi
elif command -v netstat &> /dev/null; then
    if netstat -tlnp | grep -q ":4100"; then
        echo "✓ Nginx is listening on port 4100"
        netstat -tlnp | grep ":4100"
    else
        echo "⚠ Warning: Port 4100 is not listening. Check Nginx logs:"
        echo "  sudo tail -f /var/log/nginx/error.log"
    fi
else
    echo "⚠ Could not verify port (ss/netstat not available)"
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Make sure your Angular app is running (on port 4200 or your configured port)"
echo "2. Access your app through: http://192.168.100.37:4100"
echo "3. The CORS errors should now be resolved!"
echo ""
echo "Useful commands:"
echo "  - Check Nginx status: sudo systemctl status nginx"
echo "  - View Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "  - Reload Nginx: sudo systemctl reload nginx"
echo "  - Restart Nginx: sudo systemctl restart nginx"
echo ""


