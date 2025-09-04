#!/bin/bash

# GoBudget Local Test Runner
# Run this script to execute all tests locally

echo "🚀 GoBudget Local Test Runner"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Install test dependencies if needed
echo "📦 Installing test dependencies..."
pip install -r tests/requirements.txt

# Start services with Docker Compose
echo "🐳 Starting services with Docker Compose..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run the comprehensive test suite
echo "🧪 Running comprehensive test suite..."
python tests/run_tests.py

# Get the exit code
exit_code=$?

# Stop services
echo "🛑 Stopping services..."
docker-compose down

# Report results
if [ $exit_code -eq 0 ]; then
    echo ""
    echo "🎉 All tests passed!"
else
    echo ""
    echo "❌ Some tests failed. Check the output above for details."
fi

exit $exit_code
