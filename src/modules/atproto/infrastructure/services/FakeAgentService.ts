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
              avatar:
                'https://cdn.bsky.app/img/avatar/plain/did:plc:rlknsba2qldjkicxsmni3vyn/bafkreid4nmxspygkftep5b3m2wlcm3xvnwefkswzej7dhipojjxylkzfby@jpeg',
            },
          };
        },
        resolveHandle: async ({ handle }: { handle: string }) => {
          const did = process.env.BSKY_DID || 'did:example:123456789abcdefghi';
          return {
            success: true,
            data: {
              did: did,
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

      // uncomment the line below to test error handling
      // throw new Error('Not implemented in FakeAgentService');
      return this.getUnauthenticatedAgent();
    } catch (error: any) {
      return err(error);
    }
  }
}
