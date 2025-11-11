import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Result, err, ok } from 'src/shared/core/Result';
import { ITokenService } from '../../application/services/ITokenService';
import { TokenPair } from '@semble/types';
import { ITokenRepository } from '../../domain/repositories/ITokenRepository';

export class JwtTokenService implements ITokenService {
  constructor(
    private tokenRepository: ITokenRepository,
    private jwtSecret: string,
    private accessTokenExpiresIn: number = 3600, // 1 hour
    private refreshTokenExpiresIn: number = 2592000, // 30 days
  ) {}

  async generateToken(did: string): Promise<Result<TokenPair>> {
    try {
      // Generate access token
      const accessToken = jwt.sign(
        { did, iat: Math.floor(Date.now() / 1000) },
        this.jwtSecret,
        { expiresIn: this.accessTokenExpiresIn },
      );

      // Generate refresh token
      const refreshToken = uuidv4();
      const tokenId = uuidv4();
      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + this.refreshTokenExpiresIn * 1000,
      );

      // Store refresh token
      const saveResult = await this.tokenRepository.saveRefreshToken({
        tokenId,
        userDid: did,
        refreshToken,
        issuedAt: now,
        expiresAt,
        revoked: false,
      });

      if (saveResult.isErr()) {
        return err(saveResult.error);
      }

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
      console.log(`[JwtTokenService] Token validation successful for user: ${decoded.did}`);
      return ok(decoded.did);
    } catch (error: any) {
      console.log(`[JwtTokenService] Token validation failed: ${error.message}`);
      return ok(null); // Token is invalid or expired
    }
  }

  async refreshToken(refreshToken: string): Promise<Result<TokenPair | null>> {
    try {
      const tokenPreview = '...' + refreshToken.slice(-8);
      console.log(
        `[JwtTokenService] Starting refresh for token: ${tokenPreview}`,
      );

      // Find the refresh token
      const findResult =
        await this.tokenRepository.findRefreshToken(refreshToken);

      if (findResult.isErr()) {
        console.log(
          `[JwtTokenService] Database error finding token: ${findResult.error.message}`,
        );
        return err(findResult.error);
      }

      const tokenData = findResult.unwrap();
      if (!tokenData) {
        console.log(
          `[JwtTokenService] Token not found in database: ${tokenPreview}`,
        );
        return ok(null);
      }

      console.log(
        `[JwtTokenService] Token found - userDid: ${tokenData.userDid}, issuedAt: ${tokenData.issuedAt.toISOString()}, expiresAt: ${tokenData.expiresAt.toISOString()}, revoked: ${tokenData.revoked}`,
      );

      // Check if token is expired
      const now = new Date();
      if (now > tokenData.expiresAt) {
        console.log(
          `[JwtTokenService] Token expired - now: ${now.toISOString()}, expiresAt: ${tokenData.expiresAt.toISOString()}`,
        );
        await this.revokeToken(refreshToken);
        return ok(null);
      }

      console.log(
        `[JwtTokenService] Token is valid, generating new tokens for user: ${tokenData.userDid}`,
      );

      // Generate new tokens
      const newTokens = await this.generateToken(tokenData.userDid);

      if (newTokens.isErr()) {
        console.log(
          `[JwtTokenService] Failed to generate new tokens: ${newTokens.error.message}`,
        );
        return newTokens;
      }

      console.log(`[JwtTokenService] New tokens generated successfully`);

      // Revoke old token
      const revokeResult = await this.revokeToken(refreshToken);
      if (revokeResult.isErr()) {
        console.log(
          `[JwtTokenService] Warning: Failed to revoke old token: ${revokeResult.error.message}`,
        );
      } else {
        console.log(`[JwtTokenService] Old token revoked successfully`);
      }

      return newTokens;
    } catch (error: any) {
      console.log(
        `[JwtTokenService] Unexpected error during refresh: ${error.message}`,
      );
      return err(error);
    }
  }

  async revokeToken(refreshToken: string): Promise<Result<void>> {
    try {
      const revokeResult =
        await this.tokenRepository.revokeRefreshToken(refreshToken);

      if (revokeResult.isErr()) {
        return err(revokeResult.error);
      }

      return ok(undefined);
    } catch (error: any) {
      return err(error);
    }
  }
}
