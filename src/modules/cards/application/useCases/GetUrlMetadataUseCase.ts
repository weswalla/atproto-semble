import { UseCase } from '../../../../shared/core/UseCase';
import { Result } from '../../../../shared/core/Result';
import { AppError } from '../../../../shared/core/AppError';
import { URL } from '../../domain/value-objects/URL';
import { UrlMetadata } from '../../domain/value-objects/UrlMetadata';
import { IUrlMetadataRepository } from '../../domain/repositories/IUrlMetadataRepository';
import { IMetadataService } from '../../domain/services/IMetadataService';

export interface GetUrlMetadataRequest {
  url: string;
  forceRefresh?: boolean;
  maxAgeHours?: number;
}

export type GetUrlMetadataResponse = Result<UrlMetadata>;

export class GetUrlMetadataUseCase implements UseCase<GetUrlMetadataRequest, GetUrlMetadataResponse> {
  constructor(
    private urlMetadataRepository: IUrlMetadataRepository,
    private metadataService: IMetadataService
  ) {}

  public async execute(request: GetUrlMetadataRequest): Promise<GetUrlMetadataResponse> {
    try {
      // Validate URL
      const urlResult = URL.create(request.url);
      if (urlResult.isFailure) {
        return Result.fail<UrlMetadata>(urlResult.getErrorValue());
      }

      const url = urlResult.getValue();
      const maxAgeHours = request.maxAgeHours ?? 24;

      // Check if we should use cached metadata
      if (!request.forceRefresh) {
        const existingMetadata = await this.urlMetadataRepository.findByUrl(url);
        if (existingMetadata && !existingMetadata.isStale(maxAgeHours)) {
          return Result.ok<UrlMetadata>(existingMetadata);
        }
      }

      // Fetch fresh metadata from external service
      const metadataResult = await this.metadataService.fetchMetadata(url);
      if (metadataResult.isFailure) {
        // If we have stale metadata, return it as fallback
        const existingMetadata = await this.urlMetadataRepository.findByUrl(url);
        if (existingMetadata) {
          return Result.ok<UrlMetadata>(existingMetadata);
        }
        return Result.fail<UrlMetadata>(metadataResult.getErrorValue());
      }

      const metadata = metadataResult.getValue();

      // Save the fresh metadata
      const saveResult = await this.urlMetadataRepository.save(metadata);
      if (saveResult.isFailure) {
        // Log the error but still return the metadata
        console.warn('Failed to save metadata:', saveResult.getErrorValue());
      }

      return Result.ok<UrlMetadata>(metadata);

    } catch (error) {
      return Result.fail<UrlMetadata>(AppError.UnexpectedError.create(error).message);
    }
  }
}
