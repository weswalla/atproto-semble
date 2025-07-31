#!/bin/bash

# Source the Redis setup script
source ./scripts/setup-redis.sh

# Function to handle cleanup
cleanup_and_exit() {
    echo "Cleaning up Redis..."
    cleanup_redis
    exit 0
}

# Trap SIGINT and SIGTERM to cleanup on exit
trap cleanup_and_exit SIGINT SIGTERM

# Run the feed worker dev command
npm run dev:worker:feeds:inner

# Cleanup after dev command exits
cleanup_redis
