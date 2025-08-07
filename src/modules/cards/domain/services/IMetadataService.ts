import { UrlMetadata } from '../value-objects/UrlMetadata';
import { URL } from '../value-objects/URL';
import { Result } from '../../../../shared/core/Result';

export interface IMetadataService {
  /**
   * Fetch metadata for a URL from external service
   */
  fetchMetadata(url: URL): Promise<Result<UrlMetadata>>;

  /**
   * Check if the service is available
   */
  isAvailable(): Promise<boolean>;
}
