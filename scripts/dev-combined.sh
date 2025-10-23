#!/bin/bash

# Source both setup scripts
source ./scripts/setup-postgres.sh
source ./scripts/setup-redis.sh

# Function to handle cleanup for both services
cleanup_and_exit() {
    echo "Cleaning up services..."
    cleanup_postgres
    cleanup_redis
    exit 0
}

# Trap SIGINT and SIGTERM to cleanup on exit
trap cleanup_and_exit SIGINT SIGTERM

echo "Starting development with separate processes (BullMQ + Redis)..."

# Run both services with concurrently
concurrently -k -n APP,FEED,SEARCH -c blue,green,yellow \
  "dotenv -e .env.local -- concurrently -k -n TYPE,APP -c red,blue \"tsc --noEmit --watch\" \"tsup --watch --onSuccess='node dist/index.js'\"" \
  "dotenv -e .env.local -- concurrently -k -n WORKER -c green \"tsup --watch --onSuccess='node dist/workers/feed-worker.js'\"" \
  "dotenv -e .env.local -- concurrently -k -n WORKER -c yellow \"tsup --watch --onSuccess='node dist/workers/search-worker.js'\""

# Cleanup after concurrently exits
cleanup_postgres
cleanup_redis
