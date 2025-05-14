// Keeping it temporarily for backward compatibility
// TODO: Remove this file once all imports are updated

export const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
};
