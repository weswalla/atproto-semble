import { Controller } from '../../../../../shared/infrastructure/http/Controller';
import { Response } from 'express';
import { AddUrlToLibraryUseCase } from '../../../application/useCases/commands/AddUrlToLibraryUseCase';
import { AuthenticatedRequest } from '../../../../../shared/infrastructure/http/middleware/AuthMiddleware';

export class AddUrlToLibraryController extends Controller {
  constructor(private addUrlToLibraryUseCase: AddUrlToLibraryUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { url, note, collectionIds } = req.body;
      const curatorId = req.did;

      if (!curatorId) {
        return this.unauthorized(res);
      }

      if (!url) {
        return this.badRequest(res, 'URL is required');
      }

      const result = await this.addUrlToLibraryUseCase.execute({
        url,
        note,
        collectionIds: collectionIds || [],
        curatorId,
      });

      if (result.isErr()) {
        return this.fail(res, result.error as any);
      }

      return this.ok(res, result.value);
    } catch (error: any) {
      return this.fail(res, error);
    }
  }
}
