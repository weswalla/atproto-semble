import { Result, ok, err } from 'src/shared/core/Result';
import { ITokenService, TokenPair } from '../../application/services/ITokenService';
import { ITokenRepository } from '../../domain/repositories/ITokenRepository';

export class FakeJwtTokenService implements ITokenService {
  constructor(private tokenRepository: ITokenRepository) {}

  async generateToken(did: string): Promise<Result<TokenPair>> {
    try {
      // Use mock tokens from environment variables
      const mockAccessToken = process.env.MOCK_ACCESS_TOKEN || 'mock-access-token-123';
      const mockRefreshToken = process.env.MOCK_REFRESH_TOKEN || 'mock-refresh-token-456';

      return ok({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    } catch (error: any) {
      return err(error);
    }
  }

  async validateToken(token: string): Promise<Result<string | null>> {
    try {
      // Use mock data from environment variables
      const mockAccessToken = process.env.MOCK_ACCESS_TOKEN || 'mock-access-token-123';
      const mockDid = process.env.BSKY_DID || 'did:plc:mock123';

      // Return mock DID if token matches mock token
      if (token === mockAccessToken) {
        return ok(mockDid);
      }

      return ok(null);
    } catch (error: any) {
      return err(error);
    }
  }

  async refreshToken(refreshToken: string): Promise<Result<TokenPair | null>> {
    try {
      // Use mock tokens from environment variables
      const mockRefreshToken = process.env.MOCK_REFRESH_TOKEN || 'mock-refresh-token-456';
      const mockAccessToken = process.env.MOCK_ACCESS_TOKEN || 'mock-access-token-123';

      // Return new tokens if refresh token matches mock token
      if (refreshToken === mockRefreshToken) {
        return ok({
          accessToken: mockAccessToken,
          refreshToken: mockRefreshToken,
        });
      }

      return ok(null);
    } catch (error: any) {
      return err(error);
    }
  }

  async revokeToken(refreshToken: string): Promise<Result<void>> {
    try {
      // Mock token revocation - always succeeds
      return ok(undefined);
    } catch (error: any) {
      return err(error);
    }
  }
}
