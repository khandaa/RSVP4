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
# In development, the backend typically returns 404 for root, but in production it serves the frontend
if ! test_endpoint "/" 404 "Basic connectivity (expecting 404 in dev mode)"; then
    # Try with 200 in case it's serving static files
    if ! test_endpoint "/" 200 "Basic connectivity (production mode)"; then
        ((failed_tests++))
    fi
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

# Enhanced authentication testing with multiple user types
log "Testing authentication with multiple credential types"

# Define test credentials
declare -A test_credentials=(
    ["admin"]='{"username":"admin","password":"Admin@123"}'
    ["full_access"]='{"username":"fa@employdex.com","password":"User@123"}'
    ["demo_user"]='{"username":"john.doe@employdex.com","password":"User@123"}'
)

# Function to get authentication token
get_auth_token() {
    local cred_name=$1
    local login_data=$2

    log "Attempting authentication for: $cred_name"

    if [[ $VERBOSE == true ]]; then
        echo "  Login data: $login_data"
    fi

    local token_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$login_data" "$BACKEND_URL/api/authentication/login" 2>/dev/null)
    local exit_code=$?

    if [[ $exit_code -ne 0 ]]; then
        error "Authentication request failed for $cred_name (curl exit code: $exit_code)"
        return 1
    fi

    if [[ $VERBOSE == true ]]; then
        echo "  Response: $token_response"
    fi

    # Check if response contains an error
    if echo "$token_response" | grep -q '"error"'; then
        local error_msg=$(echo "$token_response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "Unknown error")
        warning "Authentication failed for $cred_name: $error_msg"
        return 1
    fi

    # Extract token
    local token=$(echo "$token_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 2>/dev/null)

    if [[ -z "$token" ]]; then
        error "Could not extract token for $cred_name"
        if [[ $VERBOSE == true ]]; then
            echo "  Full response: $token_response"
        fi
        return 1
    fi

    success "Successfully authenticated $cred_name"

    # Extract user info for verification
    local user_email=$(echo "$token_response" | grep -o '"email":"[^"]*"' | cut -d'"' -f4 2>/dev/null)
    local user_roles=$(echo "$token_response" | grep -o '"roles":\[[^\]]*\]' | sed 's/"roles":/Roles: /' 2>/dev/null)

    if [[ $VERBOSE == true && -n "$user_email" ]]; then
        echo "  User: $user_email"
        if [[ -n "$user_roles" ]]; then
            echo "  $user_roles"
        fi
    fi

    echo "$token"
    return 0
}

# Function to test authenticated endpoints
test_authenticated_endpoints() {
    local token=$1
    local user_desc=$2
    local test_count_var=$3
    local failed_count_var=$4

    log "Testing authenticated endpoints for: $user_desc"

    # Core authenticated endpoints
    local -A auth_endpoints=(
        ["/api/user_management/users"]="User management"
        ["/api/customers"]="Customers listing"
        ["/api/clients"]="Clients listing"
        ["/api/events"]="Events listing"
        ["/api/logging/activities"]="Activity logs"
        ["/api/role_management/roles"]="Role management"
        ["/api/payment/qr-codes"]="Payment QR codes"
        ["/api/authentication/me"]="User profile"
    )

    for endpoint in "${!auth_endpoints[@]}"; do
        local description="${auth_endpoints[$endpoint]} ($user_desc)"

        eval "((${test_count_var}++))"
        if ! test_endpoint "$endpoint" 200 "$description" "GET" "" "Authorization: Bearer $token"; then
            eval "((${failed_count_var}++))"
        fi
    done

    # Test POST operations (should work for admin, may fail for others)
    if [[ $user_desc == *"admin"* ]]; then
        log "Testing admin-specific operations"

        # Test user creation (should fail due to missing data, but should be authorized)
        eval "((${test_count_var}++))"
        if ! test_endpoint "/api/user_management/users" 400 "User creation (missing data, admin)" "POST" '{}' "Content-Type: application/json, Authorization: Bearer $token"; then
            eval "((${failed_count_var}++))"
        fi

        # Test role creation (should fail due to missing data, but should be authorized)
        eval "((${test_count_var}++))"
        if ! test_endpoint "/api/role_management/roles" 400 "Role creation (missing data, admin)" "POST" '{}' "Content-Type: application/json, Authorization: Bearer $token"; then
            eval "((${failed_count_var}++))"
        fi
    fi

    # Test token validity with /me endpoint
    eval "((${test_count_var}++))"
    log "Verifying token validity with /me endpoint"

    local me_response=$(curl -s -H "Authorization: Bearer $token" "$BACKEND_URL/api/authentication/me" 2>/dev/null)
    local me_exit_code=$?

    if [[ $me_exit_code -eq 0 ]] && echo "$me_response" | grep -q '"user"'; then
        success "Token validation successful for $user_desc"

        if [[ $VERBOSE == true ]]; then
            local user_info=$(echo "$me_response" | grep -o '"email":"[^"]*"' | cut -d'"' -f4 2>/dev/null)
            if [[ -n "$user_info" ]]; then
                echo "  Verified user: $user_info"
            fi
        fi
    else
        error "Token validation failed for $user_desc"
        eval "((${failed_count_var}++))"

        if [[ $VERBOSE == true ]]; then
            echo "  Response: $me_response"
        fi
    fi
}

# Try to authenticate with different credential types
auth_success_count=0
tokens=()
user_descriptions=()

for cred_name in "${!test_credentials[@]}"; do
    ((total_tests++))

    token=$(get_auth_token "$cred_name" "${test_credentials[$cred_name]}")
    if [[ $? -eq 0 && -n "$token" ]]; then
        tokens+=("$token")
        user_descriptions+=("$cred_name")
        ((auth_success_count++))
    else
        ((failed_tests++))
    fi
done

# If we have at least one working token, test authenticated endpoints
if [[ $auth_success_count -gt 0 ]]; then
    success "Successfully authenticated $auth_success_count out of ${#test_credentials[@]} credential sets"

    # Test with the first successful token (usually admin)
    test_authenticated_endpoints "${tokens[0]}" "${user_descriptions[0]}" total_tests failed_tests

    # If we have multiple tokens, test a few key endpoints with different users
    if [[ ${#tokens[@]} -gt 1 ]]; then
        log "Testing endpoint access with different user roles"

        for i in "${!tokens[@]}"; do
            if [[ $i -gt 0 ]]; then  # Skip first token as it's already tested
                local token="${tokens[$i]}"
                local user_desc="${user_descriptions[$i]}"

                # Test a few key endpoints
                ((total_tests++))
                if ! test_endpoint "/api/authentication/me" 200 "Profile access ($user_desc)" "GET" "" "Authorization: Bearer $token"; then
                    ((failed_tests++))
                fi

                ((total_tests++))
                if ! test_endpoint "/api/customers" 200 "Customer access ($user_desc)" "GET" "" "Authorization: Bearer $token"; then
                    ((failed_tests++))
                fi
            fi
        done
    fi

    # Test token expiration and invalid token scenarios
    log "Testing security scenarios"

    # Test with invalid token
    ((total_tests++))
    if ! test_endpoint "/api/authentication/me" 403 "Invalid token handling" "GET" "" "Authorization: Bearer invalid-token-12345"; then
        ((failed_tests++))
    fi

    # Test with malformed authorization header
    ((total_tests++))
    if ! test_endpoint "/api/authentication/me" 401 "Missing token handling" "GET" "" "Authorization: Bearer"; then
        ((failed_tests++))
    fi

    # Test with no authorization header
    ((total_tests++))
    if ! test_endpoint "/api/authentication/me" 401 "No authorization header" "GET" "" ""; then
        ((failed_tests++))
    fi

else
    warning "No successful authentications - skipping authenticated endpoint tests"
    warning "This could indicate:"
    echo "  • Backend authentication service is not working"
    echo "  • Default credentials have been changed"
    echo "  • Database connection issues"
    echo "  • User accounts are disabled or don't exist"
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