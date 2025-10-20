import { CardId } from 'src/modules/cards/domain/value-objects/CardId';
import { err, ok, Result } from 'src/shared/core/Result';
import { UseCase } from 'src/shared/core/UseCase';
import {
  ICardQueryRepository,
  UrlCardView,
  WithCollections,
} from '../../../domain/ICardQueryRepository';
import { IProfileService } from '../../../domain/services/IProfileService';

export interface GetUrlCardViewQuery {
  cardId: string;
  callingUserId?: string;
}

// Enriched data for the final use case result
export type UrlCardViewResult = UrlCardView &
  WithCollections & {
    libraries: {
      id: string;
      name: string;
      handle: string;
      avatarUrl?: string;
    }[];
  };

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class CardNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CardNotFoundError';
  }
}

export class GetUrlCardViewUseCase
  implements UseCase<GetUrlCardViewQuery, Result<UrlCardViewResult>>
{
  constructor(
    private cardQueryRepo: ICardQueryRepository,
    private profileService: IProfileService,
  ) {}

  async execute(
    query: GetUrlCardViewQuery,
  ): Promise<Result<UrlCardViewResult>> {
    // Validate card ID
    const cardIdResult = CardId.createFromString(query.cardId);
    if (cardIdResult.isErr()) {
      return err(new ValidationError('Invalid card ID'));
    }

    try {
      // Get the URL card view data
      const cardView = await this.cardQueryRepo.getUrlCardView(
        query.cardId,
        query.callingUserId,
      );

      if (!cardView) {
        return err(new CardNotFoundError('URL card not found'));
      }

      // Get profiles for all users in libraries
      const userIds = cardView.libraries.map((lib) => lib.userId);
      const profilePromises = userIds.map((userId) =>
        this.profileService.getProfile(userId, query.callingUserId),
      );

      const profileResults = await Promise.all(profilePromises);

      // Check if any profile fetches failed
      const failedProfiles = profileResults.filter((result) => result.isErr());
      if (failedProfiles.length > 0) {
        const firstError = failedProfiles[0]!.error;
        return err(
          new Error(
            `Failed to fetch user profiles: ${firstError instanceof Error ? firstError.message : 'Unknown error'}`,
          ),
        );
      }

      // Transform to result format with enriched profile data
      const enrichedLibraries = cardView.libraries.map((lib, index) => {
        const profileResult = profileResults[index]!;
        if (profileResult.isErr()) {
          throw new Error(
            `Failed to fetch profile for user ${lib.userId}: ${profileResult.error instanceof Error ? profileResult.error.message : 'Unknown error'}`,
          );
        }
        const profile = profileResult.value;

        return {
          id: lib.userId,
          name: profile.name,
          handle: profile.handle,
          avatarUrl: profile.avatarUrl,
        };
      });

      const result: UrlCardViewResult = {
        ...cardView,
        libraries: enrichedLibraries,
      };

      return ok(result);
    } catch (error) {
      return err(
        new Error(
          `Failed to retrieve URL card view: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }
}
