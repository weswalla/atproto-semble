import { Result } from "../../../shared/core/Result";
import { Card } from "./Card";
import { CardId } from "./value-objects/CardId";

export interface ICardRepository {
  findById(id: CardId): Promise<Result<Card | null>>;
  save(card: Card): Promise<Result<void>>;
  delete(cardId: CardId): Promise<Result<void>>;
}
