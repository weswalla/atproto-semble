import { UrlMetadata } from '../value-objects/UrlMetadata';
import { URL } from '../value-objects/URL';
import { Result } from '../../../../shared/core/Result';

export interface IUrlMetadataRepository {
  /**
   * Find metadata for a specific URL
   */
  findByUrl(url: URL): Promise<UrlMetadata | null>;

  /**
   * Save metadata for a URL
   */
  save(metadata: UrlMetadata): Promise<Result<void>>;

  /**
   * Check if metadata exists for a URL
   */
  exists(url: URL): Promise<boolean>;

  /**
   * Remove stale metadata entries
   */
  removeStale(maxAgeHours: number): Promise<Result<number>>;
}
