#!/bin/bash

# Check if Docker daemon is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker daemon is not running. Please start Docker and try again."
  exit 1
fi

# Check if the Redis container is running
if [ "$(docker ps -q -f name=annos-redis)" ]; then
  echo "Redis container is already running."
  export REDIS_RUNNING=true
else
  echo "Starting Redis container..."
  npm run redis:start
  export REDIS_RUNNING=false
fi

# Trap SIGINT and SIGTERM to stop containers on exit, only if we started them
function cleanup_redis {
  if [ "$REDIS_RUNNING" = false ]; then
    if [ "$(docker ps -q -f name=annos-redis)" ]; then
      echo "Stopping Redis container..."
      npm run redis:stop
      npm run redis:remove
    fi
  fi
}

# Export the cleanup function so it can be called from other scripts
export -f cleanup_redis
