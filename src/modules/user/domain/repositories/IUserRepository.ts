import { Result } from "src/shared/core/Result";
import { User } from "../User";
import { DID } from "../value-objects/DID";
import { Handle } from "../value-objects/Handle";

export interface IUserRepository {
  findByDID(did: DID): Promise<Result<User | null>>;
  findByHandle(handle: Handle): Promise<Result<User | null>>;
  save(user: User): Promise<Result<void>>;
}
