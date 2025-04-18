import { UserOutputDTO } from './UserDTO';

/**
 * Input DTO containing parameters from the OAuth callback URL.
 */
export interface OAuthCallbackInputDTO {
  code: string;
  state: string;
  // Include 'error' and 'error_description' if handling OAuth errors here
  error?: string;
  error_description?: string;
}

/**
 * Output DTO after successfully completing the OAuth sign-in flow.
 */
export interface CompleteOAuthSignInOutputDTO {
  user: UserOutputDTO;
  isNewUser: boolean; // Flag indicating if this was the user's first link
  // Potentially include application-specific session info/token if needed
}
