import { NodeSavedState, NodeSavedStateStore } from "@atproto/oauth-client-node";

/**
 * In-memory implementation of NodeSavedStateStore for testing
 */
export class InMemoryStateStore implements NodeSavedStateStore {
  private states: Map<string, NodeSavedState> = new Map();

  async get(key: string): Promise<NodeSavedState | undefined> {
    return this.states.get(key);
  }

  async set(key: string, val: NodeSavedState): Promise<void> {
    this.states.set(key, val);
  }

  async del(key: string): Promise<void> {
    this.states.delete(key);
  }

  // Helper method for testing
  clear(): void {
    this.states.clear();
  }
}
