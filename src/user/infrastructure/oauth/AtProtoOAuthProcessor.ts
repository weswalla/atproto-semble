import {
  IOAuthProcessor,
  ProcessedOAuthCallbackResult,
} from '../../application/services/IOAuthProcessor';
import { OAuthCallbackInputDTO } from '../../application/dtos/OAuthDTO';
import { DID } from '../../domain/value-objects/DID';
import { Handle } from '../../domain/value-objects/Handle';
import { NodeOAuthClient, Session } from '@atproto/oauth-client-node'; // Import the actual library

/**
 * Implementation of IOAuthProcessor using @atproto/oauth-client-node.
 */
export class AtProtoOAuthProcessor implements IOAuthProcessor {
  // The actual NodeOAuthClient instance needs to be configured and injected.
  constructor(private readonly oauthClient: NodeOAuthClient) {}

  async processCallback(
    params: OAuthCallbackInputDTO,
  ): Promise<ProcessedOAuthCallbackResult> {
    console.log('AtProtoOAuthProcessor: Processing callback');
    try {
      // Convert DTO params to URLSearchParams expected by the library
      const searchParams = new URLSearchParams();
      searchParams.set('code', params.code);
      searchParams.set('state', params.state);
      if (params.error) searchParams.set('error', params.error);
      if (params.error_description) searchParams.set('error_description', params.error_description);

      // Call the library's callback method
      // This implicitly uses the sessionStore and stateStore provided during client setup
      const { session, state: originalState } = await this.oauthClient.callback(
        searchParams,
      );

      // Map the library's Session object to our ProcessedOAuthCallbackResult
      const did = new DID(session.did);
      const handle = session.handle ? new Handle(session.handle) : undefined;

      return {
        did,
        handle,
        state: originalState, // Pass back the original state if needed
      };
    } catch (error: any) {
      // TODO: Improve error handling - map library errors to application-specific errors
      console.error('Error processing OAuth callback:', error);
      throw new Error(`OAuth callback processing failed: ${error.message}`);
    }
  }
}
