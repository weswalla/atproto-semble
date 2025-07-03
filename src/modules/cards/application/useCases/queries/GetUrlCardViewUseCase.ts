import { CardId } from "src/modules/cards/domain/value-objects/CardId";
import { err, ok, Result } from "src/shared/core/Result";
import { UseCase } from "src/shared/core/UseCase";
import { ICardQueryRepository } from "../../../domain/ICardQueryRepository";
import { CardTypeEnum } from "src/modules/cards/domain/value-objects/CardType";
import { IProfileService } from "../../../domain/services/IProfileService";

export interface GetUrlCardViewQuery {
  cardId: string;
}

// Enriched data for the final use case result
export interface UrlCardViewResult {
  id: string;
  type: CardTypeEnum.URL;
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
  constructor(
    private cardQueryRepo: ICardQueryRepository,
    private profileService: IProfileService
  ) {}

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

      // Get profiles for all users in libraries
      const userIds = cardView.inLibraries.map((lib) => lib.userId);
      const profilePromises = userIds.map((userId) =>
        this.profileService.getProfile(userId)
      );

      const profileResults = await Promise.all(profilePromises);

      // Check if any profile fetches failed
      const failedProfiles = profileResults.filter((result) => result.isErr());
      if (failedProfiles.length > 0) {
        const firstError = failedProfiles[0]!.error;
        return err(
          new Error(
            `Failed to fetch user profiles: ${firstError instanceof Error ? firstError.message : "Unknown error"}`
          )
        );
      }

      // Transform to result format with enriched profile data
      const enrichedLibraries = cardView.inLibraries.map((lib, index) => {
        const profileResult = profileResults[index]!;
        if (profileResult.isErr()) {
          throw new Error(
            `Failed to fetch profile for user ${lib.userId}: ${profileResult.error instanceof Error ? profileResult.error.message : "Unknown error"}`
          );
        }
        const profile = profileResult.value;

        return {
          userId: lib.userId,
          name: profile.name,
          handle: profile.handle,
          avatarUrl: profile.avatarUrl,
        };
      });

      const result: UrlCardViewResult = {
        id: cardView.id,
        type: cardView.type,
        urlMeta: cardView.urlMeta,
        inLibraries: enrichedLibraries,
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
