import { ValueObject } from "../../../shared/domain/ValueObject";
import { Card } from "./Card";
import { CardId } from "./value-objects/CardId";
import { CardTypeEnum } from "./value-objects/CardType";
import { CuratorId } from "../../annotations/domain/value-objects/CuratorId";
import { Result, ok, err } from "../../../shared/core/Result";

interface CardsProps {
  cards: Card[];
}

export class CardsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CardsValidationError";
  }
}

export class Cards extends ValueObject<CardsProps> {
  get cards(): Card[] {
    return [...this.props.cards]; // Return a copy to prevent external mutation
  }

  get count(): number {
    return this.props.cards.length;
  }

  get isEmpty(): boolean {
    return this.props.cards.length === 0;
  }

  private constructor(props: CardsProps) {
    super(props);
  }

  public static create(cards: Card[]): Result<Cards, CardsValidationError> {
    // Validate that all card IDs are unique
    const cardIds = cards.map(card => card.cardId.getStringValue());
    const uniqueCardIds = new Set(cardIds);
    
    if (cardIds.length !== uniqueCardIds.size) {
      return err(new CardsValidationError("Duplicate card IDs are not allowed"));
    }

    return ok(new Cards({ cards: [...cards] })); // Create a copy of the array
  }

  public static createEmpty(): Cards {
    return new Cards({ cards: [] });
  }

  /**
   * Get a card by its ID
   */
  public getCardById(cardId: CardId): Card | undefined {
    return this.props.cards.find(card => 
      card.cardId.getStringValue() === cardId.getStringValue()
    );
  }

  /**
   * Check if a card exists by ID
   */
  public hasCard(cardId: CardId): boolean {
    return this.getCardById(cardId) !== undefined;
  }

  /**
   * Get all cards by curator
   */
  public getCardsByCurator(curatorId: CuratorId): Cards {
    const curatorCards = this.props.cards.filter(card => 
      card.curatorId.value === curatorId.value
    );
    return new Cards({ cards: curatorCards });
  }

  /**
   * Get all cards by type
   */
  public getCardsByType(cardType: CardTypeEnum): Cards {
    const typeCards = this.props.cards.filter(card => 
      card.type.value === cardType
    );
    return new Cards({ cards: typeCards });
  }

  /**
   * Get all URL cards
   */
  public getUrlCards(): Cards {
    return this.getCardsByType(CardTypeEnum.URL);
  }

  /**
   * Get all note cards
   */
  public getNoteCards(): Cards {
    return this.getCardsByType(CardTypeEnum.NOTE);
  }

  /**
   * Get all highlight cards
   */
  public getHighlightCards(): Cards {
    return this.getCardsByType(CardTypeEnum.HIGHLIGHT);
  }

  /**
   * Get all published cards
   */
  public getPublishedCards(): Cards {
    const publishedCards = this.props.cards.filter(card => card.isPublished);
    return new Cards({ cards: publishedCards });
  }

  /**
   * Get all unpublished cards
   */
  public getUnpublishedCards(): Cards {
    const unpublishedCards = this.props.cards.filter(card => !card.isPublished);
    return new Cards({ cards: unpublishedCards });
  }

  /**
   * Get all standalone note cards (notes without parent cards)
   */
  public getStandaloneNotes(): Cards {
    const standaloneNotes = this.props.cards.filter(card => card.isStandaloneNote);
    return new Cards({ cards: standaloneNotes });
  }

  /**
   * Get all linked note cards (notes with parent cards)
   */
  public getLinkedNotes(): Cards {
    const linkedNotes = this.props.cards.filter(card => card.isLinkedNote);
    return new Cards({ cards: linkedNotes });
  }

  /**
   * Get cards by parent card ID
   */
  public getCardsByParent(parentCardId: CardId): Cards {
    const childCards = this.props.cards.filter(card => 
      card.parentCardId?.getStringValue() === parentCardId.getStringValue()
    );
    return new Cards({ cards: childCards });
  }

  /**
   * Add a card to the collection
   */
  public addCard(card: Card): Result<Cards, CardsValidationError> {
    // Check if card already exists
    if (this.hasCard(card.cardId)) {
      return err(new CardsValidationError("Card with this ID already exists"));
    }

    const newCards = [...this.props.cards, card];
    return Cards.create(newCards);
  }

