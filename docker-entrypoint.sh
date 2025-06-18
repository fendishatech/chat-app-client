#!/bin/sh
set -e

echo "Starting tewedj-client container..."

# Function to replace environment variables in built files
replace_env_vars() {
    echo "Replacing environment variables in built files..."
    
    # Replace environment variables in JavaScript files
    find /usr/share/nginx/html -name "*.js" -exec sed -i "s|VITE_API_URL_PLACEHOLDER|${VITE_API_URL:-http://localhost:3000}|g" {} \;
    
    echo "Environment variables replaced successfully."
}

# Replace environment variables if they exist
if [ -n "$VITE_API_URL" ]; then
    replace_env_vars
fi

# Execute the main command
exec "$@" 