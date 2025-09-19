#!/bin/bash

# Backend Healthcheck Script
# Tests the RSVP4 backend server running on port 5000

set -e

BACKEND_URL="http://localhost:5001"
TIMEOUT=10
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -u|--url)
            BACKEND_URL="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -v, --verbose    Enable verbose output"
            echo "  -u, --url URL    Backend URL (default: http://localhost:5000)"
            echo "  -t, --timeout N  Request timeout in seconds (default: 10)"
            echo "  -h, --help       Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Test function
test_endpoint() {
    local endpoint=$1
    local expected_status=${2:-200}
    local description=$3
    local method=${4:-GET}
    local data=$5
    local headers=$6

    log "Testing: $description"

    local curl_cmd="curl -s -w '%{http_code}:%{time_total}' --max-time $TIMEOUT"

    if [[ $method == "POST" ]]; then
        curl_cmd="$curl_cmd -X POST"
        if [[ -n $data ]]; then
            curl_cmd="$curl_cmd -d '$data'"
        fi
    fi

    if [[ -n $headers ]]; then
        curl_cmd="$curl_cmd -H '$headers'"
    fi

    curl_cmd="$curl_cmd $BACKEND_URL$endpoint"

    if [[ $VERBOSE == true ]]; then
        echo "  Command: $curl_cmd"
    fi

    local response=$(eval $curl_cmd 2>/dev/null)
    local exit_code=$?

    if [[ $exit_code -ne 0 ]]; then
        error "$description - Connection failed (exit code: $exit_code)"
        return 1
    fi

    local http_code=$(echo "$response" | tail -c 12 | cut -d':' -f1)
    local time_total=$(echo "$response" | tail -c 12 | cut -d':' -f2)
    local body=$(echo "$response" | sed 's/...........$//')

    if [[ $http_code -eq $expected_status ]]; then
        success "$description - HTTP $http_code (${time_total}s)"
        if [[ $VERBOSE == true && -n $body ]]; then
            echo "  Response: $body"
        fi
        return 0
    else
        error "$description - Expected HTTP $expected_status, got $http_code (${time_total}s)"
        if [[ $VERBOSE == true && -n $body ]]; then
            echo "  Response: $body"
        fi
        return 1
    fi
}

# Start healthcheck
echo "=================================================="
echo "🏥 RSVP4 Backend Healthcheck"
echo "=================================================="
echo "Backend URL: $BACKEND_URL"
echo "Timeout: ${TIMEOUT}s"
echo "Verbose: $VERBOSE"
echo "=================================================="

failed_tests=0
total_tests=0

# Basic connectivity test
((total_tests++))
if ! test_endpoint "/" 200 "Basic connectivity"; then
    ((failed_tests++))
fi

# Database health check
((total_tests++))
if ! test_endpoint "/api/database/health" 200 "Database connectivity"; then
    ((failed_tests++))
fi

# Authentication endpoints
((total_tests++))
if ! test_endpoint "/api/authentication/login" 400 "Login endpoint (missing credentials)" "POST"; then
    ((failed_tests++))
fi

# User management
((total_tests++))
if ! test_endpoint "/api/user_management/users" 401 "User management (unauthorized)"; then
    ((failed_tests++))
fi

# Role management
((total_tests++))
if ! test_endpoint "/api/role_management/roles" 401 "Role management (unauthorized)"; then
    ((failed_tests++))
fi

# Master data
((total_tests++))
if ! test_endpoint "/api/master-data/countries" 200 "Master data - countries"; then
    ((failed_tests++))
fi

# Payment module
((total_tests++))
if ! test_endpoint "/api/payment/qr-codes" 401 "Payment QR codes (unauthorized)"; then
    ((failed_tests++))
fi

# Logging module
((total_tests++))
if ! test_endpoint "/api/logging/activities" 401 "Activity logs (unauthorized)"; then
    ((failed_tests++))
fi

# Core entities (should require auth)
((total_tests++))
if ! test_endpoint "/api/customers" 401 "Customers endpoint (unauthorized)"; then
    ((failed_tests++))
fi

((total_tests++))
if ! test_endpoint "/api/clients" 401 "Clients endpoint (unauthorized)"; then
    ((failed_tests++))
fi

((total_tests++))
if ! test_endpoint "/api/events" 401 "Events endpoint (unauthorized)"; then
    ((failed_tests++))
fi

# Test with valid credentials (if available)
if [[ -f "tests/user-credentials.csv" ]]; then
    log "Testing authenticated endpoints with demo credentials"

    # Get admin token
    admin_login='{"email":"admin@employdex.com","password":"Admin@123"}'
    token_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$admin_login" "$BACKEND_URL/api/authentication/login" 2>/dev/null || echo "")

    if [[ -n "$token_response" ]]; then
        token=$(echo "$token_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "")

        if [[ -n "$token" ]]; then
            success "Obtained admin authentication token"

            # Test authenticated endpoints
            ((total_tests++))
            if ! test_endpoint "/api/user_management/users" 200 "User management (authenticated)" "GET" "" "Authorization: Bearer $token"; then
                ((failed_tests++))
            fi

            ((total_tests++))
            if ! test_endpoint "/api/customers" 200 "Customers (authenticated)" "GET" "" "Authorization: Bearer $token"; then
                ((failed_tests++))
            fi

            ((total_tests++))
            if ! test_endpoint "/api/logging/activities" 200 "Activity logs (authenticated)" "GET" "" "Authorization: Bearer $token"; then
                ((failed_tests++))
            fi
        else
            warning "Could not extract authentication token"
        fi
    else
        warning "Could not authenticate with demo credentials"
    fi
fi

# Summary
echo "=================================================="
if [[ $failed_tests -eq 0 ]]; then
    success "All tests passed! ($total_tests/$total_tests)"
    echo "🎉 Backend is healthy and responsive"
    exit 0
else
    error "Failed tests: $failed_tests/$total_tests"
    echo "❌ Backend has issues that need attention"
    exit 1
fi