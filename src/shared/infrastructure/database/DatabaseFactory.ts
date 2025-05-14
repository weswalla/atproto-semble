import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { databaseConfig } from "../config";

export class DatabaseFactory {
  private static instance: PostgresJsDatabase | null = null;

  public static createConnection(
    dbConfig = databaseConfig
  ): PostgresJsDatabase {
    if (!this.instance) {
      const connectionString =
        dbConfig.url ||
        `postgres://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

      const queryClient = postgres(connectionString);
      this.instance = drizzle(queryClient);
    }

    return this.instance;
  }

  public static async runMigrations(db: PostgresJsDatabase): Promise<void> {
    await migrate(db, { migrationsFolder: "./migrations" });
  }
}
