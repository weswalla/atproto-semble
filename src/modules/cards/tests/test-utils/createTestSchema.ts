import { sql } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { publishedRecords } from "../../../annotations/infrastructure/repositories/schema/publishedRecord.sql";
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
  
  // Create tables in dependency order using Drizzle schema definitions
  const tableCreationQueries = [
    // Published records table (no dependencies)
    sql`CREATE TABLE IF NOT EXISTS ${publishedRecords} (
      ${publishedRecords.id} UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      ${publishedRecords.uri} TEXT NOT NULL,
      ${publishedRecords.cid} TEXT NOT NULL,
      ${publishedRecords.recordedAt} TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      UNIQUE(${publishedRecords.uri}, ${publishedRecords.cid})
    )`,
    
    // Cards table (references published_records and self-references)
    sql`CREATE TABLE IF NOT EXISTS ${cards} (
      ${cards.id} UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      ${cards.type} TEXT NOT NULL,
      ${cards.contentData} JSONB NOT NULL,
      ${cards.url} TEXT,
      ${cards.parentCardId} UUID REFERENCES ${cards}(${cards.id}),
      ${cards.originalPublishedRecordId} UUID REFERENCES ${publishedRecords}(${publishedRecords.id}),
      ${cards.createdAt} TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      ${cards.updatedAt} TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )`,
    
    // Library memberships table (references cards and published_records)
    sql`CREATE TABLE IF NOT EXISTS ${libraryMemberships} (
      ${libraryMemberships.cardId} UUID NOT NULL REFERENCES ${cards}(${cards.id}) ON DELETE CASCADE,
      ${libraryMemberships.userId} TEXT NOT NULL,
      ${libraryMemberships.addedAt} TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      ${libraryMemberships.publishedRecordId} UUID REFERENCES ${publishedRecords}(${publishedRecords.id}),
      PRIMARY KEY (${libraryMemberships.cardId}, ${libraryMemberships.userId})
    )`,
    
    // Collections table (references published_records)
    sql`CREATE TABLE IF NOT EXISTS ${collections} (
      ${collections.id} UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      ${collections.authorId} TEXT NOT NULL,
      ${collections.name} TEXT NOT NULL,
      ${collections.description} TEXT,
      ${collections.accessType} TEXT NOT NULL,
      ${collections.cardCount} INTEGER NOT NULL DEFAULT 0,
      ${collections.createdAt} TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      ${collections.updatedAt} TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      ${collections.publishedRecordId} UUID REFERENCES ${publishedRecords}(${publishedRecords.id})
    )`,
    
    // Collection collaborators table (references collections)
    sql`CREATE TABLE IF NOT EXISTS ${collectionCollaborators} (
      ${collectionCollaborators.id} UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      ${collectionCollaborators.collectionId} UUID NOT NULL REFERENCES ${collections}(${collections.id}) ON DELETE CASCADE,
      ${collectionCollaborators.collaboratorId} TEXT NOT NULL,
      UNIQUE(${collectionCollaborators.collectionId}, ${collectionCollaborators.collaboratorId})
    )`,
    
    // Collection cards table (references collections, cards, and published_records)
    sql`CREATE TABLE IF NOT EXISTS ${collectionCards} (
      ${collectionCards.id} UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      ${collectionCards.collectionId} UUID NOT NULL REFERENCES ${collections}(${collections.id}) ON DELETE CASCADE,
      ${collectionCards.cardId} UUID NOT NULL REFERENCES ${cards}(${cards.id}) ON DELETE CASCADE,
      ${collectionCards.addedBy} TEXT NOT NULL,
      ${collectionCards.addedAt} TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      ${collectionCards.publishedRecordId} UUID REFERENCES ${publishedRecords}(${publishedRecords.id}),
      UNIQUE(${collectionCards.collectionId}, ${collectionCards.cardId})
    )`,
  ];
  
  // Execute table creation queries in order
  for (const query of tableCreationQueries) {
    await db.execute(query);
  }
  
  // Create indexes
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_cards ON ${libraryMemberships}(${libraryMemberships.userId})`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_card_users ON ${libraryMemberships}(${libraryMemberships.cardId})`);
}
