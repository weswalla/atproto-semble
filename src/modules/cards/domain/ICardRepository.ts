import { Result } from "../../../shared/core/Result";
import { Card } from "./Card";
import { CardId } from "./value-objects/CardId";
import { CuratorId } from "../../annotations/domain/value-objects/CuratorId";
import { URL } from "./value-objects/URL";

export interface ICardRepository {
  findById(id: CardId): Promise<Result<Card | null>>;
  findByParentCardId(parentCardId: CardId): Promise<Result<Card[]>>;
  findByCuratorId(curatorId: CuratorId): Promise<Result<Card[]>>;
  findByUrl(url: URL): Promise<Result<Card | null>>;
  save(card: Card): Promise<Result<void>>;
  delete(cardId: CardId): Promise<Result<void>>;
}
