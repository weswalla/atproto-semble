import {
  NodeSavedSession,
  NodeSavedSessionStore,
} from '@atproto/oauth-client-node';

/**
 * In-memory implementation of NodeSavedSessionStore for testing
 */
export class InMemorySessionStore implements NodeSavedSessionStore {
  private sessions: Map<string, NodeSavedSession> = new Map();

  async get(key: string): Promise<NodeSavedSession | undefined> {
    return this.sessions.get(key);
  }

  async set(key: string, val: NodeSavedSession): Promise<void> {
    this.sessions.set(key, val);
  }

  async del(key: string): Promise<void> {
    this.sessions.delete(key);
  }

  // Helper method for testing
  clear(): void {
    this.sessions.clear();
  }
}