  /**
   * Remove a card from the collection
   */
  public removeCard(cardId: CardId): Cards {
    const filteredCards = this.props.cards.filter(card => 
      card.cardId.getStringValue() !== cardId.getStringValue()
    );
    return new Cards({ cards: filteredCards });
  }

  /**
   * Update a card in the collection
   */
  public updateCard(updatedCard: Card): Result<Cards, CardsValidationError> {
    const cardIndex = this.props.cards.findIndex(card => 
      card.cardId.getStringValue() === updatedCard.cardId.getStringValue()
    );

    if (cardIndex === -1) {
      return err(new CardsValidationError("Card not found"));
    }

    const newCards = [...this.props.cards];
    newCards[cardIndex] = updatedCard;
    
    return ok(new Cards({ cards: newCards }));
  }

  /**
   * Filter cards by a predicate function
   */
  public filter(predicate: (card: Card) => boolean): Cards {
    const filteredCards = this.props.cards.filter(predicate);
    return new Cards({ cards: filteredCards });
  }

  /**
   * Map over cards and return an array
   */
  public map<T>(mapper: (card: Card) => T): T[] {
    return this.props.cards.map(mapper);
  }

  /**
   * Find the first card that matches a predicate
   */
  public find(predicate: (card: Card) => boolean): Card | undefined {
    return this.props.cards.find(predicate);
  }

  /**
   * Check if any card matches a predicate
   */
  public some(predicate: (card: Card) => boolean): boolean {
    return this.props.cards.some(predicate);
  }

  /**
   * Check if all cards match a predicate
   */
  public every(predicate: (card: Card) => boolean): boolean {
    return this.props.cards.every(predicate);
  }

  /**
   * Sort cards by creation date (newest first)
   */
  public sortByCreatedAt(ascending: boolean = false): Cards {
    const sortedCards = [...this.props.cards].sort((a, b) => {
      const comparison = a.createdAt.getTime() - b.createdAt.getTime();
      return ascending ? comparison : -comparison;
    });
    return new Cards({ cards: sortedCards });
  }

  /**
   * Sort cards by update date (newest first)
   */
  public sortByUpdatedAt(ascending: boolean = false): Cards {
    const sortedCards = [...this.props.cards].sort((a, b) => {
      const comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
      return ascending ? comparison : -comparison;
    });
    return new Cards({ cards: sortedCards });
  }

  /**
   * Get cards created within a date range
   */
  public getCardsCreatedBetween(startDate: Date, endDate: Date): Cards {
    const cardsInRange = this.props.cards.filter(card => 
      card.createdAt >= startDate && card.createdAt <= endDate
    );
    return new Cards({ cards: cardsInRange });
  }

  /**
   * Get cards updated within a date range
   */
  public getCardsUpdatedBetween(startDate: Date, endDate: Date): Cards {
    const cardsInRange = this.props.cards.filter(card => 
      card.updatedAt >= startDate && card.updatedAt <= endDate
    );
    return new Cards({ cards: cardsInRange });
  }

  /**
   * Combine with another Cards collection
   */
  public combine(otherCards: Cards): Result<Cards, CardsValidationError> {
    const allCards = [...this.props.cards, ...otherCards.cards];
    return Cards.create(allCards);
  }

  /**
   * Get the first card (if any)
   */
  public first(): Card | undefined {
    return this.props.cards[0];
  }

  /**
   * Get the last card (if any)
   */
  public last(): Card | undefined {
    return this.props.cards[this.props.cards.length - 1];
  }

  /**
   * Convert to array of card IDs
   */
  public toCardIds(): CardId[] {
    return this.props.cards.map(card => card.cardId);
  }

  /**
   * Get summary statistics
   */
  public getStats(): {
    total: number;
    urlCards: number;
    noteCards: number;
    highlightCards: number;
    published: number;
    unpublished: number;
    standaloneNotes: number;
    linkedNotes: number;
  } {
    return {
      total: this.count,
      urlCards: this.getUrlCards().count,
      noteCards: this.getNoteCards().count,
      highlightCards: this.getHighlightCards().count,
      published: this.getPublishedCards().count,
      unpublished: this.getUnpublishedCards().count,
      standaloneNotes: this.getStandaloneNotes().count,
      linkedNotes: this.getLinkedNotes().count,
    };
  }
}
