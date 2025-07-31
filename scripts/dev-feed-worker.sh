#!/bin/bash

# Source the Redis setup script
source ./scripts/setup-redis.sh

# Trap SIGINT and SIGTERM to cleanup on exit
trap cleanup_redis SIGINT SIGTERM

# Run the feed worker dev command
npm run dev:worker:feeds:inner

# Cleanup after dev command exits
cleanup_redis
