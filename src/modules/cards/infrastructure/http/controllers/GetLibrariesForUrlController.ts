import { Controller } from '../../../../../shared/infrastructure/http/Controller';
import { Request, Response } from 'express';
import { GetLibrariesForUrlUseCase } from '../../../application/useCases/queries/GetLibrariesForUrlUseCase';
import { CardSortField, SortOrder } from '../../../domain/ICardQueryRepository';

export class GetLibrariesForUrlController extends Controller {
  constructor(private getLibrariesForUrlUseCase: GetLibrariesForUrlUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<any> {
    try {
      const { url } = req.query;
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const sortBy = req.query.sortBy as CardSortField;
      const sortOrder = req.query.sortOrder as SortOrder;

      if (!url || typeof url !== 'string') {
        return this.badRequest(res, 'URL query parameter is required');
      }

      const result = await this.getLibrariesForUrlUseCase.execute({
        url,
        page,
        limit,
        sortBy,
        sortOrder,
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
