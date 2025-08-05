#!/bin/bash

# Source the Postgres setup script
source ./scripts/setup-postgres.sh

# Only setup cleanup if not running from combined script
if [ -z "$COMBINED_SCRIPT" ]; then
    # Function to handle cleanup
    cleanup_and_exit() {
        echo "Cleaning up Postgres..."
        cleanup_postgres
        exit 0
    }

    # Trap SIGINT and SIGTERM to cleanup on exit
    trap cleanup_and_exit SIGINT SIGTERM
fi

# Run the dev command
npm run dev:app:inner

# Only cleanup if not running from combined script
if [ -z "$COMBINED_SCRIPT" ]; then
    cleanup_postgres
fi
