import { Controller } from '../../../../../shared/infrastructure/http/Controller';
import { Response } from 'express';
import { CreateCollectionUseCase } from '../../../application/useCases/commands/CreateCollectionUseCase';
import { AuthenticatedRequest } from '../../../../../shared/infrastructure/http/middleware/AuthMiddleware';
import { AuthenticationError } from '../../../../../shared/core/AuthenticationError';

export class CreateCollectionController extends Controller {
  constructor(private createCollectionUseCase: CreateCollectionUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { name, description } = req.body;
      const curatorId = req.did;

      if (!curatorId) {
        return this.unauthorized(res);
      }

      if (!name) {
        return this.badRequest(res, 'Collection name is required');
      }

      const result = await this.createCollectionUseCase.execute({
        name,
        description,
        curatorId,
      });

      if (result.isErr()) {
        // Check if the error is an authentication error
        if (result.error instanceof AuthenticationError) {
          return this.unauthorized(res, result.error.message);
        }
        return this.fail(res, result.error);
      }

      return this.ok(res, result.value);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }
}
