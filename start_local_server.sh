#!/bin/bash
set -e

# This script allows you to run the talawa-api Node.js server directly on your host machine
# while connecting to the backing services (Redis, Postgres, MinIO) running in Docker.
#
# IMPORTANT: This assumes you have the necessary credentials defined in your .env file.
# It only overrides the HOST/PORT settings to point to localhost (127.0.0.1) where Docker
# exposes these services.

API_REDIS_HOST=127.0.0.1 \
API_REDIS_PORT=6379 \
API_POSTGRES_HOST=127.0.0.1 \
API_POSTGRES_PORT=5432 \
API_MINIO_END_POINT=127.0.0.1 \
API_MINIO_PORT=9000 \
npm run start_development_server
