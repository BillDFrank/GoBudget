#!/bin/bash

# GoBudget Health Check Script
# Run this after deployment to verify everything is working

echo "🔍 Checking GoBudget deployment health..."

# Check if services are running
echo "📊 Checking Docker services..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ Docker services are running"
else
    echo "❌ Docker services are not running"
    exit 1
fi

# Wait a moment for services to be ready
sleep 5

# Check backend health
echo "🔧 Checking backend API..."
if curl -f -s http://localhost:8001/ > /dev/null; then
    echo "✅ Backend API is responding"
else
    echo "❌ Backend API is not responding"
    exit 1
fi

# Check frontend health
echo "🌐 Checking frontend..."
if curl -f -s http://localhost:3001/ > /dev/null; then
    echo "✅ Frontend is responding"
else
    echo "❌ Frontend is not responding"
    exit 1
fi

# Check database connection
echo "🗄️ Checking database connection..."
if docker-compose exec -T postgres pg_isready -U gobudget > /dev/null; then
    echo "✅ Database is accessible"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Check nginx (if configured)
echo "🔒 Checking nginx proxy..."
if curl -f -s -k https://localhost/ > /dev/null; then
    echo "✅ Nginx proxy is working"
else
    echo "⚠️ Nginx proxy check failed (might be expected if SSL not configured)"
fi

echo ""
echo "🎉 All health checks passed!"
echo ""
echo "Your GoBudget application should be accessible at:"
echo "- Local: http://localhost"
echo "- Production: https://gobudget.duckdns.org"
echo ""
echo "API Documentation: http://localhost:8000/docs"
