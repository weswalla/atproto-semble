import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { User } from "../../domain/User";
import { DID } from "../../domain/value-objects/DID";
import { Handle } from "../../domain/value-objects/Handle";
import { users } from "./schema/userSchema";
import { UniqueEntityID } from "src/shared/domain/UniqueEntityID";
import { err, ok, Result } from "src/shared/core/Result";

export class DrizzleUserRepository implements IUserRepository {
  constructor(private db: PostgresJsDatabase) {}

  async findByDID(did: DID): Promise<Result<User | null>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, did.value))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const userData = result[0];
      
      // Create handle value object if it exists
      let handle: Handle | undefined;
      if (userData.handle) {
        const handleResult = Handle.create(userData.handle);
        if (handleResult.isOk()) {
          handle = handleResult.value;
        }
      }

      // Create user entity
      const userResult = User.create(
        {
          did,
          handle,
          linkedAt: userData.linkedAt,
          lastLoginAt: userData.lastLoginAt
        },
        new UniqueEntityID(did.value)
      );

      if (userResult.isErr()) {
        return err(userResult.error);
      }

      return ok(userResult.value);
    } catch (error) {
      return err(error);
    }
  }

  async save(user: User): Promise<Result<void>> {
    try {
      await this.db
        .insert(users)
        .values({
          id: user.did.value,
          handle: user.handle?.value,
          linkedAt: user.linkedAt,
          lastLoginAt: user.lastLoginAt
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            handle: user.handle?.value,
            lastLoginAt: user.lastLoginAt
          }
        });

      return ok(undefined);
    } catch (error) {
      return err(error);
    }
  }
}
