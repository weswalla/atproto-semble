import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  ICardQueryRepository,
  CardQueryOptions,
  PaginatedQueryResult,
  UrlCardQueryResultDTO,
  CollectionCardQueryResultDTO,
  UrlCardViewDTO,
  LibraryForUrlDTO,
} from '../../domain/ICardQueryRepository';
import { UrlCardQueryService } from './query-services/UrlCardQueryService';
import { CollectionCardQueryService } from './query-services/CollectionCardQueryService';
import { LibraryQueryService } from './query-services/LibraryQueryService';

export class DrizzleCardQueryRepository implements ICardQueryRepository {
  private urlCardQueryService: UrlCardQueryService;
  private collectionCardQueryService: CollectionCardQueryService;
  private libraryQueryService: LibraryQueryService;

  constructor(private db: PostgresJsDatabase) {
    this.urlCardQueryService = new UrlCardQueryService(db);
    this.collectionCardQueryService = new CollectionCardQueryService(db);
    this.libraryQueryService = new LibraryQueryService(db);
  }

  async getUrlCardsOfUser(
    userId: string,
    options: CardQueryOptions,
  ): Promise<PaginatedQueryResult<UrlCardQueryResultDTO>> {
    return this.urlCardQueryService.getUrlCardsOfUser(userId, options);
  }

  async getCardsInCollection(
    collectionId: string,
    options: CardQueryOptions,
  ): Promise<PaginatedQueryResult<CollectionCardQueryResultDTO>> {
    return this.collectionCardQueryService.getCardsInCollection(
      collectionId,
      options,
    );
  }

  async getUrlCardView(cardId: string): Promise<UrlCardViewDTO | null> {
    return this.urlCardQueryService.getUrlCardView(cardId);
  }

  async getLibrariesForCard(cardId: string): Promise<string[]> {
    return this.libraryQueryService.getLibrariesForCard(cardId);
  }

  async getLibrariesForUrl(
    url: string,
    options: CardQueryOptions,
  ): Promise<PaginatedQueryResult<LibraryForUrlDTO>> {
    return this.urlCardQueryService.getLibrariesForUrl(url, options);
  }
}
