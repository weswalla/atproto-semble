import { IMetadataService } from "../domain/services/IMetadataService";
import { UrlMetadata } from "../domain/value-objects/UrlMetadata";
import { URL } from "../domain/value-objects/URL";
import { Result, ok, err } from "../../../shared/core/Result";

interface CitoidResponse {
  key?: string;
  version?: number;
  itemType?: string;
  creators?: Array<{
    firstName?: string;
    lastName?: string;
    creatorType?: string;
  }>;
  tags?: string[];
  title?: string;
  date?: string;
  url?: string;
  abstractNote?: string;
  publicationTitle?: string;
  language?: string;
  libraryCatalog?: string;
  accessDate?: string;
}

interface CitoidErrorResponse {
  Error: string;
}

export class CitoidMetadataService implements IMetadataService {
  private readonly baseUrl =
    "https://en.wikipedia.org/api/rest_v1/data/citation/zotero/";
  private readonly headers = {
    accept: "application/json; charset=utf-8;",
  };

  async fetchMetadata(url: URL): Promise<Result<UrlMetadata>> {
    try {
      // URL-encode the target URL
      const encodedUrl = encodeURIComponent(url.value);
      const fullUrl = this.baseUrl + encodedUrl;

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: this.headers,
      });

      if (!response.ok) {
        return err(
          new Error(`Citoid API request failed with status ${response.status}`)
        );
      }

      const data = (await response.json()) as any;

      // Check if the response is an error
      if (data && typeof data === 'object' && 'Error' in data) {
        const errorResponse = data as CitoidErrorResponse;
        return err(new Error(`Citoid service error: ${errorResponse.Error}`));
      }

      // Check if it's an array response
      if (!Array.isArray(data) || data.length === 0) {
        return err(new Error("No metadata found for the given URL"));
      }

      // Use the first result
      const citoidData = data[0] as CitoidResponse;
      if (!citoidData || !citoidData.itemType) {
        return err(new Error("Invalid metadata format from Citoid"));
      }

      // Extract author from creators array
      const author =
        citoidData.creators && citoidData.creators.length > 0
          ? this.formatAuthor(citoidData.creators[0]!)
          : undefined;

      // Parse published date
      const publishedDate = citoidData.date
        ? this.parseDate(citoidData.date)
        : undefined;

      const metadataResult = UrlMetadata.create({
        url: url.value,
        title: citoidData.title,
        description: citoidData.abstractNote,
        author,
        publishedDate,
        siteName: citoidData.publicationTitle || citoidData.libraryCatalog,
        type: citoidData.itemType,
      });

      return metadataResult;
    } catch (error) {
      return err(
        new Error(
          `Failed to fetch metadata from Citoid: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test with a simple URL to check if the service is available
      const testUrl = this.baseUrl + encodeURIComponent("https://example.com");
      const response = await fetch(testUrl, {
        method: "HEAD",
        headers: this.headers,
      });

      // Service is available if we get any response (even 4xx errors are fine)
      return response.status < 500;
    } catch {
      return false;
    }
  }

  private formatAuthor(creator: {
    firstName?: string;
    lastName?: string;
  }): string {
    const { firstName, lastName } = creator;

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (lastName) {
      return lastName;
    } else if (firstName) {
      return firstName;
    }

    return "";
  }

  private parseDate(dateString: string): Date | undefined {
    try {
      // Try to parse the date string
      const parsed = new Date(dateString);

      // Check if the date is valid
      if (isNaN(parsed.getTime())) {
        return undefined;
      }

      return parsed;
    } catch {
      return undefined;
    }
  }
}
