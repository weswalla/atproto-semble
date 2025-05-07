import {
  NodeSavedState,
  NodeSavedStateStore,
} from "@atproto/oauth-client-node";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { authState } from "../repositories/schema/authStateSchema";

export class DrizzleStateStore implements NodeSavedStateStore {
  constructor(private db: PostgresJsDatabase) {}

  async get(key: string): Promise<NodeSavedState | undefined> {
    const result = await this.db
      .select()
      .from(authState)
      .where(eq(authState.key, key))
      .limit(1);

    if (result.length === 0) return undefined;
    if (!result[0]) return undefined;

    return JSON.parse(result[0].state) as NodeSavedState;
  }

  async set(key: string, val: NodeSavedState): Promise<void> {
    const state = JSON.stringify(val);

    await this.db.insert(authState).values({ key, state }).onConflictDoUpdate({
      target: authState.key,
      set: { state },
    });
  }

  async del(key: string): Promise<void> {
    await this.db.delete(authState).where(eq(authState.key, key));
  }
}
