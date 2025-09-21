#!/bin/bash

# Test nginx configuration
echo "Testing nginx configuration..."

if command -v nginx &> /dev/null; then
    echo "Found nginx locally, testing configuration..."
    nginx -t -c $(pwd)/nginx.conf
    if [ $? -eq 0 ]; then
        echo "✅ Nginx configuration is valid"
    else
        echo "❌ Nginx configuration has errors"
        exit 1
    fi
else
    echo "Nginx not found locally. Testing with Docker..."
    docker run --rm -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro nginx:alpine nginx -t
    if [ $? -eq 0 ]; then
        echo "✅ Nginx configuration is valid"
    else
        echo "❌ Nginx configuration has errors"
        exit 1
    fi
fi

echo "Testing docker-compose configuration..."
docker-compose config
if [ $? -eq 0 ]; then
    echo "✅ Docker-compose configuration is valid"
else
    echo "❌ Docker-compose configuration has errors"
    exit 1
fi

echo "🎉 All configurations are valid!"