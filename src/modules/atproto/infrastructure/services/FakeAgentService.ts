import { Result, ok, err } from 'src/shared/core/Result';
import { IAgentService } from '../../application/IAgentService';
import { DID } from '../../domain/DID';
import { Agent } from '@atproto/api';

export class FakeAgentService implements IAgentService {
  getUnauthenticatedAgent(): Result<Agent, Error> {
    try {
      // Create a mock agent - in a real implementation this would be a proper Agent instance
      const mockAgent = {
        getProfile: async ({ actor }: { actor: string }) => {
          const mockHandle = process.env.BSKY_HANDLE || 'mock.bsky.social';
          return {
            success: true,
            data: {
              did: actor,
              handle: mockHandle,
              displayName: `Mock User`,
              description: 'This is a mock profile for testing purposes',
              avatar: 'https://via.placeholder.com/150',
            },
          };
        },
      } as Agent;

      return ok(mockAgent);
    } catch (error: any) {
      return err(error);
    }
  }

  async getAuthenticatedAgent(did: DID): Promise<Result<Agent, Error>> {
    try {
      // Return the same mock agent for authenticated requests
      return this.getUnauthenticatedAgent();
    } catch (error: any) {
      return err(error);
    }
  }
}
