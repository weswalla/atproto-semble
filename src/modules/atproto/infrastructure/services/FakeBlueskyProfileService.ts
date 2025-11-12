import {
  IProfileService,
  UserProfile,
} from 'src/modules/cards/domain/services/IProfileService';
import { Result, ok, err } from 'src/shared/core/Result';

export class FakeBlueskyProfileService implements IProfileService {
  async getProfile(userId: string): Promise<Result<UserProfile>> {
    try {
      // Use mock data from environment variables
      const mockHandle = process.env.BSKY_HANDLE || 'mock.bsky.social';
      const mockDid = process.env.BSKY_DID || 'did:plc:mock123';

      // Return mock profile data
      const userProfile: UserProfile = {
        id: userId,
        name: `Mock User`,
        handle: mockHandle,
        avatarUrl:
          'https://cdn.bsky.app/img/avatar/plain/did:plc:rlknsba2qldjkicxsmni3vyn/bafkreid4nmxspygkftep5b3m2wlcm3xvnwefkswzej7dhipojjxylkzfby@jpeg',
        bio: 'This is a mock profile for testing purposes (https://semble.so/), made by @cosmik.network.',
      };

      return ok(userProfile);
    } catch (error) {
      return err(
        new Error(
          `Error fetching mock profile: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    }
  }
}
