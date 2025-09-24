import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'src/shared/core/Result';
import { ITokenService } from '../../application/services/ITokenService';
import { ITokenRepository } from '../../domain/repositories/ITokenRepository';
import { TokenPair } from '../../application/dtos/TokenDTO';

export class FakeJwtTokenService implements ITokenService {
  private jwtSecret: string;
  private accessTokenExpiresIn: number = 30; //3600; // 1 hour
  private refreshTokenExpiresIn: number = 60; //2592000; // 30 days

  constructor(private tokenRepository: ITokenRepository) {
    this.jwtSecret = process.env.MOCK_ACCESS_TOKEN || 'mock-access-token-123';
  }

  async generateToken(did: string): Promise<Result<TokenPair>> {
    try {
      // Generate actual JWT access token
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
      return ok(decoded.did);
    } catch (error) {
      return ok(null); // Token is invalid or expired
    }
  }

  async refreshToken(refreshToken: string): Promise<Result<TokenPair | null>> {
    try {
      // Find the refresh token
      const findResult =
        await this.tokenRepository.findRefreshToken(refreshToken);

      if (findResult.isErr()) {
        return err(findResult.error);
      }

      const tokenData = findResult.unwrap();
      if (!tokenData) {
        return ok(null);
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
