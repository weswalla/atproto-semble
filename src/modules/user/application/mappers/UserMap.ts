import { User } from "../../domain/User";
import { UserDTO } from "../dtos/UserDTO";
import { DID } from "../../domain/value-objects/DID";
import { Handle } from "../../domain/value-objects/Handle";
import { UniqueEntityID } from "src/shared/domain/UniqueEntityID";

export class UserMap {
  public static toDTO(user: User): UserDTO {
    return {
      did: user.did.value,
      handle: user.handle?.value,
      linkedAt: user.linkedAt,
      lastLoginAt: user.lastLoginAt
    };
  }

  public static toDomain(dto: UserDTO): User {
    const didOrError = DID.create(dto.did);
    
    if (didOrError.isErr()) {
      throw new Error(`Could not create DID: ${didOrError.error.message}`);
    }

    let handle: Handle | undefined;
    if (dto.handle) {
      const handleOrError = Handle.create(dto.handle);
      if (handleOrError.isOk()) {
        handle = handleOrError.value;
      }
    }

    const userOrError = User.create({
      did: didOrError.value,
      handle,
      linkedAt: dto.linkedAt,
      lastLoginAt: dto.lastLoginAt
    }, new UniqueEntityID(dto.did));

    if (userOrError.isErr()) {
      throw new Error(`Could not create User: ${userOrError.error.message}`);
    }

    return userOrError.value;
  }
}
