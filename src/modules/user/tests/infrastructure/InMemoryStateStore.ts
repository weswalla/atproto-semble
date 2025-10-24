import {
  NodeSavedState,
  NodeSavedStateStore,
} from '@atproto/oauth-client-node';

/**
 * In-memory implementation of NodeSavedStateStore for testing
 */
export class InMemoryStateStore implements NodeSavedStateStore {
  private static instance: InMemoryStateStore;
  private states: Map<string, NodeSavedState> = new Map();

  private constructor() {}

  public static getInstance(): InMemoryStateStore {
    if (!InMemoryStateStore.instance) {
      InMemoryStateStore.instance = new InMemoryStateStore();
    }
    return InMemoryStateStore.instance;
  }

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
