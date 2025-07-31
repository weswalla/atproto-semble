#!/bin/bash

# Source the Postgres setup script
source ./scripts/setup-postgres.sh

# Function to handle cleanup
cleanup_and_exit() {
    echo "Cleaning up Postgres..."
    cleanup_postgres
    exit 0
}

# Trap SIGINT and SIGTERM to cleanup on exit
trap cleanup_and_exit SIGINT SIGTERM

# Run the dev command
npm run dev:app:inner

# Cleanup after dev command exits
cleanup_postgres
