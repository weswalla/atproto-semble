import { Controller } from '../../../../../shared/infrastructure/http/Controller';
import { Response } from 'express';
import { GetMyProfileUseCase } from '../../../application/useCases/queries/GetMyProfileUseCase';
import { AuthenticatedRequest } from '../../../../../shared/infrastructure/http/middleware/AuthMiddleware';

export class GetMyProfileController extends Controller {
  constructor(private getMyProfileUseCase: GetMyProfileUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const userId = req.did;

      if (!userId) {
        return this.unauthorized(res);
      }

      const result = await this.getMyProfileUseCase.execute({ userId });

      if (result.isErr()) {
        return this.fail(res, result.error as any);
      }

      return this.ok(res, result.value);
    } catch (error: any) {
      return this.fail(res, error);
    }
  }
}
