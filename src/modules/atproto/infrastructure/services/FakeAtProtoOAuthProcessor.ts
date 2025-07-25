import { Result, err, ok } from 'src/shared/core/Result';
import {
  IOAuthProcessor,
  AuthResult,
} from '../../../user/application/services/IOAuthProcessor';
import { OAuthCallbackDTO } from '../../../user/application/dtos/OAuthCallbackDTO';

export class FakeAtProtoOAuthProcessor implements IOAuthProcessor {
  async generateAuthUrl(handle?: string): Promise<Result<string>> {
    try {
      // Return a mock auth URL
      const mockUrl = `https://mock-oauth.example.com/auth?handle=${handle || 'mock'}`;
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
