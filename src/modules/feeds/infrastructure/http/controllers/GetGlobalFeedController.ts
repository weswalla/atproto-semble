import { Request, Response } from 'express';
import { GetGlobalFeedUseCase } from '../../../application/useCases/queries/GetGlobalFeedUseCase';
import { BaseController } from '../../../../../shared/infrastructure/http/BaseController';

export class GetGlobalFeedController extends BaseController {
  constructor(private getGlobalFeedUseCase: GetGlobalFeedUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const beforeActivityId = req.query.beforeActivityId as string;

      const result = await this.getGlobalFeedUseCase.execute({
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
