import { IFramelyMetadataService } from "../../infrastructure/IFramelyMetadataService";
import { URL } from "../../domain/value-objects/URL";

describe("IFramelyMetadataService Integration Tests", () => {
  let service: IFramelyMetadataService;
  const testApiKey = process.env.IFRAMELY_API_KEY || "test-api-key";

  beforeEach(() => {
    service = new IFramelyMetadataService(testApiKey);
  });

  describe("constructor", () => {
    it("should throw error if API key is not provided", () => {
      expect(() => new IFramelyMetadataService("")).toThrow(
        "Iframely API key is required"
      );
    });

    it("should throw error if API key is whitespace", () => {
      expect(() => new IFramelyMetadataService("   ")).toThrow(
        "Iframely API key is required"
      );
    });
  });

  describe("fetchMetadata", () => {
    it("should fetch metadata for a YouTube video", async () => {
      // Skip if no API key is provided
      if (testApiKey === "test-api-key") {
        console.log(
          "Skipping test - no IFRAMELY_API_KEY environment variable set"
        );
        return;
      }

      // Arrange
      const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      const urlResult = URL.create(youtubeUrl);
      expect(urlResult.isOk()).toBe(true);
      const url = urlResult.unwrap();

      // Act
      const result = await service.fetchMetadata(url);

      // Assert
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        const metadata = result.unwrap();

        // Basic structure checks
        expect(metadata.url).toBe(youtubeUrl);
        expect(metadata.retrievedAt).toBeInstanceOf(Date);

        // Content checks - YouTube videos should have these fields
        expect(metadata.title).toBeDefined();
        expect(metadata.title).not.toBe("");

        expect(metadata.description).toBeDefined();
        expect(metadata.description).not.toBe("");

        // YouTube specific checks
        expect(metadata.siteName).toBe("YouTube");
        expect(metadata.type).toBe("video");

        // Should have thumbnail image
        expect(metadata.imageUrl).toBeDefined();
        expect(metadata.imageUrl).toMatch(/^https?:\/\//);

        console.log("Fetched YouTube metadata:", {
          title: metadata.title,
          author: metadata.author,
          description: metadata.description?.substring(0, 100) + "...",
          type: metadata.type,
          siteName: metadata.siteName,
          imageUrl: metadata.imageUrl,
          publishedDate: metadata.publishedDate,
        });
      }
    }, 15000); // 15 second timeout for network request

    it("should fetch metadata for a news article", async () => {
      // Skip if no API key is provided
      if (testApiKey === "test-api-key") {
        console.log(
          "Skipping test - no IFRAMELY_API_KEY environment variable set"
        );
        return;
      }

      // Arrange
      const newsUrl = "https://www.bbc.com/news";
      const urlResult = URL.create(newsUrl);
      expect(urlResult.isOk()).toBe(true);
      const url = urlResult.unwrap();

      // Act
      const result = await service.fetchMetadata(url);

      // Assert
      if (result.isOk()) {
        const metadata = result.unwrap();

        expect(metadata.url).toBe(newsUrl);
        expect(metadata.title).toBeDefined();
        expect(metadata.siteName).toBeDefined();

        console.log("Fetched news metadata:", {
          title: metadata.title,
          siteName: metadata.siteName,
          description: metadata.description?.substring(0, 100) + "...",
        });
      } else {
        // Some news sites might block automated requests
        console.log("News site blocked request:", result.error.message);
      }
    }, 15000);

    it("should handle invalid URLs gracefully", async () => {
      // Skip if no API key is provided
      if (testApiKey === "test-api-key") {
        console.log(
          "Skipping test - no IFRAMELY_API_KEY environment variable set"
        );
        return;
      }

      // Arrange
      const invalidUrl = "https://this-domain-should-not-exist-12345.com";
      const urlResult = URL.create(invalidUrl);
      expect(urlResult.isOk()).toBe(true);
      const url = urlResult.unwrap();

      // Act
      const result = await service.fetchMetadata(url);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toMatch(/metadata|error|failed/i);
      }
    }, 15000);

    it("should handle API errors gracefully", async () => {
      // Arrange - use invalid API key
      const invalidService = new IFramelyMetadataService("invalid-key");
      const testUrl = "https://example.com";
      const urlResult = URL.create(testUrl);
      expect(urlResult.isOk()).toBe(true);
      const url = urlResult.unwrap();

      // Act
      const result = await invalidService.fetchMetadata(url);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toMatch(/failed|error|401|403/i);
      }
    }, 10000);
  });

  describe("isAvailable", () => {
    it("should check if Iframely service is available", async () => {
      // Act
      const isAvailable = await service.isAvailable();

      // Assert
      expect(typeof isAvailable).toBe("boolean");

      if (testApiKey !== "test-api-key") {
        // With a real API key, service should be available
        expect(isAvailable).toBe(true);
      }

      console.log("Iframely service availability:", isAvailable);
    }, 10000);

    it("should return available for invalid API key", async () => {
      // Arrange
      const invalidService = new IFramelyMetadataService("invalid-key");

      // Act
      const isAvailable = await invalidService.isAvailable();

      // Assert
      expect(isAvailable).toBe(true);
    }, 10000);
  });

  describe("date parsing", () => {
    it("should parse publication dates correctly", async () => {
      // Skip if no API key is provided
      if (testApiKey === "test-api-key") {
        console.log(
          "Skipping test - no IFRAMELY_API_KEY environment variable set"
        );
        return;
      }

      // Arrange - use a URL that typically has a publication date
      const articleUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      const urlResult = URL.create(articleUrl);
      expect(urlResult.isOk()).toBe(true);
      const url = urlResult.unwrap();

      // Act
      const result = await service.fetchMetadata(url);

      // Assert
      if (result.isOk()) {
        const metadata = result.unwrap();

        if (metadata.publishedDate) {
          expect(metadata.publishedDate).toBeInstanceOf(Date);
          expect(metadata.publishedDate.getTime()).not.toBeNaN();

          // Should be a reasonable date (not in the future, not too old)
          const now = new Date();
          const twentyYearsAgo = new Date(
            now.getFullYear() - 20,
            now.getMonth(),
            now.getDate()
          );

          expect(metadata.publishedDate.getTime()).toBeLessThanOrEqual(
            now.getTime()
          );
          expect(metadata.publishedDate.getTime()).toBeGreaterThanOrEqual(
            twentyYearsAgo.getTime()
          );

          console.log(
            "Parsed publication date:",
            metadata.publishedDate.toISOString()
          );
        }
      }
    }, 15000);
  });

  describe("image extraction", () => {
    it("should extract thumbnail images when available", async () => {
      // Skip if no API key is provided
      if (testApiKey === "test-api-key") {
        console.log(
          "Skipping test - no IFRAMELY_API_KEY environment variable set"
        );
        return;
      }

      // Arrange - YouTube videos typically have thumbnails
      const videoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      const urlResult = URL.create(videoUrl);
      expect(urlResult.isOk()).toBe(true);
      const url = urlResult.unwrap();

      // Act
      const result = await service.fetchMetadata(url);

      // Assert
      if (result.isOk()) {
        const metadata = result.unwrap();

        if (metadata.imageUrl) {
          expect(metadata.imageUrl).toMatch(/^https?:\/\//);
          expect(metadata.imageUrl).toMatch(/\.(jpg|jpeg|png|webp)/i);

          console.log("Extracted image URL:", metadata.imageUrl);
        }
      }
    }, 15000);
  });
});
