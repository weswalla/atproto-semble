import { UseCase } from "../../../../shared/core/UseCase";
import { Result, ok, err } from "../../../../shared/core/Result";
import { UseCaseError } from "../../../../shared/core/UseCaseError";
import { URL } from "../../domain/value-objects/URL";
import { UrlMetadata } from "../../domain/value-objects/UrlMetadata";
import { CardId } from "../../domain/value-objects/CardId";
import { CardTypeEnum } from "../../domain/value-objects/CardType";
import { IUrlMetadataRepository } from "../../domain/repositories/IUrlMetadataRepository";
import { IMetadataService } from "../../domain/services/IMetadataService";
import { ICardRepository } from "../../domain/ICardRepository";

export interface GetUrlMetadataRequest {
  url: string;
  forceRefresh?: boolean;
  maxAgeHours?: number;
}

export class ValidationError extends UseCaseError {
  constructor(message: string) {
    super(message);
  }
}

export class MetadataNotFoundError extends UseCaseError {
  constructor(url: string) {
    super(`No metadata found for URL: ${url}`);
  }
}

export interface GetUrlMetadataResult {
  metadata: UrlMetadata;
  cardId?: CardId;
}

export type GetUrlMetadataResponse = Result<
  GetUrlMetadataResult,
  ValidationError | MetadataNotFoundError | Error
>;

export class GetUrlMetadataUseCase
  implements UseCase<GetUrlMetadataRequest, GetUrlMetadataResponse>
{
  constructor(
    private urlMetadataRepository: IUrlMetadataRepository,
    private metadataService: IMetadataService,
    private cardRepository: ICardRepository
  ) {}

  public async execute(
    request: GetUrlMetadataRequest
  ): Promise<GetUrlMetadataResponse> {
    try {
      // Validate URL
      const urlResult = URL.create(request.url);
      if (urlResult.isErr()) {
        return err(new ValidationError(urlResult.error.message));
      }

      const url = urlResult.value;
      const maxAgeHours = request.maxAgeHours ?? 24 * 30; // Default to 30 days if not provided

      // Check if we should use cached metadata
      if (!request.forceRefresh) {
        const existingMetadata =
          await this.urlMetadataRepository.findByUrl(url);
        if (existingMetadata && !existingMetadata.isStale(maxAgeHours)) {
          const cardId = await this.findUrlCard(url);
          return ok({ metadata: existingMetadata, cardId });
        }
      }

      // Fetch fresh metadata from external service
      const metadataResult = await this.metadataService.fetchMetadata(url);
      if (metadataResult.isErr()) {
        // If we have stale metadata, return it as fallback
        const existingMetadata =
          await this.urlMetadataRepository.findByUrl(url);
        if (existingMetadata) {
          const cardId = await this.findUrlCard(url);
          return ok({ metadata: existingMetadata, cardId });
        }
        return err(new MetadataNotFoundError(url.value));
      }

      const metadata = metadataResult.value;

      // Save the fresh metadata
      const saveResult = await this.urlMetadataRepository.save(metadata);
      if (saveResult.isErr()) {
        // Log the error but still return the metadata
        console.warn("Failed to save metadata:", saveResult.error);
      }

      // Check for existing URL card
      const cardId = await this.findUrlCard(url);

      return ok({ metadata, cardId });
    } catch (error) {
      return err(new Error(`Unexpected error: ${error}`));
    }
  }

  private async findUrlCard(url: URL): Promise<CardId | undefined> {
    try {
      const cardResult = await this.cardRepository.findByUrl(url);
      if (cardResult.isErr()) {
        console.warn("Error finding URL card:", cardResult.error);
        return undefined;
      }

      const card = cardResult.value;
      return card ? card.cardId : undefined;
    } catch (error) {
      console.warn("Failed to find URL card:", error);
      return undefined;
    }
  }
}
