import { UseCase } from 'src/shared/core/UseCase';
import { IProfileService } from '../../../domain/services/IProfileService';
import { err, ok, Result } from 'src/shared/core/Result';
import { DIDOrHandle } from 'src/modules/atproto/domain/DIDOrHandle';
import { IIdentityResolutionService } from 'src/modules/atproto/domain/services/IIdentityResolutionService';
import { UserDTO } from 'src/shared/application/dtos/base';

export interface GetMyProfileQuery {
  userId: string;
}

// Use the unified UserDTO for the result
export type GetMyProfileResult = UserDTO;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class GetProfileUseCase
  implements UseCase<GetMyProfileQuery, Result<GetMyProfileResult>>
{
  constructor(
    private profileService: IProfileService,
    private identityResolver: IIdentityResolutionService,
  ) {}

  async execute(query: GetMyProfileQuery): Promise<Result<GetMyProfileResult>> {
    // Validate user ID
    if (!query.userId || query.userId.trim().length === 0) {
      return err(new ValidationError('User ID is required'));
    }

    // Parse and validate user identifier
    const identifierResult = DIDOrHandle.create(query.userId);
    if (identifierResult.isErr()) {
      return err(new ValidationError('Invalid user identifier'));
    }

    // Resolve to DID
    const didResult = await this.identityResolver.resolveToDID(
      identifierResult.value,
    );
    if (didResult.isErr()) {
      return err(
        new ValidationError(
          `Could not resolve user identifier: ${didResult.error.message}`,
        ),
      );
    }

    try {
      // Fetch user profile using the resolved DID
      const profileResult = await this.profileService.getProfile(
        didResult.value.value,
      );

      if (profileResult.isErr()) {
        return err(
          new Error(
            `Failed to fetch user profile: ${profileResult.error instanceof Error ? profileResult.error.message : 'Unknown error'}`,
          ),
        );
      }

      const profile = profileResult.value;

      return ok({
        id: profile.id,
        name: profile.name,
        handle: profile.handle,
        description: profile.bio,
        avatarUrl: profile.avatarUrl,
      });
    } catch (error) {
      return err(
        new Error(
          `Failed to get user profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }
}
