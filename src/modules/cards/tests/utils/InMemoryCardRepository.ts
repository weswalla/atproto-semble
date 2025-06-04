import { Result, ok, err } from "../../../../shared/core/Result";
import { ICardRepository } from "../../domain/ICardRepository";
import { Card } from "../../domain/Card";
import { CardId } from "../../domain/value-objects/CardId";
import { CuratorId } from "../../../annotations/domain/value-objects/CuratorId";
import { URL } from "../../domain/value-objects/URL";

export class InMemoryCardRepository implements ICardRepository {
  private cards: Map<string, Card> = new Map();

  private clone(card: Card): Card {
    // Simple clone - in a real implementation you'd want proper deep cloning
    const cardResult = Card.create(
      {
        curatorId: card.curatorId,
        type: card.type,
        content: card.content,
        parentCardId: card.parentCardId,
        publishedRecordId: card.publishedRecordId,
      },
      card.id
    );

    if (cardResult.isErr()) {
      throw new Error(`Failed to clone card: ${cardResult.error.message}`);
    }

    return cardResult.value;
  }

  async findById(id: CardId): Promise<Result<Card | null>> {
    try {
      const card = this.cards.get(id.getStringValue());
      return ok(card ? this.clone(card) : null);
    } catch (error) {
      return err(error as Error);
    }
  }

  async findByParentCardId(parentCardId: CardId): Promise<Result<Card[]>> {
    try {
      const cards = Array.from(this.cards.values()).filter(
        (card) =>
          card.parentCardId?.getStringValue() === parentCardId.getStringValue()
      );
      return ok(cards.map((card) => this.clone(card)));
    } catch (error) {
      return err(error as Error);
    }
  }

  async findByCuratorId(curatorId: CuratorId): Promise<Result<Card[]>> {
    try {
      const cards = Array.from(this.cards.values()).filter(
        (card) => card.curatorId.value === curatorId.value
      );
      return ok(cards.map((card) => this.clone(card)));
    } catch (error) {
      return err(error as Error);
    }
  }

  async findByUrl(url: URL): Promise<Result<Card | null>> {
    try {
      const card = Array.from(this.cards.values()).find(
        (card) =>
          card.content.type === "URL" &&
          card.content.urlContent?.url.value === url.value
      );
      return ok(card ? this.clone(card) : null);
    } catch (error) {
      return err(error as Error);
    }
  }

  async save(card: Card): Promise<Result<void>> {
    try {
      this.cards.set(card.cardId.getStringValue(), this.clone(card));
      return ok(undefined);
    } catch (error) {
      return err(error as Error);
    }
  }

  async delete(cardId: CardId): Promise<Result<void>> {
    try {
      this.cards.delete(cardId.getStringValue());
      return ok(undefined);
    } catch (error) {
      return err(error as Error);
    }
  }

  // Helper methods for testing
  public clear(): void {
    this.cards.clear();
  }

  public getStoredCard(id: CardId): Card | undefined {
    return this.cards.get(id.getStringValue());
  }

  public getAllCards(): Card[] {
    return Array.from(this.cards.values()).map((card) => this.clone(card));
  }
}
