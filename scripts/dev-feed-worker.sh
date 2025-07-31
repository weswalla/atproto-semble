#!/bin/bash

# Source the Redis setup script
source ./scripts/setup-redis.sh

# Only setup cleanup if not running from combined script
if [ -z "$COMBINED_SCRIPT" ]; then
    # Function to handle cleanup
    cleanup_and_exit() {
        echo "Cleaning up Redis..."
        cleanup_redis
        exit 0
    }

    # Trap SIGINT and SIGTERM to cleanup on exit
    trap cleanup_and_exit SIGINT SIGTERM
fi

# Run the feed worker dev command
npm run dev:worker:feeds:inner

# Only cleanup if not running from combined script
if [ -z "$COMBINED_SCRIPT" ]; then
    cleanup_redis
fi
