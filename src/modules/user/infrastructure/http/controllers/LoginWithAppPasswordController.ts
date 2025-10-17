import { Controller } from '../../../../../shared/infrastructure/http/Controller';
import { Request, Response } from 'express';
import { LoginWithAppPasswordUseCase } from '../../../application/use-cases/LoginWithAppPasswordUseCase';
import { CookieService } from '../../../../../shared/infrastructure/http/services/CookieService';

export class LoginWithAppPasswordController extends Controller {
  constructor(
    private loginWithAppPasswordUseCase: LoginWithAppPasswordUseCase,
    private cookieService: CookieService,
  ) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<any> {
    try {
      const { identifier, appPassword } = req.body;

      if (!identifier || !appPassword) {
        return this.badRequest(res, 'Missing identifier or app password');
      }

      const result = await this.loginWithAppPasswordUseCase.execute({
        identifier,
        appPassword,
      });

      if (result.isErr()) {
        return this.badRequest(res, result.error.message);
      }

      // Set tokens in httpOnly cookies
      this.cookieService.setTokens(res, {
        accessToken: result.value.accessToken,
        refreshToken: result.value.refreshToken,
      });

      return this.ok(res, {
        success: true,
        message: 'Logged in successfully',
      });
    } catch (error: any) {
      return this.fail(res, error.message || 'Unknown error');
    }
  }
}
