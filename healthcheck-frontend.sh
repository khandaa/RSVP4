#!/bin/bash

# Frontend Healthcheck Script
# Tests the RSVP4 React frontend running on port 3000

set -e

FRONTEND_URL="http://localhost:3001"
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
            FRONTEND_URL="$2"
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
            echo "  -u, --url URL    Frontend URL (default: http://localhost:3000)"
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
    local check_content=${4:-""}

    log "Testing: $description"

    local curl_cmd="curl -s -w '%{http_code}:%{time_total}' --max-time $TIMEOUT $FRONTEND_URL$endpoint"

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
        # Check content if specified
        if [[ -n $check_content ]]; then
            if echo "$body" | grep -q "$check_content"; then
                success "$description - HTTP $http_code (${time_total}s) - Content check passed"
            else
                error "$description - HTTP $http_code (${time_total}s) - Content check failed"
                if [[ $VERBOSE == true ]]; then
                    echo "  Expected to find: $check_content"
                    echo "  Response body: ${body:0:200}..."
                fi
                return 1
            fi
        else
            success "$description - HTTP $http_code (${time_total}s)"
        fi

        if [[ $VERBOSE == true && -n $body ]]; then
            echo "  Response length: $(echo "$body" | wc -c) characters"
            echo "  First 200 chars: ${body:0:200}..."
        fi
        return 0
    else
        error "$description - Expected HTTP $expected_status, got $http_code (${time_total}s)"
        if [[ $VERBOSE == true && -n $body ]]; then
            echo "  Response body: ${body:0:200}..."
        fi
        return 1
    fi
}

# Check if content looks like a React app
check_react_content() {
    local response=$1
    local description=$2

    # Check for common React/HTML elements
    if echo "$response" | grep -q -i "<!DOCTYPE html>" && \
       echo "$response" | grep -q -i "<div id=\"root\"" && \
       echo "$response" | grep -q -i "react"; then
        success "$description - React app content detected"
        return 0
    elif echo "$response" | grep -q -i "<!DOCTYPE html>" && \
         echo "$response" | grep -q -i "<div id=\"root\""; then
        warning "$description - HTML detected but React not explicitly found"
        return 0
    else
        error "$description - Does not appear to be a React app"
        return 1
    fi
}

# Start healthcheck
echo "=================================================="
echo "⚛️  RSVP4 Frontend Healthcheck"
echo "=================================================="
echo "Frontend URL: $FRONTEND_URL"
echo "Timeout: ${TIMEOUT}s"
echo "Verbose: $VERBOSE"
echo "=================================================="

failed_tests=0
total_tests=0

# Basic connectivity and React app check
((total_tests++))
log "Testing: Frontend accessibility and React app detection"

curl_cmd="curl -s -w '%{http_code}:%{time_total}' --max-time $TIMEOUT $FRONTEND_URL/"
if [[ $VERBOSE == true ]]; then
    echo "  Command: $curl_cmd"
fi

response=$(eval $curl_cmd 2>/dev/null)
exit_code=$?

if [[ $exit_code -ne 0 ]]; then
    error "Frontend accessibility - Connection failed (exit code: $exit_code)"
    ((failed_tests++))
else
    http_code=$(echo "$response" | tail -c 12 | cut -d':' -f1)
    time_total=$(echo "$response" | tail -c 12 | cut -d':' -f2)
    body=$(echo "$response" | sed 's/...........$//')

    if [[ $http_code -eq 200 ]]; then
        success "Frontend accessibility - HTTP $http_code (${time_total}s)"

        # Check React content
        if check_react_content "$body" "React app detection"; then
            # Additional React-specific checks
            if echo "$body" | grep -q -i "RSVP" || echo "$body" | grep -q -i "EmployDEX"; then
                success "RSVP4 application branding detected"
            else
                warning "RSVP4 branding not explicitly found"
            fi
        else
            ((failed_tests++))
        fi
    else
        error "Frontend accessibility - Expected HTTP 200, got $http_code (${time_total}s)"
        ((failed_tests++))
    fi
fi

# Test static assets (common React build artifacts)
static_assets=(
    "/static/css" "CSS assets"
    "/static/js" "JavaScript assets"
    "/manifest.json" "Web app manifest"
    "/favicon.ico" "Favicon"
)

