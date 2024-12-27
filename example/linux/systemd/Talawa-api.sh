#!/bin/bash
# filepath: eg:  /home/purnendu/Development/talawa-api/example/linux/systemd/Talawa-api.sh 

# Load nvm and use the correct Node.js version
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20.18.0

# Define the path to the tsx executable dynamically
TSX_PATH=$(which tsx)

# Define paths for development and production
DEV_PATH="src/index.ts"
PROD_PATH="dist/index.js"

# Change to the project directory .give your path
cd /usr/local/talawa-api || exit 1

# Load environment variables from .env file
export "$(grep -v '^#' .env | xargs)"

# Define log file give your path
LOG_FILE="/var/log/talawa-api.log"

# Ensure the log file exists
sudo touch $LOG_FILE

# Debugging: Output environment variables
{
  echo "NODE_ENV is: $NODE_ENV"
  echo "Starting directory is: $PWD"

  # Log the Node.js version
  echo "Node.js version:"
  node -v

  # Log the current directory
  echo "Current directory:"
  pwd

  # Check the value of NODE_ENV and execute the corresponding command
  if [ "$NODE_ENV" == "development" ]; then
      echo "Starting Talawa API in development mode..."
      exec $TSX_PATH $DEV_PATH
  elif [ "$NODE_ENV" == "production" ]; then
      echo "Starting Talawa API in production mode..."
      exec $TSX_PATH $PROD_PATH
  else
      echo "NODE_ENV is not set to a valid value. Please set it to 'development' or 'production'."
      exit 1
  fi
} >> $LOG_FILE 2>&1