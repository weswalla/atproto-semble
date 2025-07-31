#!/bin/bash

# Source the Postgres setup script
source ./scripts/setup-postgres.sh

# Trap SIGINT and SIGTERM to cleanup on exit
trap cleanup_postgres SIGINT SIGTERM

# Run the dev command
npm run dev:app:inner

# Cleanup after dev command exits
cleanup_postgres
