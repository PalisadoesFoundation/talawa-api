#!/bin/bash

# Purpose: Check and correct permissions for script files
# This script will be used in a cron job to ensure proper permissions for various scripts on the cloud instance.
# This ensures that all scripts have correct permissions and ownership for the talawa-api user on the cloud instance.

# Check and correct permissions for cert_renew.sh
chown talawa-api /usr/local/bin/cert_renew.sh
chmod 700 /usr/local/bin/cert_renew.sh

# Check and correct permissions for deploy.sh
chown talawa-api /usr/local/bin/deploy.sh
chmod 700 /usr/local/bin/deploy.sh

# Check and correct permissions for reset_mongo.sh
chown talawa-api /usr/local/bin/reset_mongo.sh
chmod 700 /usr/local/bin/reset_mongo.sh
