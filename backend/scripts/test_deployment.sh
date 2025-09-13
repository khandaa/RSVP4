#!/bin/bash

# Script to test the deployment of frontend and backend services.

set -euo pipefail

# --- Configuration ---
RSVP_DOMAIN="rsvp.hiringtests.in"
RSVP_BACKEND_URL="http://127.0.0.1:5001"
WM_BACKEND_URL="http://127.0.0.1:5000"

# --- Colors for output ---
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# --- Counters for summary ---
PASSED_COUNT=0
FAILED_COUNT=0

# --- Helper function for tests ---
run_test() {
    local description="$1"
    local command="$2"
    
    echo -n "🧪 Testing: ${description}... "
    
    if eval "${command}"; then
        echo -e "${GREEN}PASSED${NC}"
        ((PASSED_COUNT++))
    else
        echo -e "${RED}FAILED${NC}"
        ((FAILED_COUNT++))
    fi
}

# --- Test Execution ---

echo "🚀 Starting Deployment Health Check..."

# --- Frontend Tests ---
echo -e "\n${YELLOW}--- Frontend Tests (${RSVP_DOMAIN}) ---${NC}"

# 1. Check if the main page is accessible
run_test "Frontend returns HTTP 200 OK" \
    "curl -s -o /dev/null -w '%{http_code}' https://${RSVP_DOMAIN} | grep -q '200'"

# 2. Check if the frontend content contains the app title
run_test "Frontend contains application title 'RSVP'" \
    "curl -s https://${RSVP_DOMAIN} | grep -q '<title>RSVP'"

# --- Backend Tests ---
echo -e "\n${YELLOW}--- Backend Tests ---${NC}"

# 1. Test RSVP backend health check
run_test "RSVP Backend (${RSVP_BACKEND_URL}/api/health) is healthy" \
    "curl -s ${RSVP_BACKEND_URL}/api/health | grep -q '{"status":"UP"}'"

# 2. Test WM backend health check
run_test "WM Backend (${WM_BACKEND_URL}/api/health) is healthy" \
    "curl -s ${WM_BACKEND_URL}/api/health | grep -q '{"status":"UP"}'"

# --- Summary ---
echo -e "\n${YELLOW}--- Test Summary ---${NC}"
if [ ${FAILED_COUNT} -eq 0 ]; then
    echo -e "${GREEN}✅ All ${PASSED_COUNT} tests passed successfully!${NC}"
    exit 0
else
    echo -e "${RED}❌ Test execution failed.${NC}"
    echo -e "- ${GREEN}Passed: ${PASSED_COUNT}${NC}"
    echo -e "- ${RED}Failed: ${FAILED_COUNT}${NC}"
    exit 1
fi
