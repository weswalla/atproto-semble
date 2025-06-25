import { eq, leftJoin } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ICardRepository } from "../../domain/ICardRepository";
import { Card } from "../../domain/Card";
import { CardId } from "../../domain/value-objects/CardId";
import { cards } from "./schema/card.sql";
import { libraryMemberships } from "./schema/libraryMembership.sql";
import { publishedRecords } from "../../../annotations/infrastructure/repositories/schema/publishedRecord.sql";
import { CardDTO, CardMapper } from "./mappers/CardMapper";
import { Result, ok, err } from "../../../../shared/core/Result";

export class DrizzleCardRepository implements ICardRepository {
  constructor(private db: PostgresJsDatabase) {}

  async findById(id: CardId): Promise<Result<Card | null>> {
    try {
      const cardId = id.getStringValue();

      const cardResult = await this.db
        .select()
        .from(cards)
        .where(eq(cards.id, cardId))
        .limit(1);

      if (cardResult.length === 0) {
        return ok(null);
      }

      const result = cardResult[0];
      if (!result) {
        return ok(null);
      }

      // Get library memberships for this card with published record details
      const membershipResults = await this.db
        .select({
          userId: libraryMemberships.userId,
          addedAt: libraryMemberships.addedAt,
          publishedRecordUri: publishedRecords.uri,
          publishedRecordCid: publishedRecords.cid,
        })
        .from(libraryMemberships)
        .leftJoin(
          publishedRecords,
          eq(libraryMemberships.publishedRecordId, publishedRecords.id)
        )
        .where(eq(libraryMemberships.cardId, cardId));

      const cardDTO: CardDTO = {
        id: result.id,
        type: result.type,
        contentData: result.contentData,
        url: result.url || undefined,
        parentCardId: result.parentCardId || undefined,
        libraryMemberships: membershipResults.map(membership => ({
          userId: membership.userId,
          addedAt: membership.addedAt,
          publishedRecordId: membership.publishedRecordUri && membership.publishedRecordCid ? {
            uri: membership.publishedRecordUri,
            cid: membership.publishedRecordCid,
          } : undefined,
        })),
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };

      const domainResult = CardMapper.toDomain(cardDTO);
      if (domainResult.isErr()) {
        return err(domainResult.error);
      }

      return ok(domainResult.value);
    } catch (error) {
      return err(error as Error);
    }
  }

  async save(card: Card): Promise<Result<void>> {
    try {
      const {
        card: cardData,
        libraryMemberships: membershipData,
      } = CardMapper.toPersistence(card);

      await this.db.transaction(async (tx) => {
        // Upsert the card
        await tx
          .insert(cards)
          .values(cardData)
          .onConflictDoUpdate({
            target: cards.id,
            set: {
              type: cardData.type,
              contentData: cardData.contentData,
              url: cardData.url,
              parentCardId: cardData.parentCardId,
              updatedAt: cardData.updatedAt,
            },
          });

        // Handle library memberships - replace all memberships
        await tx
          .delete(libraryMemberships)
          .where(eq(libraryMemberships.cardId, cardData.id));

        if (membershipData.length > 0) {
          await tx.insert(libraryMemberships).values(membershipData.map(membership => ({
            cardId: membership.cardId,
            userId: membership.userId,
            addedAt: membership.addedAt,
            publishedRecordId: membership.publishedRecordId || null,
          })));
        }
      });

      return ok(undefined);
    } catch (error) {
      return err(error as Error);
    }
  }

  async delete(cardId: CardId): Promise<Result<void>> {
    try {
      const id = cardId.getStringValue();
      await this.db.delete(cards).where(eq(cards.id, id));
      return ok(undefined);
    } catch (error) {
      return err(error as Error);
    }
  }
}
