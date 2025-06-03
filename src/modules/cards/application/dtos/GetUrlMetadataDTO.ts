export interface GetUrlMetadataDTO {
  url: string;
  title?: string;
  description?: string;
  author?: string;
  publishedDate?: string; // ISO string
  siteName?: string;
  imageUrl?: string;
  type?: string;
  retrievedAt: string; // ISO string
}
