import { UserProfileDTO } from './UserProfileDTO';

// Unified NoteCard DTO - matches ApiClient GetNoteCardsForUrlResponse.notes items
export interface NoteCardDTO {
  id: string;
  note: string;
  author: UserProfileDTO;
  createdAt: string;
  updatedAt: string;
}
