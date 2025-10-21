import { UserProfileDTO } from './UserProfileDTO';

// Unified UrlCard DTO - matches ApiClient UrlCard interface
export interface UrlCardDTO {
  id: string;
  type: 'URL';
  url: string;
  cardContent: {
    url: string;
    title?: string;
    description?: string;
    author?: string;
    thumbnailUrl?: string;
  };
  libraryCount: number;
  urlLibraryCount: number;
  urlInLibrary?: boolean;
  createdAt: string;
  updatedAt: string;
  author: UserProfileDTO;
  note?: {
    id: string;
    text: string;
  };
}
