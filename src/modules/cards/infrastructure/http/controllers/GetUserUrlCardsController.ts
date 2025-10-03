import { Controller } from '../../../../../shared/infrastructure/http/Controller';
import { Request, Response } from 'express';
import { GetUrlCardsUseCase } from '../../../application/useCases/queries/GetUrlCardsUseCase';
import { CardSortField, SortOrder } from '../../../domain/ICardQueryRepository';

export class GetUserUrlCardsController extends Controller {
  constructor(private getUrlCardsUseCase: GetUrlCardsUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<any> {
    try {
      const { identifier } = req.params;
      const { page, limit, sortBy, sortOrder } = req.query;

      if (!identifier) {
        return this.fail(res, 'Identifier (DID or handle) is required');
      }

      const result = await this.getUrlCardsUseCase.execute({
        userId: identifier,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as CardSortField,
        sortOrder: sortOrder as SortOrder,
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
