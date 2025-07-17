import { Result, ok, err } from 'src/shared/core/Result';
import {
  ITokenRepository,
  RefreshToken,
} from '../../domain/repositories/ITokenRepository';

export class InMemoryTokenRepository implements ITokenRepository {
  private tokens: Map<string, RefreshToken> = new Map();

  async saveRefreshToken(token: RefreshToken): Promise<Result<void>> {
    try {
      this.tokens.set(token.refreshToken, token);
      return ok(undefined);
    } catch (error: any) {
      return err(error);
    }
  }

  async findRefreshToken(
    refreshToken: string,
  ): Promise<Result<RefreshToken | null>> {
    try {
      const token = this.tokens.get(refreshToken);
      if (!token || token.revoked) {
        return ok(null);
      }
      return ok(token);
    } catch (error: any) {
      return err(error);
    }
  }

  async revokeRefreshToken(refreshToken: string): Promise<Result<void>> {
    try {
      const token = this.tokens.get(refreshToken);
      if (token) {
        token.revoked = true;
        this.tokens.set(refreshToken, token);
      }
      return ok(undefined);
    } catch (error: any) {
      return err(error);
    }
  }

  // Helper method for testing
  clear(): void {
    this.tokens.clear();
  }
}
