import { Controller } from '../../../../../shared/infrastructure/http/Controller';
import { Request, Response } from 'express';
import { GetCollectionsForUrlUseCase } from '../../../application/useCases/queries/GetCollectionsForUrlUseCase';

export class GetCollectionsForUrlController extends Controller {
  constructor(
    private getCollectionsForUrlUseCase: GetCollectionsForUrlUseCase,
  ) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<any> {
    try {
      const { url } = req.query;

      if (!url || typeof url !== 'string') {
        return this.badRequest(res, 'URL query parameter is required');
      }

      const result = await this.getCollectionsForUrlUseCase.execute({
        url,
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
