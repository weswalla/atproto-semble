/**
 * Output DTO representing a User for external callers.
 */
export interface UserOutputDTO {
  id: string; // DID as string
  handle: string; // Handle as string
  linkedAt: string; // ISO Date string
  lastLoginAt: string; // ISO Date string
  // Add other relevant fields for API responses
}
