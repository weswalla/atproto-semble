import { sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { publishedRecords } from '../../infrastructure/repositories/schema/publishedRecord.sql';
import { cards } from '../../infrastructure/repositories/schema/card.sql';
import { libraryMemberships } from '../../infrastructure/repositories/schema/libraryMembership.sql';
import {
  collections,
  collectionCollaborators,
  collectionCards,
} from '../../infrastructure/repositories/schema/collection.sql';

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
    sql`CREATE INDEX IF NOT EXISTS idx_user_cards ON library_memberships(user_id)`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_card_users ON library_memberships(card_id)`,
  );
}
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';

export async function createTestSchema(db: PostgresJsDatabase) {
  // Create the cards table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS cards (
      id UUID PRIMARY KEY,
      type TEXT NOT NULL,
      content_data JSONB NOT NULL,
      url TEXT,
      parent_card_id UUID REFERENCES cards(id),
      original_published_record_id UUID,
      library_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create the published_records table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS published_records (
      id UUID PRIMARY KEY,
      uri TEXT NOT NULL,
      cid TEXT NOT NULL,
      recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(uri, cid)
    );
  `);

  // Create the library_memberships table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS library_memberships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      added_at TIMESTAMP NOT NULL DEFAULT NOW(),
      published_record_id UUID REFERENCES published_records(id),
      UNIQUE(card_id, user_id)
    );
  `);

  // Create the collections table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS collections (
      id UUID PRIMARY KEY,
      author_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      access_type TEXT NOT NULL,
      card_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      published_record_id UUID REFERENCES published_records(id)
    );
  `);

  // Create the collection_collaborators table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS collection_collaborators (
      id UUID PRIMARY KEY,
      collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      collaborator_id TEXT NOT NULL
    );
  `);

  // Create the collection_cards table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS collection_cards (
      id UUID PRIMARY KEY,
      collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      added_by TEXT NOT NULL,
      added_at TIMESTAMP NOT NULL DEFAULT NOW(),
      published_record_id UUID REFERENCES published_records(id)
    );
  `);

  // Create the feed_activities table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS feed_activities (
      id UUID PRIMARY KEY,
      actor_id TEXT NOT NULL,
      type TEXT NOT NULL,
      metadata JSONB NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Add foreign key constraint for cards.original_published_record_id
  await db.execute(sql`
    ALTER TABLE cards 
    ADD CONSTRAINT IF NOT EXISTS fk_cards_original_published_record 
    FOREIGN KEY (original_published_record_id) REFERENCES published_records(id);
  `);

  // Create indexes for better performance
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_cards_type ON cards(type);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_cards_url ON cards(url);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_library_memberships_user_id ON library_memberships(user_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_library_memberships_card_id ON library_memberships(card_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_collection_cards_collection_id ON collection_cards(collection_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_collection_cards_card_id ON collection_cards(card_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_feed_activities_created_at ON feed_activities(created_at DESC);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_feed_activities_actor_id ON feed_activities(actor_id);
  `);
}
