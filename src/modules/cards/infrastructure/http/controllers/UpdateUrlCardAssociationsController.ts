import { Controller } from '../../../../../shared/infrastructure/http/Controller';
import { Response } from 'express';
import { UpdateUrlCardAssociationsUseCase } from '../../../application/useCases/commands/UpdateUrlCardAssociationsUseCase';
import { AuthenticatedRequest } from '../../../../../shared/infrastructure/http/middleware/AuthMiddleware';

export class UpdateUrlCardAssociationsController extends Controller {
  constructor(
    private updateUrlCardAssociationsUseCase: UpdateUrlCardAssociationsUseCase,
  ) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { url, note, addToCollections, removeFromCollections } = req.body;
      const curatorId = req.did;

      if (!curatorId) {
        return this.unauthorized(res);
      }

      if (!url) {
        return this.badRequest(res, 'URL is required');
      }

      const result = await this.updateUrlCardAssociationsUseCase.execute({
        url,
        curatorId,
        note,
        addToCollections,
        removeFromCollections,
      });

      if (result.isErr()) {
        return this.fail(res, result.error);
      }

      return this.ok(res, result.value);
    } catch (error: any) {
      return this.fail(res, error);
    }
  }
}
