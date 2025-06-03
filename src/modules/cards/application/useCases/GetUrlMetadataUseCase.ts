import { UseCase } from '../../../../shared/core/UseCase';
import { Result, ok, err } from '../../../../shared/core/Result';
import { UseCaseError } from '../../../../shared/core/UseCaseError';
import { URL } from '../../domain/value-objects/URL';
import { UrlMetadata } from '../../domain/value-objects/UrlMetadata';
import { IUrlMetadataRepository } from '../../domain/repositories/IUrlMetadataRepository';
import { IMetadataService } from '../../domain/services/IMetadataService';

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

export type GetUrlMetadataResponse = Result<UrlMetadata, ValidationError | MetadataNotFoundError | Error>;

export class GetUrlMetadataUseCase implements UseCase<GetUrlMetadataRequest, GetUrlMetadataResponse> {
  constructor(
    private urlMetadataRepository: IUrlMetadataRepository,
    private metadataService: IMetadataService
  ) {}

  public async execute(request: GetUrlMetadataRequest): Promise<GetUrlMetadataResponse> {
    try {
      // Validate URL
      const urlResult = URL.create(request.url);
      if (urlResult.isErr()) {
        return err(new ValidationError(urlResult.error.message));
      }

      const url = urlResult.value;
      const maxAgeHours = request.maxAgeHours ?? 24;

      // Check if we should use cached metadata
      if (!request.forceRefresh) {
        const existingMetadata = await this.urlMetadataRepository.findByUrl(url);
        if (existingMetadata && !existingMetadata.isStale(maxAgeHours)) {
          return ok(existingMetadata);
        }
      }

      // Fetch fresh metadata from external service
      const metadataResult = await this.metadataService.fetchMetadata(url);
      if (metadataResult.isErr()) {
        // If we have stale metadata, return it as fallback
        const existingMetadata = await this.urlMetadataRepository.findByUrl(url);
        if (existingMetadata) {
          return ok(existingMetadata);
        }
        return err(new MetadataNotFoundError(url.value));
      }

      const metadata = metadataResult.value;

      // Save the fresh metadata
      const saveResult = await this.urlMetadataRepository.save(metadata);
      if (saveResult.isErr()) {
        // Log the error but still return the metadata
        console.warn('Failed to save metadata:', saveResult.error);
      }

      return ok(metadata);

    } catch (error) {
      return err(new Error(`Unexpected error: ${error}`));
    }
  }
}
