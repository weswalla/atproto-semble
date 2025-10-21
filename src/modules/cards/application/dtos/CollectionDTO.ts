import { UserProfileDTO } from './UserProfileDTO';

// Unified Collection DTO - matches ApiClient Collection interface
export interface CollectionDTO {
  id: string;
  uri?: string;
  name: string;
  author: UserProfileDTO;
  description?: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}
