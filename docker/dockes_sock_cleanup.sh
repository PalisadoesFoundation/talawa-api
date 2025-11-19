#!/usr/bin/env bash
# Revert docker.sock ownership back to the current user

DOCKER_SOCK="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}/docker.sock"

# Get current user and group
USER_ID=$(id -u)

# Revert ownership
sudo chown "$USER_ID" "$DOCKER_SOCK"
