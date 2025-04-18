import { User } from '../../domain/aggregates/User';
import { DID } from '../../domain/value-objects/DID';

/**
 * Interface for User aggregate persistence.
 */
export interface IUserRepository {
  /**
   * Finds a user by their DID.
   * @param id The user's DID.
   * @returns The User aggregate or null if not found.
   */
  findById(id: DID): Promise<User | null>;

  /**
   * Saves (creates or updates) a user aggregate.
   * @param user The User aggregate to save.
   */
  save(user: User): Promise<void>;

  // Add other query methods as needed, e.g., findByHandle
}
