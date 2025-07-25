import { Result, err, ok } from 'src/shared/core/Result';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import {
  IUserAuthenticationService,
  AuthenticationResult,
} from '../../domain/services/IUserAuthenticationService';
import { DID } from '../../domain/value-objects/DID';
import { Handle } from '../../domain/value-objects/Handle';
import { User } from '../../domain/User';

export class FakeUserAuthenticationService implements IUserAuthenticationService {
  constructor(private userRepository: IUserRepository) {}

  async validateUserCredentials(
    did: DID,
    handle?: Handle,
  ): Promise<Result<AuthenticationResult>> {
    try {
      // Use mock data from environment variables
      const mockDid = process.env.BSKY_DID || 'did:plc:mock123';
      const mockHandle = process.env.BSKY_HANDLE || 'mock.bsky.social';

      // Create mock DID and Handle
      const mockDIDResult = DID.create(mockDid);
      if (mockDIDResult.isErr()) {
        return err(mockDIDResult.error);
      }

      const mockHandleResult = Handle.create(mockHandle);
      if (mockHandleResult.isErr()) {
        return err(mockHandleResult.error);
      }

      // Try to find existing user
      const userResult = await this.userRepository.findByDID(mockDIDResult.value);

      if (userResult.isErr()) {
        return err(userResult.error);
      }

      const existingUser = userResult.value;

      // If user exists, return it
      if (existingUser) {
        return ok({
          user: existingUser,
          isNewUser: false,
        });
      }

      // Create new user with mock data
      const newUserResult = User.createNew(mockDIDResult.value, mockHandleResult.value);

      if (newUserResult.isErr()) {
        return err(newUserResult.error);
      }

      return ok({
        user: newUserResult.value,
        isNewUser: true,
      });
    } catch (error: any) {
      return err(error);
    }
  }
}
