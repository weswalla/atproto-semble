import {
  NodeSavedSession,
  NodeSavedSessionStore,
} from '@atproto/oauth-client-node';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { authSession } from '../repositories/schema/authSession.sql';

export class DrizzleSessionStore implements NodeSavedSessionStore {
  constructor(private db: PostgresJsDatabase) {}

  async get(key: string): Promise<NodeSavedSession | undefined> {
    const result = await this.db
      .select()
      .from(authSession)
      .where(eq(authSession.key, key))
      .limit(1);

    if (result.length === 0) return undefined;
    if (!result[0]) return undefined;

    return JSON.parse(result[0].session) as NodeSavedSession;
  }

  async set(key: string, val: NodeSavedSession): Promise<void> {
    const session = JSON.stringify(val);

    await this.db
      .insert(authSession)
      .values({ key, session })
      .onConflictDoUpdate({
        target: authSession.key,
        set: { session },
      });
  }

  async del(key: string): Promise<void> {
    await this.db.delete(authSession).where(eq(authSession.key, key));
  }
}
