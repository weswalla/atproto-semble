import { Controller } from '../../../../../shared/infrastructure/http/Controller';
import { Request, Response } from 'express';
import { LogoutUseCase } from '../../../application/use-cases/LogoutUseCase';

export class LogoutController extends Controller {
  constructor(private logoutUseCase: LogoutUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<any> {
    try {
      const refreshToken = req.body?.refreshToken;

      const result = await this.logoutUseCase.execute({
        refreshToken,
      });

      if (result.isErr()) {
        return this.fail(res, result.error);
      }

      return this.ok(res, result.value);
    } catch (error: any) {
      return this.ok(res, {
        success: true,
        message: 'Logged out (client-side cleanup completed)',
      });
    }
  }
}
