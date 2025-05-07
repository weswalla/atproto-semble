import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, and } from "drizzle-orm";
import { Result, err, ok } from "src/shared/core/Result";
import { ITokenService } from "../../application/services/ITokenService";
import { TokenPair } from "../../application/dtos/TokenDTO";
import { authRefreshTokens } from "../repositories/schema/authTokenSchema";

export class JwtTokenService implements ITokenService {
  constructor(
    private db: PostgresJsDatabase,
    private jwtSecret: string,
    private accessTokenExpiresIn: number = 3600, // 1 hour
    private refreshTokenExpiresIn: number = 2592000 // 30 days
  ) {}

  async generateToken(did: string): Promise<Result<TokenPair>> {
    try {
      // Generate access token
      const accessToken = jwt.sign(
        { did, iat: Math.floor(Date.now() / 1000) },
        this.jwtSecret,
        { expiresIn: this.accessTokenExpiresIn }
      );

      // Generate refresh token
      const refreshToken = uuidv4();
      const tokenId = uuidv4();
      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + this.refreshTokenExpiresIn * 1000
      );

      // Store refresh token
      await this.db.insert(authRefreshTokens).values({
        tokenId,
        userDid: did,
        refreshToken,
        issuedAt: now,
        expiresAt,
        revoked: false,
      });

      return ok({
        accessToken,
        refreshToken,
        expiresIn: this.accessTokenExpiresIn,
      });
    } catch (error: any) {
      return err(error);
    }
  }

  async validateToken(token: string): Promise<Result<string | null>> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { did: string };
      return ok(decoded.did);
    } catch (error) {
      return ok(null); // Token is invalid or expired
    }
  }

  async refreshToken(refreshToken: string): Promise<Result<TokenPair | null>> {
    try {
      // Find the refresh token
      const result = await this.db
        .select()
        .from(authRefreshTokens)
        .where(
          and(
            eq(authRefreshTokens.refreshToken, refreshToken),
            eq(authRefreshTokens.revoked, false)
          )
        )
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const tokenData = result[0];
      if (!tokenData) {
        return err(new Error("Token not found"));
      }

      // Check if token is expired
      if (new Date() > tokenData.expiresAt) {
        await this.revokeToken(refreshToken);
        return ok(null);
      }

      // Generate new tokens
      const newTokens = await this.generateToken(tokenData.userDid);

      // Revoke old token
      await this.revokeToken(refreshToken);

      return newTokens;
    } catch (error: any) {
      return err(error);
    }
  }

  async revokeToken(refreshToken: string): Promise<Result<void>> {
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
