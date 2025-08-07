import { Result, ok, err } from 'src/shared/core/Result';
import { User } from '../../domain/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { DID } from '../../domain/value-objects/DID';

export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async findByDID(did: DID): Promise<Result<User | null>> {
    try {
      const user = this.users.get(did.value);
      return ok(user || null);
    } catch (error: any) {
      return err(error);
    }
  }

  async save(user: User): Promise<Result<void>> {
    try {
      this.users.set(user.did.value, user);
      return ok(undefined);
    } catch (error: any) {
      return err(error);
    }
  }

  // Helper method for testing
  clear(): void {
    this.users.clear();
  }
}
