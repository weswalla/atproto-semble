#!/bin/bash

# Source both setup scripts
source ./scripts/setup-postgres.sh

# Check if we should use in-memory events
USE_IN_MEMORY_EVENTS=${USE_IN_MEMORY_EVENTS:-false}

# Only setup Redis if not using in-memory events
if [ "$USE_IN_MEMORY_EVENTS" != "true" ]; then
    source ./scripts/setup-redis.sh
fi

# Function to handle cleanup for both services
cleanup_and_exit() {
    echo "Cleaning up services..."
    cleanup_postgres
    if [ "$USE_IN_MEMORY_EVENTS" != "true" ]; then
        cleanup_redis
    fi
    exit 0
}

# Trap SIGINT and SIGTERM to cleanup on exit
trap cleanup_and_exit SIGINT SIGTERM

# Conditionally start worker based on event system type
if [ "$USE_IN_MEMORY_EVENTS" = "true" ]; then
    echo "Using in-memory events - feed worker will run inside main process"
    # Only run the web app (which includes the feed worker internally)
    dotenv -e .env.local -- concurrently -k -n TYPE,APP -c red,blue \
      "tsc --noEmit --watch" \
      "tsup --watch --onSuccess='node dist/index.js'"
else
    echo "Using BullMQ events - starting separate feed worker process"
    # Run both web app and separate feed worker
    concurrently -k -n APP,WORKER -c blue,green \
      "dotenv -e .env.local -- concurrently -k -n TYPE,APP -c red,blue \"tsc --noEmit --watch\" \"tsup --watch --onSuccess='node dist/index.js'\"" \
      "dotenv -e .env.local -- concurrently -k -n WORKER -c green \"tsup --watch --onSuccess='node dist/workers/feed-worker.js'\""
fi

# Cleanup after concurrently exits
cleanup_postgres
if [ "$USE_IN_MEMORY_EVENTS" != "true" ]; then
    cleanup_redis
fi
