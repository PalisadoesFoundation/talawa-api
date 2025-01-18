#!/bin/bash
# filepath: /path/to/your/talawa-api/example/linux/systemd/Talawa-api.sh
# Description: Talawa API startup script
#CODEROOT this is declared as enviroment in service file.When systemd will run this script we will get this value.

#check this path if valid or not
PROJECT_DIR=$CODEROOT
LOG_FILE=$LOGFILE
DEV_PATH="src/index.ts"
PROD_PATH="dist/index.js"

# Check if the log file exists
if [ ! -f "$LOG_FILE" ]; then
  echo "Error: Log file '$LOG_FILE' not found. Exiting." 
  echo "Please create it first with the correct ownership and permissions, then return."
  exit 1
fi

# Get the current user
CURRENT_USER=$(whoami)

# Get the owner of the log file
LOG_FILE_OWNER=$(stat -c '%U' "$LOG_FILE")

# Check if the current user matches the owner of the log file
if [ "$CURRENT_USER" != "$LOG_FILE_OWNER" ]; then
  echo "Error: Current user '$CURRENT_USER' does not match the owner of the log file '$LOG_FILE_OWNER'. Exiting."
  echo "Change ownership or permissions and try again."
  exit 1
fi

# Check if the user has necessary permissions to read and write to the log file
if [ ! -w "$LOG_FILE" ] || [ ! -r "$LOG_FILE" ]; then
  echo "Error: User '$CURRENT_USER' does not have sufficient permissions to read or write to the log file '$LOG_FILE'. Exiting."
  echo "Change permissions and try again."
  exit 1
fi

echo "-------------------------------***************------------------------------------" | tee -a "$LOG_FILE"
echo "------------------------------>Talawa-API Logs<-----------------------------------" | tee -a "$LOG_FILE"
echo "------------------------------>Current session date: $(date)" | tee -a "$LOG_FILE" 
echo "-------------------------------***************------------------------------------" | tee -a "$LOG_FILE"
echo "Log file '$LOG_FILE' is present and writable by user '$CURRENT_USER'. Proceeding..." | tee -a "$LOG_FILE"

# Verify the project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
  echo "Error: Project directory '$PROJECT_DIR' not found. Exiting." | tee -a "$LOG_FILE"
  exit 1
fi

# Switch to the project directory
cd "$PROJECT_DIR" || { echo "Error: Failed to change to project directory '$PROJECT_DIR'. Exiting." | tee -a "$LOG_FILE"; exit 1; }

echo "Changed to project directory '$PROJECT_DIR'. Proceeding..." | tee -a "$LOG_FILE"

# Check for package.json in the current working directory
if [ ! -f "package.json" ]; then
  echo "Error: 'package.json' not found in $(pwd). Exiting." | tee -a "$LOG_FILE"
  echo "Please ensure it is present, then return." | tee -a "$LOG_FILE"
  exit 1
fi

echo "package.json is present in $(pwd). Proceeding..." | tee -a "$LOG_FILE"

# Attempt to read the required Node.js version
TARGET_NODE_VERSION=$(jq -r '.engines.node' package.json 2>/dev/null)

# Continue with your script...
if [ -z "$TARGET_NODE_VERSION" ] || [ "$TARGET_NODE_VERSION" == "null" ]; then
  echo "Error: Unable to read 'engines.node' from package.json. Exiting." | tee -a "$LOG_FILE"
  exit 1
fi

# Remove 'v' prefix if present, e.g. "v20.18.0" -> "20.18.0"
INSTALLED_NODE_VERSION=$(node -v 2>/dev/null | sed 's/^v//')

echo "Installed Node.js version: $INSTALLED_NODE_VERSION" | tee -a "$LOG_FILE"
echo "Target Node.js version: $TARGET_NODE_VERSION" | tee -a "$LOG_FILE"

