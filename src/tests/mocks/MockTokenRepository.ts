import { ITokenRepository, RefreshToken } from '../../modules/user/domain/repositories/ITokenRepository';
import { Result, ok } from '../../shared/core/Result';

export class MockTokenRepository implements ITokenRepository {
  private tokens: Map<string, RefreshToken> = new Map();

  async saveRefreshToken(token: RefreshToken): Promise<Result<void>> {
    this.tokens.set(token.refreshToken, token);
    return ok(undefined);
  }

  async findRefreshToken(refreshToken: string): Promise<Result<RefreshToken | null>> {
    const token = this.tokens.get(refreshToken);
    return ok(token || null);
  }

  async revokeRefreshToken(refreshToken: string): Promise<Result<void>> {
    const token = this.tokens.get(refreshToken);
    if (token) {
      token.revoked = true;
      this.tokens.set(refreshToken, token);
    }
    return ok(undefined);
  }
}
