#!/usr/bin/env bash
set -euo pipefail

# Guard against multiple sourcing to preserve the stack and state
if [ -z "${__TALAWA_ERROR_HANDLING_SOURCED:-}" ]; then
    __TALAWA_ERROR_HANDLING_SOURCED=1

    declare -a __CLEANUP_STACK=()
    # Use a user-specific state directory to avoid permission issues and collisions
    # This ensures that if multiple users run the script on the same machine, they don't conflict
    __STATE_DIR="${TMPDIR:-/tmp}/talawa-install-state-${USER:-$(id -un)}"

    # Create state directory with secure permissions (700)
    # This prevents other users from manipulating the installation state
    if [ ! -d "$__STATE_DIR" ]; then
        mkdir -p "$__STATE_DIR"
        chmod 700 "$__STATE_DIR"
    fi

    # register_cleanup_task
    #
    # Adds a command to the cleanup stack to be executed on failure.
    # The stack operates in LIFO (Last In, First Out) order.
    #
    # Arguments:
    #   $1 - The command string to execute during cleanup.
    #
    # Security Note:
    #   The command string is executed using 'eval'. Callers must ensure that
    #   the input does not contain untrusted user input or malicious shell metacharacters.
    #   Basic validation is performed to reject obvious shell injection patterns.
    register_cleanup_task() { 
        local cmd="$*"
        
        # Basic validation to reject obvious shell injection patterns if the input is meant to be simple
        # This checks for common metacharacters that might indicate injection attempts
        if [[ "$cmd" =~ [\|\&] ]]; then
             printf "✗ ERROR: Cleanup task contains potentially unsafe characters (|&): %s\n" "$cmd" >&2
             return 1
        fi

        # Store the command as a single string in the cleanup stack
        __CLEANUP_STACK+=("$cmd"); 
    }

    # cleanup_on_error
    #
    # Executes all registered cleanup tasks in reverse order (LIFO).
    # This function is typically called by signal traps (ERR, INT, TERM).
    #
    # Usage:
    #   cleanup_on_error
    cleanup_on_error() {
      printf "✗ ERROR: Installation failed; running cleanup...\n" >&2
      local i=$(( ${#__CLEANUP_STACK[@]} - 1 ))
      # Execute cleanup tasks in LIFO (Last In, First Out) order
      while [ "$i" -ge 0 ]; do
        # Execute the cleanup command
        # Note: 'eval' is used here to allow complex shell commands to be stored and executed.
        # Security Note: Ensure that inputs to register_cleanup_task do not contain untrusted user input.
        eval "${__CLEANUP_STACK[$i]}" || true
        i=$((i-1))
      done
    }

    # setup_error_handling
    #
    # Sets up signal traps to ensure cleanup_on_error is called when:
    # - A command fails (ERR)
    # - The script is interrupted (INT, TERM)
    #
    # Usage:
    #   setup_error_handling
    setup_error_handling() {
      # Trap ERR signal to catch command failures
      trap 'cleanup_on_error' ERR
      # Trap INT (Ctrl+C) and TERM signals to handle interruptions gracefully
      # Use 130 for INT (128+2) and 143 for TERM (128+15)
      trap 'cleanup_on_error; exit 130' INT
      trap 'cleanup_on_error; exit 143' TERM
      # Trap EXIT to ensure we can do any final cleanup if needed (currently a no-op)
      trap 'true' EXIT
    }

    # run_idempotent
    #
    # Executes a command only if it hasn't been successfully completed before.
    # Uses a marker file in the state directory to track completion.
    #
    # Arguments:
    #   $1 - A unique key identifying the step (must not be empty).
    #   $@ - The command to execute.
    #
    # Returns:
    #   0 if the step was skipped or completed successfully.
    #   Non-zero if the command failed.
    run_idempotent() {
      if [ $# -lt 2 ] || [ -z "${1:-}" ]; then
          printf "✗ ERROR: run_idempotent requires at least 2 arguments (non-empty key and command)\n" >&2
          return 1
      fi

      local key="$1"; shift
      local mark="$__STATE_DIR/$key.done"
      
      # Check if the step has already been completed
      if [ -f "$mark" ]; then 
          printf "[INFO] Skipping already-completed step: %s\n" "$key"
          return 0
      fi
      
      # Execute the command
      "$@"
      
      # Mark as done only if successful (set -e ensures we don't get here if failed)
      : > "$mark"
      printf "✓ Completed: %s\n" "$key"
    }
fi
