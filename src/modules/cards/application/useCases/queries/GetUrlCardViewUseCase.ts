import { CardId } from "src/modules/cards/domain/value-objects/CardId";
import { err, ok, Result } from "src/shared/core/Result";
import { UseCase } from "src/shared/core/UseCase";
import { ICardQueryRepository } from "../../../domain/ICardQueryRepository";
import { CardTypeEnum } from "src/modules/cards/domain/value-objects/CardType";

export interface GetUrlCardViewQuery {
  cardId: string;
}

// Enriched data for the final use case result
export interface UrlCardViewResult {
  id: string;
  type: CardTypeEnum.NOTE;
  urlMeta: {
    title?: string;
    description?: string;
    url: string;
    author?: string;
    thumbnailUrl?: string;
  };
  inLibraries: {
    userId: string;
    name: string;
    handle: string;
    avatarUrl?: string;
  }[];
  inCollections: {
    id: string;
    name: string;
    authorId: string;
  }[];
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class CardNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CardNotFoundError";
  }
}

export class GetUrlCardViewUseCase
  implements UseCase<GetUrlCardViewQuery, Result<UrlCardViewResult>>
{
  constructor(private cardQueryRepo: ICardQueryRepository) {}

  async execute(
    query: GetUrlCardViewQuery
  ): Promise<Result<UrlCardViewResult>> {
    // Validate card ID
    const cardIdResult = CardId.createFromString(query.cardId);
    if (cardIdResult.isErr()) {
      return err(new ValidationError("Invalid card ID"));
    }

    try {
      // Get the URL card view data
      const cardView = await this.cardQueryRepo.getUrlCardView(query.cardId);

      if (!cardView) {
        return err(new CardNotFoundError("URL card not found"));
      }

      // Transform to result format (in this case, it's already in the right format)
      const result: UrlCardViewResult = {
        id: cardView.id,
        type: cardView.type,
        urlMeta: cardView.urlMeta,
        inLibraries: cardView.inLibraries,
        inCollections: cardView.inCollections,
      };

      return ok(result);
    } catch (error) {
      return err(
        new Error(
          `Failed to retrieve URL card view: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      );
    }
  }
}
