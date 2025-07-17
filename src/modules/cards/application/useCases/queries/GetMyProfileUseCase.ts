import { UseCase } from 'src/shared/core/UseCase';
import { IProfileService } from '../../../domain/services/IProfileService';
import { err, ok, Result } from 'src/shared/core/Result';

export interface GetMyProfileQuery {
  userId: string;
}

export interface GetMyProfileResult {
  id: string;
  name: string;
  handle: string;
  description?: string;
  avatarUrl?: string;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class GetMyProfileUseCase
  implements UseCase<GetMyProfileQuery, Result<GetMyProfileResult>>
{
  constructor(private profileService: IProfileService) {}

  async execute(query: GetMyProfileQuery): Promise<Result<GetMyProfileResult>> {
    // Validate user ID
    if (!query.userId || query.userId.trim().length === 0) {
      return err(new ValidationError('User ID is required'));
    }

    try {
      // Fetch user profile
      const profileResult = await this.profileService.getProfile(query.userId);

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
