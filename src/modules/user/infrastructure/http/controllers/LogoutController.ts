import { Controller } from '../../../../../shared/infrastructure/http/Controller';
import { Request, Response } from 'express';
import { LogoutUseCase } from '../../../application/use-cases/LogoutUseCase';
import { CookieService } from '../../../../../shared/infrastructure/http/services/CookieService';

export class LogoutController extends Controller {
  constructor(
    private logoutUseCase: LogoutUseCase,
    private cookieService: CookieService,
  ) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<any> {
    try {
      // Try to get refresh token from cookie first, then fall back to request body
      const refreshToken =
        this.cookieService.getRefreshToken(req) || req.body?.refreshToken;

      const result = await this.logoutUseCase.execute({
        refreshToken,
      });

      // Clear authentication cookies regardless of use case result
      this.cookieService.clearTokens(res);

      if (result.isErr()) {
        return this.fail(res, result.error);
      }

      return this.ok(res, result.value);
    } catch (error: any) {
      // Always clear cookies on logout, even if there's an error
      this.cookieService.clearTokens(res);

      return this.ok(res, {
        success: true,
        message: 'Logged out (client-side cleanup completed)',
      });
    }
  }
}
