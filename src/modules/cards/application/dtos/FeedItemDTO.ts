import { UserProfileDTO } from './UserProfileDTO';
import { UrlCardDTO } from './UrlCardDTO';
import { CollectionDTO } from './CollectionDTO';

// Unified FeedItem DTO - matches ApiClient FeedItem interface
// Note: createdAt is Date to match ApiClient, though this is inconsistent with other DTOs
export interface FeedItemDTO {
  id: string;
  user: UserProfileDTO;
  card: UrlCardDTO;
  createdAt: Date;
  collections: CollectionDTO[];
}
