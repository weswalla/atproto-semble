import { Controller } from '../../../../../shared/infrastructure/http/Controller';
import { Request, Response } from 'express';
import { GetCollectionsUseCase } from '../../../application/useCases/queries/GetCollectionsUseCase';
import {
  CollectionSortField,
  SortOrder,
} from '../../../domain/ICollectionQueryRepository';
import { DIDOrHandle } from '../../../../atproto/domain/DIDOrHandle';

export class GetUserCollectionsController extends Controller {
  constructor(private getCollectionsUseCase: GetCollectionsUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<any> {
    try {
      const { identifier } = req.params;
      const { page, limit, sortBy, sortOrder, searchText } = req.query;

      if (!identifier) {
        return this.fail(res, 'Identifier (DID or handle) is required');
      }

      // Validate the identifier as either DID or handle
      const didOrHandleResult = DIDOrHandle.create(identifier);
      if (didOrHandleResult.isErr()) {
        return this.fail(res, `Invalid identifier: ${didOrHandleResult.error.message}`);
      }

      const result = await this.getCollectionsUseCase.execute({
        curatorId: didOrHandleResult.value,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as CollectionSortField,
        sortOrder: sortOrder as SortOrder,
        searchText: searchText as string,
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
