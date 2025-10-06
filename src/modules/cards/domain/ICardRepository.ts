import { Result } from '../../../shared/core/Result';
import { Card } from './Card';
import { CardId } from './value-objects/CardId';
import { CuratorId } from './value-objects/CuratorId';
import { URL } from './value-objects/URL';

export interface ICardRepository {
  findById(id: CardId): Promise<Result<Card | null>>;
  save(card: Card): Promise<Result<void>>;
  delete(cardId: CardId): Promise<Result<void>>;
  findUsersUrlCardByUrl(
    url: URL,
    curatorId: CuratorId,
  ): Promise<Result<Card | null>>;
}
