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
      const mockDid = process.env.BSKY_DID || 'did:plc:mock123';
      const tokenResult = await this.tokenService.generateToken(mockDid);

      if (tokenResult.isErr()) {
        return err(tokenResult.error);
      }

      const tokens = tokenResult.unwrap();
      const mockUrl = `http://localhost:4000/auth/complete?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
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
