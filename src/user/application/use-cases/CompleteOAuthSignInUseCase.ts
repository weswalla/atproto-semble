import { IUserRepository } from '../repositories/IUserRepository';
import { IOAuthProcessor, ProcessedOAuthCallbackResult } from '../services/IOAuthProcessor';
import { OAuthCallbackInputDTO, CompleteOAuthSignInOutputDTO } from '../dtos/OAuthDTO';
import { User } from '../../domain/aggregates/User';
import { UserOutputDTO } from '../dtos/UserDTO';
import { DID } from '../../domain/value-objects/DID';
import { Handle } from '../../domain/value-objects/Handle';
// import { IEventDispatcher } from '../../../shared/application/events/IEventDispatcher'; // Assuming a shared event dispatcher
// import { UserAccountLinkedEvent, UserLoggedInEvent } from '../../domain/events'; // Import events

export class CompleteOAuthSignInUseCase {
  constructor(
    private readonly oauthProcessor: IOAuthProcessor,
    private readonly userRepo: IUserRepository,
    // private readonly eventDispatcher: IEventDispatcher, // Inject event dispatcher
  ) {}

  async execute(
    input: OAuthCallbackInputDTO,
  ): Promise<CompleteOAuthSignInOutputDTO> {
    // 1. Process OAuth Callback using the infrastructure service interface
    const processedResult: ProcessedOAuthCallbackResult =
      await this.oauthProcessor.processCallback(input);
    const userDid = processedResult.did;

    // 2. Find existing user or prepare for creation
    let user = await this.userRepo.findById(userDid);
    const isNewUser = !user;
    const now = new Date();

    if (user) {
      // 3a. Update existing user (e.g., last login, maybe handle if changed)
      user = user.recordLogin();
      // Optionally update handle if provided and different
      if (processedResult.handle && processedResult.handle.value !== user.handle.value) {
        user = user.updateHandle(processedResult.handle);
      }
    } else {
      // 3b. Create new user aggregate
      // We need the handle for creation. If not in processedResult, we might need
      // another way to fetch it (e.g., another call via ATProto API using the session).
      // For now, assume handle is available or throw if required and missing.
      if (!processedResult.handle) {
        // TODO: Implement handle fetching if necessary after successful auth
        throw new Error('User handle could not be determined during sign-in.');
      }
      user = User.create({
        id: userDid,
        handle: processedResult.handle,
        linkedAt: now, // Set linkedAt timestamp
        lastLoginAt: now,
      });
    }

    // 4. Save user aggregate
    await this.userRepo.save(user);

    // 5. Dispatch domain events (optional)
    // if (isNewUser) {
    //   await this.eventDispatcher.dispatch(
    //     new UserAccountLinkedEvent(user.id, user.handle, user.linkedAt)
    //   );
    // } else {
    //   await this.eventDispatcher.dispatch(
    //     new UserLoggedInEvent(user.id, user.lastLoginAt)
    //   );
    // }

    // 6. Map to output DTO
    // TODO: Implement UserMapper or map manually
    const userDto: UserOutputDTO = {
      id: user.id.toString(),
      handle: user.handle.toString(),
      linkedAt: user.linkedAt.toISOString(),
      lastLoginAt: user.lastLoginAt.toISOString(),
    };

    return { user: userDto, isNewUser };
  }
}
