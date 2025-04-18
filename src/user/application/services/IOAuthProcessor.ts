import { OAuthCallbackInputDTO } from '../dtos/OAuthDTO';
import { DID } from '../../domain/value-objects/DID';
import { Handle } from '../../domain/value-objects/Handle';

/**
 * Represents the successfully processed result from an OAuth callback.
 */
export interface ProcessedOAuthCallbackResult {
  did: DID;
  handle?: Handle; // Handle might not always be available from callback
  state?: string; // Original state parameter, if provided
  // Include session object if needed by the use case, though typically
  // the session store handles persistence implicitly via the library.
}

/**
 * Interface abstracting the core OAuth callback processing logic.
 */
export interface IOAuthProcessor {
  /**
   * Processes the parameters received from the OAuth callback URL.
   * Handles code exchange, token validation, and session storage via underlying library.
   * @param params The parameters from the callback URL.
   * @returns The authenticated user's DID and potentially handle.
   * @throws Error if the callback is invalid, state mismatches, or code exchange fails.
   */
  processCallback(
    params: OAuthCallbackInputDTO,
  ): Promise<ProcessedOAuthCallbackResult>;

  // Add methods for initiating auth flow or refreshing tokens if needed here,
  // although the library might handle refresh transparently.
}
