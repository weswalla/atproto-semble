import { createExpressApp } from "./shared/infrastructure/http/app";
import { DatabaseFactory } from "./shared/infrastructure/database/DatabaseFactory";
import { configService } from "./shared/infrastructure/config";

async function startServer() {
  // Get configuration
  const config = configService.get();
  
  // Create database connection with config
  const db = DatabaseFactory.createConnection(configService.getDatabaseConfig());

  // Run migrations
  try {
    await DatabaseFactory.runMigrations(db);
    console.log("Database migrations completed successfully");
  } catch (error) {
    console.error("Error running database migrations:", error);
    process.exit(1);
  }

  // Create and start Express app with config
  const app = createExpressApp(configService);
  const PORT = config.server.port;
  const HOST = config.server.host;

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT} in ${config.environment} environment`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
