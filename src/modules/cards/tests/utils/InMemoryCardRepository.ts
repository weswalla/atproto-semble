import { Result, ok, err } from "../../../../shared/core/Result";
import { ICardRepository } from "../../domain/ICardRepository";
import { Card } from "../../domain/Card";
import { CardId } from "../../domain/value-objects/CardId";
import { URL } from "../../domain/value-objects/URL";

export class InMemoryCardRepository implements ICardRepository {
  private cards: Map<string, Card> = new Map();
  private shouldFail: boolean = false;
  private shouldFailSave: boolean = false;

  private clone(card: Card): Card {
    // Simple clone - in a real implementation you'd want proper deep cloning
    const cardResult = Card.create(
      {
        type: card.type,
        content: card.content,
        parentCardId: card.parentCardId,
        url: card.url,
        originalPublishedRecordId: card.originalPublishedRecordId,
        libraryMemberships: card.libraryMemberships,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
      },
      card.id
    );

    if (cardResult.isErr()) {
      throw new Error(`Failed to clone card: ${cardResult.error.message}`);
    }

    return cardResult.value;
  }

  async findById(id: CardId): Promise<Result<Card | null>> {
    if (this.shouldFail) {
      return err(new Error("Simulated find failure"));
    }
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

  async findUrlCardByUrl(url: URL): Promise<Result<Card | null>> {
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
    if (this.shouldFailSave || this.shouldFail) {
      return err(new Error("Simulated save failure"));
    }
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

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  setShouldFailSave(shouldFailSave: boolean): void {
    this.shouldFailSave = shouldFailSave;
  }

  // Helper methods for testing
  public clear(): void {
    this.cards.clear();
    this.shouldFail = false;
    this.shouldFailSave = false;
  }

  public getStoredCard(id: CardId): Card | undefined {
    return this.cards.get(id.getStringValue());
  }

  public getAllCards(): Card[] {
    return Array.from(this.cards.values()).map((card) => this.clone(card));
  }
}
