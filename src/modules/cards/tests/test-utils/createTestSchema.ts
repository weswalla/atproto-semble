import { sql } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { publishedRecords } from "../../infrastructure/repositories/schema/publishedRecord.sql";
import { cards } from "../../infrastructure/repositories/schema/card.sql";
import { libraryMemberships } from "../../infrastructure/repositories/schema/libraryMembership.sql";
import {
  collections,
  collectionCollaborators,
  collectionCards,
} from "../../infrastructure/repositories/schema/collection.sql";

export async function createTestSchema(db: PostgresJsDatabase) {
  // Create extension
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  // Create tables in dependency order using raw SQL with proper column names
  const tableCreationQueries = [
    // Published records table (no dependencies)
    sql`CREATE TABLE IF NOT EXISTS published_records (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      uri TEXT NOT NULL,
      cid TEXT NOT NULL,
      recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      UNIQUE(uri, cid)
    )`,

    // Cards table (references published_records and self-references)
    sql`CREATE TABLE IF NOT EXISTS cards (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      type TEXT NOT NULL,
      content_data JSONB NOT NULL,
      url TEXT,
      parent_card_id UUID REFERENCES cards(id),
      original_published_record_id UUID REFERENCES published_records(id),
      library_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )`,

    // Library memberships table (references cards and published_records)
    sql`CREATE TABLE IF NOT EXISTS library_memberships (
      card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      published_record_id UUID REFERENCES published_records(id),
      PRIMARY KEY (card_id, user_id)
    )`,

    // Collections table (references published_records)
    sql`CREATE TABLE IF NOT EXISTS collections (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      author_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      access_type TEXT NOT NULL,
      card_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      published_record_id UUID REFERENCES published_records(id)
    )`,

    // Collection collaborators table (references collections)
    sql`CREATE TABLE IF NOT EXISTS collection_collaborators (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      collaborator_id TEXT NOT NULL,
      UNIQUE(collection_id, collaborator_id)
    )`,

    // Collection cards table (references collections, cards, and published_records)
    sql`CREATE TABLE IF NOT EXISTS collection_cards (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      added_by TEXT NOT NULL,
      added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      published_record_id UUID REFERENCES published_records(id),
      UNIQUE(collection_id, card_id)
    )`,
  ];

  // Execute table creation queries in order
  for (const query of tableCreationQueries) {
    await db.execute(query);
  }

  // Create indexes
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_user_cards ON library_memberships(user_id)`
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_card_users ON library_memberships(card_id)`
  );
}
