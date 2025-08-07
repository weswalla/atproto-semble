import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { Result, err, ok } from 'src/shared/core/Result';
import {
  ITokenRepository,
  RefreshToken,
} from '../../domain/repositories/ITokenRepository';
import { authRefreshTokens } from './schema/authToken.sql';

export class DrizzleTokenRepository implements ITokenRepository {
  constructor(private db: PostgresJsDatabase) {}

  async saveRefreshToken(token: RefreshToken): Promise<Result<void>> {
    try {
      await this.db.insert(authRefreshTokens).values({
        tokenId: token.tokenId,
        userDid: token.userDid,
        refreshToken: token.refreshToken,
        issuedAt: token.issuedAt,
        expiresAt: token.expiresAt,
        revoked: token.revoked,
      });

      return ok(undefined);
    } catch (error: any) {
      return err(error);
    }
  }

  async findRefreshToken(
    refreshToken: string,
  ): Promise<Result<RefreshToken | null>> {
    try {
      const result = await this.db
        .select()
        .from(authRefreshTokens)
        .where(
          and(
            eq(authRefreshTokens.refreshToken, refreshToken),
            eq(authRefreshTokens.revoked, false),
          ),
        )
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return ok({ ...result[0]!, revoked: result[0]!.revoked === true });
    } catch (error: any) {
      return err(error);
    }
  }

  async revokeRefreshToken(refreshToken: string): Promise<Result<void>> {
    try {
      await this.db
        .update(authRefreshTokens)
        .set({ revoked: true })
        .where(eq(authRefreshTokens.refreshToken, refreshToken));

      return ok(undefined);
    } catch (error: any) {
      return err(error);
    }
  }
}
