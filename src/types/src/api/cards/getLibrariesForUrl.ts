import { z } from 'zod';
import {
  PaginatedCardSortedParamsSchema,
  PaginationSchema,
  CardSortingSchema,
} from '../../entities/common';
import { UserSchema } from '../../entities/user';
import { UrlCardSchema } from '../../entities/card';

export const GetLibrariesForUrlParamsSchema =
  PaginatedCardSortedParamsSchema.extend({
    url: z.string(),
  });
export type GetLibrariesForUrlParams = z.infer<
  typeof GetLibrariesForUrlParamsSchema
>;

export const GetLibrariesForUrlResponseSchema = z.object({
  libraries: z.array(
    z.object({
      user: UserSchema,
      card: UrlCardSchema,
    }),
  ),
  pagination: PaginationSchema,
  sorting: CardSortingSchema,
  // Saves the caller may not see (other users' private libraries); the UI can
  // render these as anonymous "private library" entries.
  privateLibraryCount: z.number().optional(),
});
export type GetLibrariesForUrlResponse = z.infer<
  typeof GetLibrariesForUrlResponseSchema
>;
