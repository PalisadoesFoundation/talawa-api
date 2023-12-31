#!/bin/bash

# Renew the certificates
certbot renew

# Set permissions to 700 for the script
chmod 700 "$0"

# Set ownership to talawa-api user
chown talawa-api "$0"
