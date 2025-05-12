import { createExpressApp } from "./shared/infrastructure/http/app";
import { DatabaseFactory } from "./shared/infrastructure/database/DatabaseFactory";
import { serverConfig } from "./shared/infrastructure/config";

async function startServer() {
  // Create database connection
  const db = DatabaseFactory.createConnection();

  // Run migrations
  try {
    await DatabaseFactory.runMigrations(db);
    console.log("Database migrations completed successfully");
  } catch (error) {
    console.error("Error running database migrations:", error);
    process.exit(1);
  }

  // Create and start Express app
  const app = createExpressApp();

  app.listen(serverConfig.port, () => {
    console.log(`Server running on port ${serverConfig.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
