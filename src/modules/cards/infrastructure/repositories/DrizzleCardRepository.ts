import { eq, and } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ICardRepository } from "../../domain/ICardRepository";
import { Card } from "../../domain/Card";
import { CardId } from "../../domain/value-objects/CardId";
import { CuratorId } from "../../../annotations/domain/value-objects/CuratorId";
import { URL } from "../../domain/value-objects/URL";
import { cards } from "./schema/card.sql";
import { publishedRecords } from "../../../annotations/infrastructure/repositories/schema/publishedRecord.sql";
import { CardDTO, CardMapper } from "./mappers/CardMapper";
import { Result, ok, err } from "../../../../shared/core/Result";

export class DrizzleCardRepository implements ICardRepository {
  constructor(private db: PostgresJsDatabase) {}

  async findById(id: CardId): Promise<Result<Card | null>> {
    try {
      const cardId = id.getStringValue();

      const cardResult = await this.db
        .select({
          card: cards,
          publishedRecord: publishedRecords,
        })
        .from(cards)
        .leftJoin(
          publishedRecords,
          eq(cards.publishedRecordId, publishedRecords.id)
        )
        .where(eq(cards.id, cardId))
        .limit(1);

      if (cardResult.length === 0) {
        return ok(null);
      }

      const result = cardResult[0];
      if (!result || !result.card) {
        return ok(null);
      }

      const cardDTO: CardDTO = {
        id: result.card.id,
        curatorId: result.card.curatorId,
        type: result.card.type,
        contentData: result.card.contentData,
        parentCardId: result.card.parentCardId || undefined,
        createdAt: result.card.createdAt,
        updatedAt: result.card.updatedAt,
        publishedRecordId: result.publishedRecord?.id || null,
        publishedRecord: result.publishedRecord || undefined,
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

  async findByParentCardId(parentCardId: CardId): Promise<Result<Card[]>> {
    try {
      const parentId = parentCardId.getStringValue();

      const cardResults = await this.db
        .select({
          card: cards,
          publishedRecord: publishedRecords,
        })
        .from(cards)
        .leftJoin(
          publishedRecords,
          eq(cards.publishedRecordId, publishedRecords.id)
        )
        .where(eq(cards.parentCardId, parentId));

      const domainCards: Card[] = [];
      for (const result of cardResults) {
        if (!result.card) {
          console.error("Card data is null, skipping");
          continue;
        }

        const cardDTO: CardDTO = {
          id: result.card.id,
          curatorId: result.card.curatorId,
          type: result.card.type,
          contentData: result.card.contentData,
          parentCardId: result.card.parentCardId || undefined,
          createdAt: result.card.createdAt,
          updatedAt: result.card.updatedAt,
          publishedRecordId: result.publishedRecord?.id || null,
          publishedRecord: result.publishedRecord || undefined,
        };

        const domainResult = CardMapper.toDomain(cardDTO);
        if (domainResult.isErr()) {
          console.error("Error mapping card to domain:", domainResult.error);
          continue;
        }
        domainCards.push(domainResult.value);
      }

      return ok(domainCards);
    } catch (error) {
      return err(error as Error);
    }
  }

  async findByCuratorId(curatorId: CuratorId): Promise<Result<Card[]>> {
    try {
      const curatorIdString = curatorId.value;

      const cardResults = await this.db
        .select({
          card: cards,
          publishedRecord: publishedRecords,
        })
        .from(cards)
        .leftJoin(
          publishedRecords,
          eq(cards.publishedRecordId, publishedRecords.id)
        )
        .where(eq(cards.curatorId, curatorIdString));

      const domainCards: Card[] = [];
      for (const result of cardResults) {
        if (!result.card) {
          console.error("Card data is null, skipping");
          continue;
        }

        const cardDTO: CardDTO = {
          id: result.card.id,
          curatorId: result.card.curatorId,
          type: result.card.type,
          contentData: result.card.contentData,
          parentCardId: result.card.parentCardId || undefined,
          createdAt: result.card.createdAt,
          updatedAt: result.card.updatedAt,
          publishedRecordId: result.publishedRecord?.id || null,
          publishedRecord: result.publishedRecord || undefined,
        };

        const domainResult = CardMapper.toDomain(cardDTO);
        if (domainResult.isErr()) {
          console.error("Error mapping card to domain:", domainResult.error);
          continue;
        }
        domainCards.push(domainResult.value);
      }

      return ok(domainCards);
    } catch (error) {
      return err(error as Error);
    }
  }

  async findByUrl(url: URL): Promise<Result<Card | null>> {
    try {
      const urlString = url.value;

      const cardResults = await this.db
        .select({
          card: cards,
          publishedRecord: publishedRecords,
        })
        .from(cards)
        .leftJoin(
          publishedRecords,
          eq(cards.publishedRecordId, publishedRecords.id)
        )
        .where(eq(cards.type, "URL"));

      // Filter by URL in content data (since URL is stored in JSON)
      for (const result of cardResults) {
        if (!result.card) {
          continue;
        }

        const contentData = result.card.contentData as any;
        if (contentData && contentData.url === urlString) {
          const cardDTO: CardDTO = {
            id: result.card.id,
            curatorId: result.card.curatorId,
            type: result.card.type,
            contentData: result.card.contentData,
            parentCardId: result.card.parentCardId || undefined,
            createdAt: result.card.createdAt,
            updatedAt: result.card.updatedAt,
            publishedRecordId: result.publishedRecord?.id || null,
            publishedRecord: result.publishedRecord || undefined,
          };

          const domainResult = CardMapper.toDomain(cardDTO);
          if (domainResult.isErr()) {
            return err(domainResult.error);
          }

          return ok(domainResult.value);
        }
      }

      return ok(null);
    } catch (error) {
      return err(error as Error);
    }
  }

  async save(card: Card): Promise<Result<void>> {
    try {
      const { card: cardData, publishedRecord } = CardMapper.toPersistence(card);

      await this.db.transaction(async (tx) => {
        // Handle published record if it exists
        let publishedRecordId: string | undefined = undefined;

        if (publishedRecord) {
          const publishedRecordResult = await tx
            .insert(publishedRecords)
            .values({
              id: publishedRecord.id,
              uri: publishedRecord.uri,
              cid: publishedRecord.cid,
              recordedAt: publishedRecord.recordedAt || new Date(),
            })
            .onConflictDoNothing({
              target: [publishedRecords.uri, publishedRecords.cid],
            })
            .returning({ id: publishedRecords.id });

          if (publishedRecordResult.length === 0) {
            const existingRecord = await tx
              .select()
              .from(publishedRecords)
              .where(
                and(
                  eq(publishedRecords.uri, publishedRecord.uri),
                  eq(publishedRecords.cid, publishedRecord.cid)
                )
              )
              .limit(1);

            if (existingRecord.length > 0) {
              publishedRecordId = existingRecord[0]!.id;
            }
          } else {
            publishedRecordId = publishedRecordResult[0]!.id;
          }
        }

        // Upsert the card
        await tx
          .insert(cards)
          .values({
            ...cardData,
            publishedRecordId: publishedRecordId,
          })
          .onConflictDoUpdate({
            target: cards.id,
            set: {
              curatorId: cardData.curatorId,
              type: cardData.type,
              contentData: cardData.contentData,
              parentCardId: cardData.parentCardId,
              updatedAt: cardData.updatedAt,
              publishedRecordId: publishedRecordId,
            },
          });
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
