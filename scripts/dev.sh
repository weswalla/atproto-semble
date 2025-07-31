#!/bin/bash

# Check if Docker daemon is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker daemon is not running. Please start Docker and try again."
  exit 1
fi

# Check if the Postgres container is running
if [ "$(docker ps -q -f name=annos-postgres)" ]; then
  echo "Postgres container is already running."
  DB_RUNNING=true
else
  echo "Starting Postgres container..."
  npm run db:start
  DB_RUNNING=false
fi


# Trap SIGINT and SIGTERM to stop containers on exit, only if we started them
function cleanup {
  if [ "$DB_RUNNING" = false ]; then
    if [ "$(docker ps -q -f name=annos-postgres)" ]; then
      echo "Stopping Postgres container..."
      npm run db:stop
      npm run db:remove
    fi
  fi
}
trap cleanup SIGINT SIGTERM

# Run the dev command
npm run dev:inner

# Cleanup after dev command exits
cleanup
