import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  IConnectionQueryRepository,
  ConnectionQueryOptions,
  PaginatedConnectionQueryResult,
  ConnectionForUrlDTO,
  ConnectionForUserDTO,
} from '../../domain/IConnectionQueryRepository';
import { ConnectionQueryService } from './query-services/ConnectionQueryService';
import { ConnectionTypeEnum } from '../../domain/value-objects/ConnectionType';

export class DrizzleConnectionQueryRepository implements IConnectionQueryRepository {
  private connectionQueryService: ConnectionQueryService;

  constructor(private db: PostgresJsDatabase) {
    this.connectionQueryService = new ConnectionQueryService(db);
  }

  async getForwardConnectionsForUrl(
    url: string,
    options: ConnectionQueryOptions,
    callingUserId?: string,
  ): Promise<PaginatedConnectionQueryResult<ConnectionForUrlDTO>> {
    return this.connectionQueryService.getForwardConnectionsForUrl(
      url,
      options,
      callingUserId,
    );
  }

  async getBackwardConnectionsForUrl(
    url: string,
    options: ConnectionQueryOptions,
    callingUserId?: string,
  ): Promise<PaginatedConnectionQueryResult<ConnectionForUrlDTO>> {
    return this.connectionQueryService.getBackwardConnectionsForUrl(
      url,
      options,
      callingUserId,
    );
  }

  async getConnectionsForUrl(
    url: string,
    direction: 'forward' | 'backward' | 'both',
    options: ConnectionQueryOptions,
    callingUserId?: string,
  ): Promise<PaginatedConnectionQueryResult<ConnectionForUserDTO>> {
    return this.connectionQueryService.getConnectionsForUrlWithDirection(
      url,
      direction,
      options,
      callingUserId,
    );
  }

  async getConnectionsForUser(
    curatorId: string,
    options: ConnectionQueryOptions,
    callingUserId?: string,
  ): Promise<PaginatedConnectionQueryResult<ConnectionForUserDTO>> {
    return this.connectionQueryService.getConnectionsForUser(
      curatorId,
      options,
      callingUserId,
    );
  }

  async getConnectionStatsForUrl(url: string): Promise<{
    forwardTotal: number;
    backwardTotal: number;
    forwardByType: Map<ConnectionTypeEnum, number>;
    backwardByType: Map<ConnectionTypeEnum, number>;
  }> {
    return this.connectionQueryService.getConnectionStatsForUrl(url);
  }

  async getConnectionStatsForCurator(curatorId: string): Promise<{
    total: number;
    byType: Map<ConnectionTypeEnum, number>;
  }> {
    return this.connectionQueryService.getConnectionStatsForCurator(curatorId);
  }
}
