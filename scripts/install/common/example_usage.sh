#!/usr/bin/env bash
# Example: How to use progress indicators in installation scripts

set -euo pipefail

# Source the logging library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/logging.sh"

# Start installation
print_banner "Example Installation Script"

# Example 1: Simple timed operation
print_section "Checking System Requirements"
with_timer "System check" sleep 1

# Example 2: Operation with spinner
print_section "Downloading Dependencies"
with_spinner "Fetching packages" sleep 2

# Example 3: Combined timer and spinner for long operations
print_section "Building Application"
with_timer "Build process" with_spinner "Compiling source code" sleep 3

# Example 4: Multiple steps with timing
print_step "1" "3" "Installing Node modules"
with_timer "npm install" sleep 1

print_step "2" "3" "Running database migrations"
with_timer "Database migration" with_spinner "Applying schema changes" sleep 2

print_step "3" "3" "Configuring environment"
with_timer "Environment setup" sleep 1

# Example 5: Handling failures (script won't exit if checked in if-statement)
print_step "4" "4" "Optional verification"
if ! with_timer "Optional check" bash -c "exit 1"; then
  warn "Optional check failed, but installation continues..."
fi

# Display final summaries
print_timing_summary
print_installation_summary
print_log_location

info "Installation completed successfully!"
