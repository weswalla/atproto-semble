import { Request, Response } from 'express';
import { Controller } from 'src/shared/infrastructure/http/Controller';
import { GetCollectionPageByAtUriUseCase } from '../../../application/useCases/queries/GetCollectionPageByAtUriUseCase';
import { AuthenticatedRequest } from 'src/shared/infrastructure/http/middleware/AuthMiddleware';
import { CardSortField, SortOrder } from '../../../domain/ICardQueryRepository';

export class GetCollectionPageByAtUriController extends Controller {
  constructor(
    private getCollectionPageByAtUriUseCase: GetCollectionPageByAtUriUseCase,
  ) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { handle, recordKey } = req.params;
      if (!handle || !recordKey) {
        return this.badRequest(res, 'Handle and recordKey are required');
      }
      const { page, limit, sortBy, sortOrder } = req.query;
      const callerDid = req.did;

      const result = await this.getCollectionPageByAtUriUseCase.execute({
        handle,
        recordKey,
        callerDid,
        callingUserId: callerDid,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as CardSortField,
        sortOrder: sortOrder as SortOrder,
      });

      if (result.isErr()) {
        const error = result.error;
        if (error.name === 'CollectionNotFoundError') {
          return this.notFound(res, error.message);
        }
        return this.fail(res, error);
      }

      return this.ok(res, result.value);
    } catch (error) {
      return this.fail(res, error as Error);
    }
  }
}
