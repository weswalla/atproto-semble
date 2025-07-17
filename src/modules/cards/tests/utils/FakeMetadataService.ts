import { Result, ok, err } from '../../../../shared/core/Result';
import { IMetadataService } from '../../domain/services/IMetadataService';
import { UrlMetadata } from '../../domain/value-objects/UrlMetadata';
import { URL } from '../../domain/value-objects/URL';

export class FakeMetadataService implements IMetadataService {
  private metadataMap: Map<string, UrlMetadata> = new Map();
  private shouldFail: boolean = false;
  private available: boolean = true;

  async fetchMetadata(url: URL): Promise<Result<UrlMetadata>> {
    if (!this.available) {
      return err(new Error('Metadata service is not available'));
    }

    if (this.shouldFail) {
      return err(new Error('Failed to fetch metadata'));
    }

    // Check if we have pre-configured metadata for this URL
    const existingMetadata = this.metadataMap.get(url.value);
    if (existingMetadata) {
      return ok(existingMetadata);
    }

    // Generate fake metadata
    const metadataResult = UrlMetadata.create({
      url: url.value,
      title: `Fake Title for ${url.value}`,
      description: `Fake description for ${url.value}`,
      author: 'Fake Author',
      siteName: 'Fake Site',
      retrievedAt: new Date(),
    });

    if (metadataResult.isErr()) {
      return err(
        new Error(`Failed to create metadata: ${metadataResult.error.message}`),
      );
    }

    return ok(metadataResult.value);
  }

  async isAvailable(): Promise<boolean> {
    return this.available;
  }

  // Test helper methods
  public setMetadata(url: string, metadata: UrlMetadata): void {
    this.metadataMap.set(url, metadata);
  }

  public setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  public setAvailable(available: boolean): void {
    this.available = available;
  }

  public clear(): void {
    this.metadataMap.clear();
    this.shouldFail = false;
    this.available = true;
  }
}
