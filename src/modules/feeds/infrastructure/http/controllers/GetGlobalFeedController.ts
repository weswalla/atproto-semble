import { Response } from 'express';
import { GetGlobalFeedUseCase } from '../../../application/useCases/queries/GetGlobalFeedUseCase';
import { Controller } from 'src/shared/infrastructure/http/Controller';
import { AuthenticatedRequest } from 'src/shared/infrastructure/http/middleware/AuthMiddleware';

export class GetGlobalFeedController extends Controller {
  constructor(private getGlobalFeedUseCase: GetGlobalFeedUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const beforeActivityId = req.query.beforeActivityId as string;
      const callingUserId = req.did;

      const result = await this.getGlobalFeedUseCase.execute({
        callingUserId,
        page,
        limit,
        beforeActivityId,
      });

      if (result.isErr()) {
        return this.fail(res, result.error.message);
      }

      return this.ok(res, result.value);
    } catch (error) {
      return this.fail(res, 'An unexpected error occurred');
    }
  }
}
