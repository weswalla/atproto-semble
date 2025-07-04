## DB Migrations

- Whenever there are changes to existing sql schema files (`.sql.ts`) or new schema files are created, you must run `npm run db:generate`.
- This will generate migration files for drizzle to run during app initialization
