#!/bin/bash

# scripts/install/common/docker-detection.sh
# Shared Docker detection functions

# Check Docker requirements
# Arguments:
#   $1: mode (optional, default: "docker")
check_docker_requirements() {
    local mode="${1:-docker}"

    if [ "$mode" != "docker" ]; then
        info "Local installation mode - skipping Docker setup"
        return 0
    fi

    if command -v docker >/dev/null 2>&1; then
        success "Docker is already installed: $(docker --version)"
        
        # Verify Docker is running
        if ! docker info >/dev/null 2>&1; then
            warn "Docker is installed but not running."
            if [[ "$OS_TYPE" == "macos" ]]; then
                info "Please launch Docker Desktop from Applications and wait for it to start."
            else
                info "Please start the Docker daemon."
            fi
            return 1
        else
            success "Docker is running"
            return 0
        fi
    else
        error "Docker is not installed."
        if [[ "$OS_TYPE" == "macos" ]]; then
             warn "Docker Desktop is required but not installed."
             # Logic to install Docker on macOS could go here or be handled by the caller.
             # In this refactor, we are mostly doing detection, but the original script installed it.
             # The issue says "detection-only for Docker".
             # So we will just error out or warn.
             warn "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
             return 1
        else
             warn "Please install Docker for your platform."
             return 1
        fi
    fi
}
