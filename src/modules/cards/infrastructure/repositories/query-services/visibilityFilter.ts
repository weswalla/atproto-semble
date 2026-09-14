import { SQL, sql, eq, or, and, ne } from 'drizzle-orm';
import { AnyPgColumn } from 'drizzle-orm/pg-core';
import { cards } from '../schema/card.sql';
import { collections } from '../schema/collection.sql';
import { connections } from '../schema/connection.sql';

const PUBLIC = 'PUBLIC';
const PRIVATE = 'PRIVATE';

/**
 * Rows visible to the caller: PUBLIC rows, plus the caller's own rows.
 * Anonymous callers (no callingUserId) see PUBLIC only.
 */
export function visibleTo(
  visibilityColumn: AnyPgColumn,
  ownerColumn: AnyPgColumn,
  callingUserId?: string,
): SQL {
  return callingUserId
    ? or(eq(visibilityColumn, PUBLIC), eq(ownerColumn, callingUserId))!
    : eq(visibilityColumn, PUBLIC);
}

/** Inverse of visibleTo: rows hidden from the caller (private, not theirs). */
export function hiddenFrom(
  visibilityColumn: AnyPgColumn,
  ownerColumn: AnyPgColumn,
  callingUserId?: string,
): SQL {
  return callingUserId
    ? and(eq(visibilityColumn, PRIVATE), ne(ownerColumn, callingUserId))!
    : eq(visibilityColumn, PRIVATE);
}

export const cardVisibleTo = (callingUserId?: string): SQL =>
  visibleTo(cards.visibility, cards.authorId, callingUserId);

export const cardHiddenFrom = (callingUserId?: string): SQL =>
  hiddenFrom(cards.visibility, cards.authorId, callingUserId);

export const collectionVisibleTo = (callingUserId?: string): SQL =>
  visibleTo(collections.visibility, collections.authorId, callingUserId);

export const connectionVisibleTo = (callingUserId?: string): SQL =>
  visibleTo(connections.visibility, connections.curatorId, callingUserId);

/**
 * Raw-SQL variant for db.execute(sql`...`) call sites that reference tables
 * through aliases (graph services). ownerColumn is the alias-local column name
 * (author_id / curator_id).
 */
export function visibleToRaw(
  tableAlias: string,
  ownerColumn: string,
  callingUserId?: string,
): SQL {
  const vis = sql.raw(`${tableAlias}.visibility`);
  return callingUserId
    ? sql`(${vis} = ${PUBLIC} OR ${sql.raw(`${tableAlias}.${ownerColumn}`)} = ${callingUserId})`
    : sql`${vis} = ${PUBLIC}`;
}
