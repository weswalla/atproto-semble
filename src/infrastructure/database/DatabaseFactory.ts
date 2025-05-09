import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export class DatabaseFactory {
  private static instance: PostgresJsDatabase | null = null;

  public static createConnection(): PostgresJsDatabase {
    if (!this.instance) {
      const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/myapp';
      const queryClient = postgres(connectionString);
      this.instance = drizzle(queryClient);
    }
    
    return this.instance;
  }

  public static async runMigrations(db: PostgresJsDatabase): Promise<void> {
    await migrate(db, { migrationsFolder: './migrations' });
  }
}
