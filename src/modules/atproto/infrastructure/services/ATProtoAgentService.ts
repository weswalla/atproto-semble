import { Agent } from '@atproto/api';
import { AtProtoOAuthProcessor } from '../../infrastructure/AtProtoOAuthProcessor';
import { Result, ok, err } from 'src/shared/core/Result';

export class ATProtoAgentService {
  constructor(
    private readonly oauthProcessor: AtProtoOAuthProcessor
  ) {}

  async getAuthenticatedAgent(did: string): Promise<Result<Agent | null, Error>> {
    try {
      // Get the OAuth client from the processor
      const oauthClient = this.oauthProcessor.getOAuthClient();
      
      // Try to restore the session for the DID
      const oauthSession = await oauthClient.restore(did);
      
      // If we have a session, create and return an Agent
      if (oauthSession) {
        return ok(new Agent({ service: 'https://bsky.social', session: oauthSession }));
      }
      
      // No session found
      return ok(null);
    } catch (error) {
      return err(new Error(`Failed to get authenticated agent: ${error instanceof Error ? error.message : String(error)}`));
    }
  }
}
