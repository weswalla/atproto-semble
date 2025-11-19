export const blueskyKeys = {
  all: () => ['bluesky'] as const,
  post: (uri: string) => [...blueskyKeys.all(), uri] as const,
};
