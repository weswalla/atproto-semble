import { Controller } from '../../../../../shared/infrastructure/http/Controller';
import { Request, Response } from 'express';
import { GetUrlCardsUseCase } from '../../../application/useCases/queries/GetUrlCardsUseCase';
import { CardSortField, SortOrder } from '../../../domain/ICardQueryRepository';
import { DIDOrHandle } from '../../../../atproto/domain/DIDOrHandle';

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

      // Validate the identifier as either DID or handle
      const didOrHandleResult = DIDOrHandle.create(identifier);
      if (didOrHandleResult.isErr()) {
        return this.fail(res, `Invalid identifier: ${didOrHandleResult.error.message}`);
      }

      const result = await this.getUrlCardsUseCase.execute({
        userId: didOrHandleResult.value,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as CardSortField,
        sortOrder: sortOrder as SortOrder,
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
