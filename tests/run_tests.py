#!/usr/bin/env python3
"""
GoBudget Test Runner
Runs all tests for the GoBudget application
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def run_command(command, description):
    """Run a command and return success status"""
    print(f"\n🔍 {description}")
    print(f"Running: {command}")

    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, cwd=os.getcwd())

        if result.returncode == 0:
            print(f"✅ {description} - PASSED")
            if result.stdout:
                print("Output:")
                print(result.stdout)
            return True
        else:
            print(f"❌ {description} - FAILED")
            if result.stderr:
                print("Error:")
                print(result.stderr)
            if result.stdout:
                print("Output:")
                print(result.stdout)
            return False

    except Exception as e:
        print(f"❌ {description} - ERROR: {e}")
        return False

def wait_for_service(url, service_name, max_attempts=30):
    """Wait for a service to be ready"""
    import requests

    print(f"⏳ Waiting for {service_name} to be ready at {url}")

    for attempt in range(max_attempts):
        try:
            response = requests.get(url, timeout=5)
            if response.status_code < 500:  # Accept any non-server error
                print(f"✅ {service_name} is ready!")
                return True
        except requests.exceptions.RequestException:
            pass

        print(f"Attempt {attempt + 1}/{max_attempts} - {service_name} not ready yet...")
        time.sleep(2)

    print(f"❌ {service_name} failed to start after {max_attempts} attempts")
    return False

def main():
    """Main test runner function"""
    print("🚀 Starting GoBudget Test Suite")
    print("=" * 50)

    # Change to the project root directory
    project_root = Path(__file__).parent.parent
    os.chdir(project_root)

    results = []

    # Test 1: Check if Docker services are running
    print("\n📋 Test 1: Docker Services Status")
    docker_running = run_command("docker-compose ps", "Check Docker services status")
    results.append(("Docker Services", docker_running))

    # Test 2: Wait for backend to be ready
    backend_ready = wait_for_service("http://localhost:8001/health", "Backend API")
    results.append(("Backend Ready", backend_ready))

    if not backend_ready:
        backend_ready = wait_for_service("http://localhost:8001/", "Backend API (fallback)")
        results.append(("Backend Ready (fallback)", backend_ready))

    # Test 3: Wait for frontend to be ready (if running)
    frontend_ready = wait_for_service("http://localhost:3001", "Frontend")
    results.append(("Frontend Ready", frontend_ready))

    # Test 4: Database connection test
    if backend_ready:
        print("\n📋 Test 4: Database Connection")
        db_test = run_command("python tests/test_database.py", "Database connection test")
        results.append(("Database Connection", db_test))
    else:
        print("\n⚠️ Skipping database test - backend not ready")
        results.append(("Database Connection", False))

    # Test 5: API endpoints test
    if backend_ready:
        print("\n📋 Test 5: API Endpoints")
        api_test = run_command("python tests/test_api.py", "API endpoints test")
        results.append(("API Endpoints", api_test))
    else:
        print("\n⚠️ Skipping API test - backend not ready")
        results.append(("API Endpoints", False))

    # Test 6: Upload functionality test
    if backend_ready:
        print("\n📋 Test 6: Upload Functionality")
        upload_test = run_command("python tests/test_upload.py", "Upload functionality test")
        results.append(("Upload Functionality", upload_test))
    else:
        print("\n⚠️ Skipping upload test - backend not ready")
        results.append(("Upload Functionality", False))

    # Test 7: Docker containers health check
    print("\n📋 Test 7: Container Health Check")
    health_check = run_command("docker-compose ps --filter 'status=running' | grep -c 'Up'", "Container health check")
    results.append(("Container Health", health_check))

    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)

    passed = 0
    total = len(results)

    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print("25")
        if success:
            passed += 1

    print(f"\n🎯 Overall: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! Your GoBudget application is working correctly.")
        return 0
    else:
        print("⚠️ Some tests failed. Please check the output above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
