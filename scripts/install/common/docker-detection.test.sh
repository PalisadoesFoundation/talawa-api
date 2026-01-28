#!/bin/bash

##############################################################################
# Talawa API - Docker Detection Test Suite
#
# This test suite validates the docker detection functions.
# It uses mocking to simulate different Docker states and OS environments.
#
# Usage: ./docker-detection.test.sh
#
# Requirements: bash 4.0+
##############################################################################

# Remove set -e to handle test failures explicitly
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test statistics
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
LOG_OUTPUT=""

# Define required logger functions (mocks) before sourcing docker-detection.sh
# capture output to variable for assertion
info() { LOG_OUTPUT="${LOG_OUTPUT}INFO: $1\n"; }
warn() { LOG_OUTPUT="${LOG_OUTPUT}WARN: $1\n"; }
error() { LOG_OUTPUT="${LOG_OUTPUT}ERROR: $1\n"; }
success() { LOG_OUTPUT="${LOG_OUTPUT}SUCCESS: $1\n"; }

# Source the docker detection functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# We need to temporarily disable set -u when sourcing if the script uses unbound variables
set +u
source "$SCRIPT_DIR/docker-detection.sh"
set -u

##############################################################################
# Test framework functions
##############################################################################

test_start() {
    local test_name="$1"
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "Test $TESTS_RUN: $test_name ... "
    LOG_OUTPUT=""
    MOCK_DOCKER_INSTALLED="false"
    MOCK_DOCKER_RUNNING="false"
    OS_TYPE=""
}

test_pass() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo -e "${GREEN}✓ PASS${NC}"
}

test_fail() {
    local message="$1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo -e "${RED}✗ FAIL${NC}"
    echo -e "  ${RED}Reason: $message${NC}"
    echo -e "  Logs:\n$LOG_OUTPUT"
}

assert_log_contains() {
    local substring="$1"
    if [[ "$LOG_OUTPUT" != *"$substring"* ]]; then
        test_fail "Expected log to contain '$substring'"
        return 1
    fi
    return 0
}

##############################################################################
# Mocks setup
##############################################################################

# Mock command
command() {
    if [ "$1" = "-v" ]; then
        if [ "$2" = "docker" ]; then
            if [ "${MOCK_DOCKER_INSTALLED:-false}" = "true" ]; then
                return 0
            else
                return 1
            fi
        fi
    fi
    # Default behavior for other commands or flags if needed
    return 1
}

# Mock docker
docker() {
    if [ "$1" = "--version" ]; then
        echo "Docker version 20.10.x, build xxxxx"
        return 0
    elif [ "$1" = "info" ]; then
        if [ "${MOCK_DOCKER_RUNNING:-false}" = "true" ]; then
            return 0
        else
            return 1
        fi
    fi
    return 0
}

##############################################################################
# Test Cases
##############################################################################

# Test 1: Local mode bypass
test_start "check_docker_requirements succeeds in local mode"
if check_docker_requirements "local"; then
    if assert_log_contains "Local installation mode - skipping Docker setup"; then
        test_pass
    fi
else
    test_fail "Expected success in local mode"
fi

# Test 2: Docker installed and running
test_start "check_docker_requirements succeeds when Docker is running"
MOCK_DOCKER_INSTALLED="true"
MOCK_DOCKER_RUNNING="true"
if check_docker_requirements "docker"; then
    if assert_log_contains "Docker is already installed" && \
       assert_log_contains "Docker is running"; then
        test_pass
    fi
else
    test_fail "Expected success when Docker is running"
fi

# Test 3: Docker installed but not running (macOS)
test_start "check_docker_requirements fails when Docker not running (macOS)"
MOCK_DOCKER_INSTALLED="true"
MOCK_DOCKER_RUNNING="false"
OS_TYPE="macos"
if ! check_docker_requirements "docker"; then
    if assert_log_contains "Docker is installed but not running" && \
       assert_log_contains "Please launch Docker Desktop from Applications"; then
        test_pass
    fi
else
    test_fail "Expected failure when Docker is not running"
fi

# Test 4: Docker installed but not running (Linux)
test_start "check_docker_requirements fails when Docker not running (Linux)"
MOCK_DOCKER_INSTALLED="true"
MOCK_DOCKER_RUNNING="false"
OS_TYPE="linux"
if ! check_docker_requirements "docker"; then
    if assert_log_contains "Docker is installed but not running" && \
       assert_log_contains "Please start the Docker daemon"; then
        test_pass
    fi
else
    test_fail "Expected failure when Docker is not running"
fi

# Test 5: Docker not installed (macOS)
test_start "check_docker_requirements fails when Docker not installed (macOS)"
MOCK_DOCKER_INSTALLED="false"
OS_TYPE="macos"
if ! check_docker_requirements "docker"; then
    if assert_log_contains "Docker is not installed" && \
       assert_log_contains "Docker Desktop is required but not installed"; then
        test_pass
    fi
else
    test_fail "Expected failure when Docker is not installed"
fi

# Test 6: Docker not installed (Linux)
test_start "check_docker_requirements fails when Docker not installed (Linux)"
MOCK_DOCKER_INSTALLED="false"
OS_TYPE="linux"
if ! check_docker_requirements "docker"; then
    if assert_log_contains "Docker is not installed" && \
       assert_log_contains "Please install Docker for your platform"; then
        test_pass
    fi
else
    test_fail "Expected failure when Docker is not installed"
fi

##############################################################################
# Test Summary
##############################################################################

echo ""
echo "========================================================================"
echo "Test Summary"
echo "========================================================================"
echo "Total tests run:    $TESTS_RUN"
echo -e "Tests passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed:       ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
