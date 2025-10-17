import { Result, err, ok } from 'src/shared/core/Result';
import {
  IOAuthProcessor,
  AuthResult,
} from '../../../user/application/services/IOAuthProcessor';
import { OAuthCallbackDTO } from '../../../user/application/dtos/OAuthCallbackDTO';
import { ITokenService } from '../../../user/application/services/ITokenService';

export class FakeAtProtoOAuthProcessor implements IOAuthProcessor {
  constructor(private tokenService: ITokenService) {}

  async generateAuthUrl(handle?: string): Promise<Result<string>> {
    try {
      // Generate tokens for the mock DID
      const mockUrl = `http://127.0.0.1:3000/api/users/oauth/callback?code=mockCode&state=mockState&iss=mockIssuer`;
      return ok(mockUrl);
    } catch (error: any) {
      return err(error);
    }
  }

  async processCallback(params: OAuthCallbackDTO): Promise<Result<AuthResult>> {
    try {
      // Use mock data from environment variables
      const mockDid = process.env.BSKY_DID || 'did:plc:mock123';
      const mockHandle = process.env.BSKY_HANDLE || 'mock.bsky.social';

      // Simulate successful OAuth callback processing
      return ok({
        did: mockDid,
        handle: mockHandle,
      });
    } catch (error: any) {
      return err(error);
    }
  }
}
