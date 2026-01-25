#!/bin/bash
# Exit immediately if a command exits with a non-zero status (-e),
# Treat unset variables as an error and exit immediately (-u),
# Return the exit status of the last command in the pipeline that failed (-o pipefail)
set -euo pipefail

# ===============================
# Script Purpose:
# This script checks if specific ports are being used locally on the system 
# (Linux, macOS, or Windows via Git Bash/MSYS/Cygwin) and also checks if any 
# running Docker container is using these ports.
#
# When to use this script:
# - Before starting your local development services to ensure required ports are free.
# - During debugging when services fail to start due to "port already in use" errors.
# - In CI or local setup scripts to prevent port conflicts.
# ===============================

# Detect OS
OS="$(uname -s)"

# List of ports to check with comments explaining their typical usage in projects
ports=(
  5432 # Postgres database port
  6379 # Redis cache port
  9000 # Minio API port
  9001 # Minio console port
  80   # HTTP (Caddy reverse proxy or any other web server)
  4000 # Talawa API port (example project API)
  443  # HTTPS (Caddy reverse proxy or any secure web server)
)

# Display detected OS
echo "Detected OS: $OS"
echo "Checking port usage..."


# Loop through each port to check if it is in use
for port in "${ports[@]}"; do
  echo -e "\n==============================="
  echo "  Checking port $port"

 # Check for Linux systems
  if [[ "$OS" == "Linux" ]]; then
   # Using lsof to check port usage
    usage=$(sudo lsof -i :"$port")
    if [ -n "$usage" ]; then
      echo " Port $port is in use locally:"
      echo "$usage"
    else
      echo " Port $port is NOT used locally."
    fi

  # Check for macOS systems
  elif [[ "$OS" == "Darwin" ]]; then
    usage=$(lsof -i :"$port")
    if [ -n "$usage" ]; then
      echo " Port $port is in use locally:"
      echo "$usage"
    else
      echo " Port $port is NOT used locally."
    fi

    # Check port on Windows using Git Bash/MSYS/Cygwin
  elif [[ "$OS" == "MINGW"* || "$OS" == "MSYS"* || "$OS" == "CYGWIN"* ]]; then
    echo " Checking using netstat (Windows)..."
   # netstat -ano lists all connections with owning process ID, grep to filter by port
    usage=$(netstat -ano | grep ":$port ")
    if [ -n "$usage" ]; then
      echo " Port $port is in use locally:"
      echo "$usage"
    else
      echo " Port $port is NOT used locally."
    fi

  # For unsupported OS types
  else
    echo " OS not supported for local port check in this script."
  fi

  # Check if any running Docker container is using the port
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    # docker ps with formatted output shows container names and their exposed ports
  docker_usage=$(docker ps --format "table {{.Names}}\t{{.Ports}}" | grep ":$port->")
  if [ -n "$docker_usage" ]; then
    echo " Port $port is used by Docker container:"
    echo "$docker_usage"
  else
    echo " Port $port is NOT used by any running Docker container."
  fi
else
  echo " Docker is not installed or running. Skipping Docker container check."
fi

done

echo -e "\n Port check completed."

# ===============================
# End of Script
#
# Summary:
# This script ensures there are no port conflicts before you start local 
# development services or deploy new containers. It is a preventive measure 
# to save debugging time caused by port binding failures.
# ===============================