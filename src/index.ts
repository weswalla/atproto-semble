import { createExpressApp } from "./shared/infrastructure/http/app";
import dotenv from "dotenv";
import { DatabaseFactory } from "./shared/infrastructure/database/DatabaseFactory";

// Load environment variables
dotenv.config();

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
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
