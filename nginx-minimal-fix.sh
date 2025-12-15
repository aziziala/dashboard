#!/bin/bash

# Minimal fix for Nginx - just get it working without default site

set -e

if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo: sudo bash nginx-minimal-fix.sh"
    exit 1
fi

echo "Minimal Nginx Fix..."
echo ""

# Disable default site
if [ -L /etc/nginx/sites-enabled/default ]; then
    echo "Disabling default Nginx site..."
    rm -f /etc/nginx/sites-enabled/default
    echo "✓ Default site disabled"
fi

# Ensure directories exist
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

# Copy our config
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cp "$SCRIPT_DIR/nginx-dashboard.conf" /etc/nginx/sites-available/dashboard
rm -f /etc/nginx/sites-enabled/dashboard
ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/dashboard

# Test config
echo "Testing configuration..."
nginx -t

# Try to start
echo "Starting Nginx..."
systemctl start nginx || {
    echo "Start failed, checking logs..."
    journalctl -u nginx.service -n 20 --no-pager
    exit 1
}

systemctl enable nginx
echo "✓ Nginx is running!"
systemctl status nginx --no-pager | head -5


