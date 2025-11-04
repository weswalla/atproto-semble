import { Controller } from '../../../../../shared/infrastructure/http/Controller';
import { Request, Response } from 'express';
import { RefreshAccessTokenUseCase } from '../../../application/use-cases/RefreshAccessTokenUseCase';
import { CookieService } from '../../../../../shared/infrastructure/http/services/CookieService';

export class RefreshAccessTokenController extends Controller {
  constructor(
    private refreshAccessTokenUseCase: RefreshAccessTokenUseCase,
    private cookieService: CookieService,
  ) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<any> {
    try {
      // Try to get refresh token from cookie first, then fall back to request body
      let refreshToken =
        this.cookieService.getRefreshToken(req) || req.body?.refreshToken;

      if (!refreshToken) {
        return this.badRequest(res, 'Refresh token is required');
      }

      const result = await this.refreshAccessTokenUseCase.execute({
        refreshToken,
      });

      if (result.isErr()) {
        // Clear cookies when refresh fails
        this.cookieService.clearTokens(res);
        return this.fail(res, result.error);
      }

      // Set new tokens in cookies
      this.cookieService.setTokens(res, {
        accessToken: result.value.accessToken,
        refreshToken: result.value.refreshToken,
      });

      // Also return tokens in response body for backward compatibility
      return this.ok(res, result.value);
    } catch (error: any) {
      // Clear cookies on unexpected errors too
      this.cookieService.clearTokens(res);
      return this.fail(res, error);
    }
  }
}
