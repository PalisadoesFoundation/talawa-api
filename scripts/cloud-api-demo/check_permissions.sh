#!/bin/bash

# Check and correct permissions for cert_renew.sh
chown talawa-api /usr/local/bin/cert_renew.sh
chmod 700 /usr/local/bin/cert_renew.sh

# Check and correct permissions for deploy.sh
chown talawa-api /usr/local/bin/deploy.sh
chmod 700 /usr/local/bin/deploy.sh

# Check and correct permissions for reset_mongo.sh
chown talawa-api /usr/local/bin/reset_mongo.sh
chmod 700 /usr/local/bin/reset_mongo.sh
