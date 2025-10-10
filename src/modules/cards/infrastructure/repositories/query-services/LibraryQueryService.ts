import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { libraryMemberships } from '../schema/libraryMembership.sql';

export class LibraryQueryService {
  constructor(private db: PostgresJsDatabase) {}

  async getLibrariesForCard(cardId: string): Promise<string[]> {
    try {
      // Get all users who have this card in their library
      const libraryQuery = this.db
        .select({
          userId: libraryMemberships.userId,
        })
        .from(libraryMemberships)
        .where(eq(libraryMemberships.cardId, cardId));

      const libraryResult = await libraryQuery;

      return libraryResult.map((lib) => lib.userId);
    } catch (error) {
      console.error('Error in getLibrariesForCard:', error);
      throw error;
    }
  }
}
