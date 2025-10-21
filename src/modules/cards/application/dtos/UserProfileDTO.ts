// Unified User/Profile DTO - matches ApiClient User interface
export interface UserProfileDTO {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  description?: string;
}
