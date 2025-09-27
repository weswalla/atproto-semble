import { err, ok, Result } from 'src/shared/core/Result';
import { UseCase } from 'src/shared/core/UseCase';
import { IAtUriResolutionService } from '../../../domain/services/IAtUriResolutionService';
import { 
  GetCollectionPageUseCase, 
  GetCollectionPageResult,
  CollectionNotFoundError,
  CardSortField,
  SortOrder
} from './GetCollectionPageUseCase';

export interface GetCollectionPageByAtUriQuery {
  atUri: string;
  callerDid?: string;
  page?: number;
  limit?: number;
  sortBy?: CardSortField;
  sortOrder?: SortOrder;
}

export class GetCollectionPageByAtUriUseCase
  implements UseCase<GetCollectionPageByAtUriQuery, Result<GetCollectionPageResult>>
{
  constructor(
    private atUriResolutionService: IAtUriResolutionService,
    private getCollectionPageUseCase: GetCollectionPageUseCase,
  ) {}

  async execute(
    query: GetCollectionPageByAtUriQuery,
  ): Promise<Result<GetCollectionPageResult>> {
    // First resolve the AT URI to a collection ID
    const collectionIdResult = await this.atUriResolutionService
      .resolveCollectionId(query.atUri);

    if (collectionIdResult.isErr()) {
      return err(collectionIdResult.error);
    }

    if (!collectionIdResult.value) {
      return err(new CollectionNotFoundError('Collection not found for AT URI'));
    }

    // Delegate to the existing use case
    return this.getCollectionPageUseCase.execute({
      collectionId: collectionIdResult.value.getStringValue(),
      callerDid: query.callerDid,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }
}
