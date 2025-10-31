export const sembleKeys = {
  all: () => ['semble'] as const,
  byUrl: (url: string) => [...sembleKeys.all(), url] as const,
  notes: (url: string) => [...sembleKeys.byUrl(url), 'notes'] as const,
  notesInfinite: (url: string) =>
    [...sembleKeys.notes(url), 'infinite'] as const,
  similarCards: (url: string) =>
    [...sembleKeys.byUrl(url), 'similar cards'] as const,
  similarCardsInfinite: (url: string) =>
    [...sembleKeys.similarCards(url), 'infinite'] as const,
  libraries: (url: string) => [...sembleKeys.byUrl(url), 'libraries'] as const,
  librariesInfinite: (url: string) =>
    [...sembleKeys.libraries(url), 'infinite'] as const,
};
