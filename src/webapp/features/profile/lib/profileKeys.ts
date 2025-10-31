export const profileKeys = {
  all: () => ['profiles'] as const,
  profile: (didOrHandle: string) =>
    [...profileKeys.all(), didOrHandle] as const,
  mine: () => [...profileKeys.all(), 'mine'] as const,
};
