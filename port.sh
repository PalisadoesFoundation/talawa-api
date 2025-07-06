#!/bin/bash

# Detect OS
OS="$(uname -s)"

# List of ports to check
ports=(
  5432 # Postgres
  6379 # Redis
  9000 # Minio API
  9001 # Minio console
  80   # Caddy HTTP
  4000 # Talawa API
  443  # Caddy HTTPS
)

echo "Detected OS: $OS"
echo "Checking port usage..."

for port in "${ports[@]}"; do
  echo -e "\n==============================="
  echo "  Checking port $port"

  if [[ "$OS" == "Linux" ]]; then
    # Check port on Linux
    local_usage=$(sudo lsof -i :$port)
    if [ -n "$local_usage" ]; then
      echo " Port $port is in use locally:"
      echo "$local_usage"
    else
      echo " Port $port is NOT used locally."
    fi
  elif [[ "$OS" == "MINGW"* || "$OS" == "MSYS"* || "$OS" == "CYGWIN"* ]]; then
    # Check port on Windows Git Bash/MSYS/Cygwin
    echo " Checking using netstat (Windows)..."
    local_usage=$(netstat -ano | grep ":$port ")
    if [ -n "$local_usage" ]; then
      echo " Port $port is in use locally:"
      echo "$local_usage"
    else
      echo " Port $port is NOT used locally."
    fi
  else
    echo " OS not supported for local port check in this script."
  fi

  # Check if any docker container uses the port
  docker_usage=$(docker ps --format "table {{.Names}}\t{{.Ports}}" | grep ":$port->")
  if [ -n "$docker_usage" ]; then
    echo " Port $port is used by Docker container:"
    echo "$docker_usage"
  else
    echo " Port $port is NOT used by any running Docker container."
  fi
done

echo -e "\n Port check completed."
