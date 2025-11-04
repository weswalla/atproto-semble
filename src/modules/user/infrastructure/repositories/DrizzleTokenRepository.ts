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
      const tokenPreview = '...' + token.refreshToken.slice(-8);
      console.log(`[DrizzleTokenRepository] Saving new refresh token: ${tokenPreview} for user: ${token.userDid}, expiresAt: ${token.expiresAt.toISOString()}`);

      await this.db.insert(authRefreshTokens).values({
        tokenId: token.tokenId,
        userDid: token.userDid,
        refreshToken: token.refreshToken,
        issuedAt: token.issuedAt,
        expiresAt: token.expiresAt,
        revoked: token.revoked,
      });

      console.log(`[DrizzleTokenRepository] Successfully saved refresh token: ${tokenPreview}`);
      return ok(undefined);
    } catch (error: any) {
      console.log(`[DrizzleTokenRepository] Failed to save refresh token: ${error.message}`);
      return err(error);
    }
  }

  async findRefreshToken(
    refreshToken: string,
  ): Promise<Result<RefreshToken | null>> {
    try {
      const tokenPreview = '...' + refreshToken.slice(-8);
      console.log(`[DrizzleTokenRepository] Searching for token: ${tokenPreview}`);

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

      console.log(`[DrizzleTokenRepository] Query returned ${result.length} results`);

      if (result.length === 0) {
        // Check if token exists but is revoked
        const revokedResult = await this.db
          .select()
          .from(authRefreshTokens)
          .where(eq(authRefreshTokens.refreshToken, refreshToken))
          .limit(1);

        if (revokedResult.length > 0) {
          console.log(`[DrizzleTokenRepository] Token exists but is revoked: ${tokenPreview}`);
        } else {
          console.log(`[DrizzleTokenRepository] Token does not exist in database: ${tokenPreview}`);
        }

        return ok(null);
      }

      const token = result[0]!;
      console.log(`[DrizzleTokenRepository] Token found - userDid: ${token.userDid}, revoked: ${token.revoked}, expiresAt: ${token.expiresAt.toISOString()}`);

      return ok({ ...token, revoked: token.revoked === true });
    } catch (error: any) {
      console.log(`[DrizzleTokenRepository] Database error: ${error.message}`);
      return err(error);
    }
  }

  async revokeRefreshToken(refreshToken: string): Promise<Result<void>> {
    try {
      const tokenPreview = '...' + refreshToken.slice(-8);
      console.log(`[DrizzleTokenRepository] Revoking refresh token: ${tokenPreview}`);

      const result = await this.db
        .update(authRefreshTokens)
        .set({ revoked: true })
        .where(eq(authRefreshTokens.refreshToken, refreshToken));

      console.log(`[DrizzleTokenRepository] Successfully revoked refresh token: ${tokenPreview}`);
      return ok(undefined);
    } catch (error: any) {
      console.log(`[DrizzleTokenRepository] Failed to revoke refresh token: ${error.message}`);
      return err(error);
    }
  }
}
