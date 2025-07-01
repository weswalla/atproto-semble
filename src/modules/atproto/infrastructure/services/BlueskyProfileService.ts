import {
  IProfileService,
  UserProfile,
} from "src/modules/cards/domain/services/IProfileService";
import { Result, ok, err } from "src/shared/core/Result";
import { IAgentService } from "../../application/IAgentService";

export class BlueskyProfileService implements IProfileService {
  constructor(private readonly agentService: IAgentService) {}

  async getProfile(userId: string): Promise<Result<UserProfile>> {
    try {
      // Get an authenticated agent - we can use any available agent for public profile data
      const agentResult = this.agentService.getUnauthenticatedAgent();

      if (agentResult.isErr()) {
        return err(
          new Error(
            `Failed to get authenticated agent: ${agentResult.error.message}`
          )
        );
      }

      const agent = agentResult.value;

      if (!agent) {
        return err(new Error("No authenticated agent available"));
      }

      // Fetch the profile using the ATProto API
      const profileResult = await agent.getProfile({ actor: userId });

      if (!profileResult.success) {
        return err(
          new Error(
            `Failed to fetch profile ${userId}: ${JSON.stringify(profileResult)}`
          )
        );
      }

      const profile = profileResult.data;

      // Map ATProto profile data to our UserProfile interface
      const userProfile: UserProfile = {
        id: userId,
        name: profile.displayName || profile.handle,
        handle: profile.handle,
        avatarUrl: profile.avatar,
        bio: profile.description,
      };

      return ok(userProfile);
    } catch (error) {
      return err(
        new Error(
          `Error fetching profile: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }
}
