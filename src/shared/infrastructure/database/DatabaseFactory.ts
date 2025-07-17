import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { databaseConfig, configService } from '../config';

export class DatabaseFactory {
  private static instance: PostgresJsDatabase | null = null;

  public static createConnection(
    dbConfig = databaseConfig,
  ): PostgresJsDatabase {
    if (!this.instance) {
      const connectionString = dbConfig.url;

      const queryClient = postgres(connectionString, {
        ssl: configService.get().environment === 'local' ? false : 'require',
      });
      this.instance = drizzle(queryClient);
    }

    return this.instance;
  }

  public static async runMigrations(db: PostgresJsDatabase): Promise<void> {
    await migrate(db, {
      migrationsFolder: './src/shared/infrastructure/database/migrations',
    });
  }
}