for ((i=0; i<${#static_assets[@]}; i+=2)); do
    asset_path="${static_assets[i]}"
    asset_desc="${static_assets[i+1]}"

    ((total_tests++))
    # For static assets, we expect either 200 (found) or 404 (not found but server responding)
    log "Testing: $asset_desc availability"

    curl_cmd="curl -s -w '%{http_code}:%{time_total}' --max-time $TIMEOUT $FRONTEND_URL$asset_path"
    if [[ $VERBOSE == true ]]; then
        echo "  Command: $curl_cmd"
    fi

    response=$(eval $curl_cmd 2>/dev/null)
    exit_code=$?

    if [[ $exit_code -ne 0 ]]; then
        error "$asset_desc - Connection failed (exit code: $exit_code)"
        ((failed_tests++))
    else
        http_code=$(echo "$response" | tail -c 12 | cut -d':' -f1)
        time_total=$(echo "$response" | tail -c 12 | cut -d':' -f2)

        if [[ $http_code -eq 200 ]]; then
            success "$asset_desc - Available (${time_total}s)"
        elif [[ $http_code -eq 404 ]]; then
            warning "$asset_desc - Not found (${time_total}s) - This is normal for dev server"
        else
            error "$asset_desc - Unexpected status $http_code (${time_total}s)"
            ((failed_tests++))
        fi
    fi
done

# Test React Router paths (should return the main app)
react_routes=(
    "/login" "Login route"
    "/dashboard" "Dashboard route"
    "/users" "Users route"
    "/customers" "Customers route"
)

for ((i=0; i<${#react_routes[@]}; i+=2)); do
    route_path="${react_routes[i]}"
    route_desc="${react_routes[i+1]}"

    ((total_tests++))
    log "Testing: $route_desc"

    curl_cmd="curl -s -w '%{http_code}:%{time_total}' --max-time $TIMEOUT $FRONTEND_URL$route_path"
    if [[ $VERBOSE == true ]]; then
        echo "  Command: $curl_cmd"
    fi

    response=$(eval $curl_cmd 2>/dev/null)
    exit_code=$?

    if [[ $exit_code -ne 0 ]]; then
        error "$route_desc - Connection failed (exit code: $exit_code)"
        ((failed_tests++))
    else
        http_code=$(echo "$response" | tail -c 12 | cut -d':' -f1)
        time_total=$(echo "$response" | tail -c 12 | cut -d':' -f2)
        body=$(echo "$response" | sed 's/...........$//')

        if [[ $http_code -eq 200 ]]; then
            # For React router, all routes should return the main HTML page
            if echo "$body" | grep -q -i "<!DOCTYPE html>" && echo "$body" | grep -q -i "<div id=\"root\""; then
                success "$route_desc - Returns React app (${time_total}s)"
            else
                error "$route_desc - Does not return React app (${time_total}s)"
                ((failed_tests++))
            fi
        else
            error "$route_desc - Expected HTTP 200, got $http_code (${time_total}s)"
            ((failed_tests++))
        fi
    fi
done

# Performance check
((total_tests++))
log "Testing: Response time performance"

curl_cmd="curl -s -w '%{time_total}' -o /dev/null --max-time $TIMEOUT $FRONTEND_URL/"
response_time=$(eval $curl_cmd 2>/dev/null)
exit_code=$?

if [[ $exit_code -ne 0 ]]; then
    error "Performance check - Connection failed"
    ((failed_tests++))
else
    response_time_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "0")
    if (( $(echo "$response_time < 2.0" | bc -l 2>/dev/null || echo "0") )); then
        success "Performance check - Response time: ${response_time}s (Good)"
    elif (( $(echo "$response_time < 5.0" | bc -l 2>/dev/null || echo "0") )); then
        warning "Performance check - Response time: ${response_time}s (Acceptable)"
    else
        error "Performance check - Response time: ${response_time}s (Slow)"
        ((failed_tests++))
    fi
fi

# Check if development server features are working
if [[ $FRONTEND_URL == *"localhost:3000"* ]]; then
    ((total_tests++))
    log "Testing: Development server hot reload indicator"

    # In development, React often includes development-specific content
    curl_cmd="curl -s --max-time $TIMEOUT $FRONTEND_URL/"
    body=$(eval $curl_cmd 2>/dev/null)

    if echo "$body" | grep -q -i "webpack\|hot.*reload\|development"; then
        success "Development server - Hot reload features detected"
    else
        warning "Development server - Hot reload features not detected (may be production build)"
    fi
fi

# Summary
echo "=================================================="
if [[ $failed_tests -eq 0 ]]; then
    success "All tests passed! ($total_tests/$total_tests)"
    echo "🎉 Frontend is healthy and serving the React application"

    # Additional info
    echo ""
    echo "Frontend appears to be:"
    if [[ $FRONTEND_URL == *"localhost:3000"* ]]; then
        echo "  • Running in development mode on port 3000"
    else
        echo "  • Running on: $FRONTEND_URL"
    fi
    echo "  • Serving React application with routing"
    echo "  • Responsive and accessible"

    exit 0
else
    error "Failed tests: $failed_tests/$total_tests"
    echo "❌ Frontend has issues that need attention"
    echo ""
    echo "Common issues to check:"
    echo "  • Is the React development server running?"
    echo "  • Are there any compilation errors?"
    echo "  • Is the correct port being used?"
    echo "  • Check browser console for JavaScript errors"

    exit 1
fi