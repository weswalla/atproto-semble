import { Result, err, ok } from "src/shared/core/Result";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IUserAuthenticationService, AuthenticationResult } from "../../domain/services/IUserAuthenticationService";
import { DID } from "../../domain/value-objects/DID";
import { Handle } from "../../domain/value-objects/Handle";
import { User } from "../../domain/User";

export class UserAuthenticationService implements IUserAuthenticationService {
  constructor(private userRepository: IUserRepository) {}

  async validateUserCredentials(did: DID, handle?: Handle): Promise<Result<AuthenticationResult>> {
    try {
      // Try to find existing user
      const userResult = await this.userRepository.findByDID(did);
      
      if (userResult.isErr()) {
        return err(userResult.error);
      }

      const existingUser = userResult.value;
      
      // If user exists, update handle if provided
      if (existingUser) {
        if (handle && (!existingUser.handle || existingUser.handle.value !== handle.value)) {
          existingUser.updateHandle(handle);
        }
        
        return ok({
          user: existingUser,
          isNewUser: false
        });
      }
      
      // Create new user
      const newUserResult = User.createNew(did, handle);
      
      if (newUserResult.isErr()) {
        return err(newUserResult.error);
      }
      
      return ok({
        user: newUserResult.value,
        isNewUser: true
      });
    } catch (error) {
      return err(error);
    }
  }
}