if [ "$INSTALLED_NODE_VERSION" != "$TARGET_NODE_VERSION" ]; then
  echo "Error: Node.js version mismatch. Found $INSTALLED_NODE_VERSION, need $TARGET_NODE_VERSION. Exiting." | tee -a "$LOG_FILE"
  echo "First install the required Node.js version from package.json in system then proceed further. It should match system Node.js version and Talawa-api Node.js version v$TARGET_NODE_VERSION"  | tee -a "$LOG_FILE"
  exit 1
fi

echo "Node.js version matched. Proceeding..." | tee -a "$LOG_FILE"

# Check if tsx is installed
if ! command -v tsx >/dev/null 2>&1; then
  echo "Error: 'tsx' is not installed on this system. Exiting." | tee -a "$LOG_FILE"
  echo "Please install 'tsx' manually, then rerun the script." | tee -a "$LOG_FILE"
  exit 1
fi

# Define the path to the tsx executable dynamically
TSX_PATH=$(which tsx)

# Check if the TSX_PATH is valid
if [ ! -x "$TSX_PATH" ]; then
  echo "Error: Path for 'tsx' is not found or not executable. Verify it is properly installed. Exiting." | tee -a "$LOG_FILE"
  exit 1
fi

echo "'tsx' is installed and executable at '$TSX_PATH'. Proceeding..." | tee -a "$LOG_FILE"

# Define the path to the node executable dynamically
NODE_PATH=$(which node)

# Check if the NODE_PATH is valid
if [ ! -x "$NODE_PATH" ]; then
  echo "Error: Path for 'node' is not found or not executable. Verify it is properly installed. Exiting." | tee -a "$LOG_FILE"
  exit 1
fi

echo "'node' is installed and executable at '$NODE_PATH'. Proceeding..." | tee -a "$LOG_FILE"

# Check if .env file is present
if [ ! -f ".env" ]; then
  echo "Error: '.env' file not found. Exiting." | tee -a "$LOG_FILE"
  exit 1
fi
echo ".env file found in '$(pwd)' directory. Proceeding..." | tee -a "$LOG_FILE"

# Load environment variables from .env file securely
NODE_ENV=$(grep '^NODE_ENV=' .env | cut -d '=' -f2)
if [ -n "$NODE_ENV" ]; then
  export NODE_ENV
else
  echo "Error: NODE_ENV not found in .env file" | tee -a "$LOG_FILE"
  exit 1
fi

# Check if NODE_ENV is set
if [ -z "$NODE_ENV" ]; then
  echo "Error: Property 'NODE_ENV' is not present in the .env file. Exiting." | tee -a "$LOG_FILE"
  exit 1
fi

echo "Environment variable 'NODE_ENV' is set to '$NODE_ENV'. Proceeding..." | tee -a "$LOG_FILE"

# Validate NODE_ENV and paths
case "$NODE_ENV" in
  "development")
    if [ ! -f "$DEV_PATH" ]; then
      echo "Error: Development path '$DEV_PATH' not found. Exiting." | tee -a "$LOG_FILE"
      exit 1
    fi
    echo "Development path is valid. Proceeding..." | tee -a "$LOG_FILE"
    ;;
  
  "production")
    if [ ! -f "$PROD_PATH" ]; then
      echo "Error: Production path '$PROD_PATH' not found. Exiting." | tee -a "$LOG_FILE"
      exit 1
    fi
    echo "Production path is valid. Proceeding..." | tee -a "$LOG_FILE"
    ;;
  
  *)
    echo "Error: NODE_ENV is not set to 'development' or 'production'. Exiting." | tee -a "$LOG_FILE"
    exit 1
    ;;
esac

# Check the value of NODE_ENV and execute the corresponding command
if [ "$NODE_ENV" == "development" ]; then
    echo "Starting Talawa API in development mode..." | tee -a "$LOG_FILE"
    exec "$TSX_PATH" "$DEV_PATH"
elif [ "$NODE_ENV" == "production" ]; then
    echo "Starting Talawa API in production mode..." | tee -a "$LOG_FILE"
    exec "$NODE_PATH" "$PROD_PATH"
else
    echo "NODE_ENV is not set to a valid value. Please set it to 'development' or 'production'. Exiting." | tee -a "$LOG_FILE"
    exit 1
fi