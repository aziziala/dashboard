#!/bin/bash

# Fix script for Nginx installation issues
# This script will diagnose and fix common Nginx installation problems

set -e

echo "=========================================="
echo "Nginx Installation Fix Script"
echo "=========================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run this script with sudo:"
    echo "sudo bash fix-nginx-install.sh"
    exit 1
fi

# Step 1: Check Nginx status
echo "Step 1: Checking Nginx status..."
if systemctl is-active --quiet nginx 2>/dev/null; then
    echo "✓ Nginx is already running"
    systemctl status nginx --no-pager -l | head -n 5
else
    echo "⚠ Nginx is not running"
fi

echo ""

# Step 2: Check for port conflicts
echo "Step 2: Checking for port conflicts..."
if command -v lsof &> /dev/null; then
    PORT80=$(lsof -i :80 2>/dev/null | wc -l)
    PORT443=$(lsof -i :443 2>/dev/null | wc -l)
    if [ "$PORT80" -gt 0 ] || [ "$PORT443" -gt 0 ]; then
        echo "⚠ Warning: Ports 80 or 443 are in use:"
        lsof -i :80 -i :443 2>/dev/null || true
        echo ""
        echo "This might prevent Nginx from starting."
        echo "We'll configure Nginx to only use port 4200 for now."
    else
        echo "✓ Ports 80 and 443 are available"
    fi
elif command -v ss &> /dev/null; then
    if ss -tlnp | grep -q ":80\|:443"; then
        echo "⚠ Warning: Ports 80 or 443 are in use:"
        ss -tlnp | grep -E ":80|:443" || true
    else
        echo "✓ Ports 80 and 443 are available"
    fi
fi

echo ""

# Step 3: Check Nginx configuration
echo "Step 3: Testing Nginx configuration..."
if [ -f /etc/nginx/nginx.conf ]; then
    if nginx -t 2>&1 | grep -q "syntax is ok"; then
        echo "✓ Default Nginx configuration is valid"
    else
        echo "✗ Nginx configuration has errors:"
        nginx -t 2>&1 || true
        echo ""
        echo "Attempting to fix default configuration..."
        
        # Backup original config
        if [ ! -f /etc/nginx/nginx.conf.backup ]; then
            cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
            echo "✓ Backed up original config to /etc/nginx/nginx.conf.backup"
        fi
        
        # Disable default site if it exists and has issues
        if [ -L /etc/nginx/sites-enabled/default ]; then
            echo "Disabling default site..."
            rm -f /etc/nginx/sites-enabled/default
            echo "✓ Default site disabled"
        fi
    fi
else
    echo "⚠ Nginx config file not found at /etc/nginx/nginx.conf"
fi

echo ""

# Step 4: Create necessary directories
echo "Step 4: Creating necessary directories..."
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled
mkdir -p /var/log/nginx
mkdir -p /var/cache/nginx
mkdir -p /var/lib/nginx
echo "✓ Directories created"

echo ""

# Step 5: Fix Nginx configuration if needed
echo "Step 5: Ensuring Nginx config is correct..."
if [ -f /etc/nginx/nginx.conf ]; then
    # Check if sites-enabled is included
    if ! grep -q "include /etc/nginx/sites-enabled" /etc/nginx/nginx.conf; then
        echo "Adding sites-enabled include to nginx.conf..."
        # Add include directive before the last closing brace
        sed -i '/^http {/,/^}/ {
            /^}/ i\
    include /etc/nginx/sites-enabled/*;
        }' /etc/nginx/nginx.conf || {
            # Fallback: append at end of http block
            sed -i '/^}/ i\    include /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf
        }
        echo "✓ Added sites-enabled include"
    fi
fi

echo ""

# Step 6: Copy dashboard configuration
echo "Step 6: Setting up dashboard configuration..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONFIG_FILE="$SCRIPT_DIR/nginx-dashboard.conf"
TARGET_FILE="/etc/nginx/sites-available/dashboard"

if [ -f "$CONFIG_FILE" ]; then
    cp "$CONFIG_FILE" "$TARGET_FILE"
    echo "✓ Configuration copied to $TARGET_FILE"
    
    # Create symbolic link
    if [ -L "/etc/nginx/sites-enabled/dashboard" ]; then
        rm /etc/nginx/sites-enabled/dashboard
    fi
    ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/dashboard
    echo "✓ Symbolic link created"
else
    echo "✗ Error: Configuration file not found at $CONFIG_FILE"
    exit 1
fi

echo ""

# Step 7: Test configuration again
echo "Step 7: Testing final Nginx configuration..."
if nginx -t; then
    echo "✓ Nginx configuration is valid!"
else
    echo "✗ Nginx configuration test failed!"
    echo "Error details:"
    nginx -t 2>&1 || true
    echo ""
    echo "Please check the configuration files manually."
    exit 1
fi

echo ""

# Step 8: Try to start Nginx
echo "Step 8: Starting Nginx service..."
if systemctl start nginx 2>&1; then
    echo "✓ Nginx started successfully"
    systemctl enable nginx
    echo "✓ Nginx enabled to start on boot"
else
    echo "⚠ Failed to start Nginx. Checking error logs..."
    if [ -f /var/log/nginx/error.log ]; then
        echo "Last 10 lines of error log:"
        tail -10 /var/log/nginx/error.log
    fi
    journalctl -u nginx.service --no-pager -n 20 | tail -10 || true
    echo ""
    echo "Attempting to fix and retry..."
    
    # Try to fix common issues
    # Disable default site if it's causing issues
    if [ -L /etc/nginx/sites-enabled/default ]; then
        rm -f /etc/nginx/sites-enabled/default
        echo "Removed default site"
    fi
    
    # Try starting again
    if systemctl start nginx 2>&1; then
        echo "✓ Nginx started successfully after fixes"
        systemctl enable nginx
    else
        echo "✗ Still unable to start Nginx"
        echo "Please check the error logs manually:"
        echo "  sudo journalctl -u nginx.service -n 50"
        echo "  sudo tail -f /var/log/nginx/error.log"
        exit 1
    fi
fi

echo ""

# Step 9: Check status
echo "Step 9: Checking Nginx status..."
systemctl status nginx --no-pager -l | head -n 10

echo ""

# Step 10: Verify port 4200
echo "Step 10: Verifying port 4200..."
sleep 2
if command -v ss &> /dev/null; then
    if ss -tlnp | grep -q ":4200"; then
        echo "✓ Nginx is listening on port 4200"
        ss -tlnp | grep ":4200"
    else
        echo "⚠ Warning: Port 4200 is not listening yet"
        echo "This might be normal if there's a configuration issue"
    fi
elif command -v netstat &> /dev/null; then
    if netstat -tlnp | grep -q ":4200"; then
        echo "✓ Nginx is listening on port 4200"
        netstat -tlnp | grep ":4200"
    else
        echo "⚠ Warning: Port 4200 is not listening yet"
    fi
fi

echo ""
echo "=========================================="
echo "Fix Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Check Nginx status: sudo systemctl status nginx"
echo "2. View error logs if issues persist: sudo tail -f /var/log/nginx/error.log"
echo "3. Access your app through: http://192.168.2.2:4200"
echo ""


