import { UniqueEntityID } from "../../../../../shared/domain/UniqueEntityID";
import { Card } from "../../../domain/Card";
import { CardId } from "../../../domain/value-objects/CardId";
import { CardType, CardTypeEnum } from "../../../domain/value-objects/CardType";
import { CardContent } from "../../../domain/value-objects/CardContent";
import { CuratorId } from "../../../../annotations/domain/value-objects/CuratorId";
import { PublishedRecordId } from "../../../domain/value-objects/PublishedRecordId";
import { URL } from "../../../domain/value-objects/URL";
import { UrlMetadata } from "../../../domain/value-objects/UrlMetadata";
import { PublishedRecordDTO, PublishedRecordRefDTO } from "./DTOTypes";
import { err, ok, Result } from "../../../../../shared/core/Result";

// Database representation of a card
export interface CardDTO extends PublishedRecordRefDTO {
  id: string;
  curatorId: string;
  type: string;
  contentData: any; // JSON data for the content
  parentCardId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CardMapper {
  public static toDomain(dto: CardDTO): Result<Card> {
    try {
      // Create value objects
      const curatorIdOrError = CuratorId.create(dto.curatorId);
      if (curatorIdOrError.isErr()) return err(curatorIdOrError.error);

      const cardTypeOrError = CardType.create(dto.type as CardTypeEnum);
      if (cardTypeOrError.isErr()) return err(cardTypeOrError.error);

      // Create content based on type
      const contentOrError = this.createCardContent(dto.type as CardTypeEnum, dto.contentData);
      if (contentOrError.isErr()) return err(contentOrError.error);

      // Create optional parent card ID
      let parentCardId: CardId | undefined;
      if (dto.parentCardId) {
        const parentCardIdOrError = CardId.createFromString(dto.parentCardId);
        if (parentCardIdOrError.isErr()) return err(parentCardIdOrError.error);
        parentCardId = parentCardIdOrError.value;
      }

      // Create optional published record ID
      let publishedRecordId: PublishedRecordId | undefined;
      if (dto.publishedRecord) {
        publishedRecordId = PublishedRecordId.create({
          uri: dto.publishedRecord.uri,
          cid: dto.publishedRecord.cid,
        });
      }

      // Create the card
      const cardOrError = Card.create(
        {
          curatorId: curatorIdOrError.value,
          type: cardTypeOrError.value,
          content: contentOrError.value,
          parentCardId,
          publishedRecordId,
        },
        new UniqueEntityID(dto.id)
      );

      if (cardOrError.isErr()) return err(cardOrError.error);

      // Set timestamps manually since Card.create sets them to now
      const card = cardOrError.value;
      (card as any).props.createdAt = dto.createdAt;
      (card as any).props.updatedAt = dto.updatedAt;

      return ok(card);
    } catch (error) {
      return err(error as Error);
    }
  }

  private static createCardContent(type: CardTypeEnum, data: any): Result<CardContent> {
    try {
      switch (type) {
        case CardTypeEnum.URL:
          const urlOrError = URL.create(data.url);
          if (urlOrError.isErr()) return err(urlOrError.error);
          
          let metadata: UrlMetadata | undefined;
          if (data.metadata) {
            metadata = UrlMetadata.create({
              url: data.metadata.url,
              title: data.metadata.title,
              description: data.metadata.description,
              author: data.metadata.author,
              publishedDate: data.metadata.publishedDate ? new Date(data.metadata.publishedDate) : undefined,
              siteName: data.metadata.siteName,
              imageUrl: data.metadata.imageUrl,
              type: data.metadata.type,
              retrievedAt: new Date(data.metadata.retrievedAt),
            });
          }

          return CardContent.createUrlContent(urlOrError.value, metadata);

        case CardTypeEnum.NOTE:
          return CardContent.createNoteContent(data.text, data.title);

        case CardTypeEnum.HIGHLIGHT:
          return CardContent.createHighlightContent(data.text, data.selectors, {
            context: data.context,
            documentUrl: data.documentUrl,
            documentTitle: data.documentTitle,
          });

        default:
          return err(new Error(`Unknown card type: ${type}`));
      }
    } catch (error) {
      return err(error as Error);
    }
  }

  public static toPersistence(card: Card): {
    card: {
      id: string;
      curatorId: string;
      type: string;
      contentData: any;
      parentCardId?: string;
      createdAt: Date;
      updatedAt: Date;
      publishedRecordId?: string;
    };
    publishedRecord?: PublishedRecordDTO;
  } {
    const content = card.content;
    let contentData: any;

    // Extract content data based on type
    if (content.type === CardTypeEnum.URL) {
      const urlContent = content.content as any;
      contentData = {
        url: urlContent.url.value,
        metadata: urlContent.metadata ? {
          url: urlContent.metadata.url,
          title: urlContent.metadata.title,
          description: urlContent.metadata.description,
          author: urlContent.metadata.author,
          publishedDate: urlContent.metadata.publishedDate?.toISOString(),
          siteName: urlContent.metadata.siteName,
          imageUrl: urlContent.metadata.imageUrl,
          type: urlContent.metadata.type,
          retrievedAt: urlContent.metadata.retrievedAt.toISOString(),
        } : undefined,
      };
    } else if (content.type === CardTypeEnum.NOTE) {
      const noteContent = content.content as any;
      contentData = {
        text: noteContent.text,
        title: noteContent.title,
      };
    } else if (content.type === CardTypeEnum.HIGHLIGHT) {
      const highlightContent = content.content as any;
      contentData = {
        text: highlightContent.text,
        selectors: highlightContent.selectors,
        context: highlightContent.context,
        documentUrl: highlightContent.documentUrl,
        documentTitle: highlightContent.documentTitle,
      };
    }

    // Create published record data if it exists
    let publishedRecord: PublishedRecordDTO | undefined;
    let publishedRecordId: string | undefined;

    if (card.publishedRecordId) {
      const recordId = new UniqueEntityID().toString();
      publishedRecord = {
        id: recordId,
        uri: card.publishedRecordId.uri,
        cid: card.publishedRecordId.cid,
        recordedAt: new Date(),
      };
      publishedRecordId = recordId;
    }

    return {
      card: {
        id: card.cardId.getStringValue(),
        curatorId: card.curatorId.value,
        type: card.type.value,
        contentData,
        parentCardId: card.parentCardId?.getStringValue(),
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
        publishedRecordId,
      },
      publishedRecord,
    };
  }
}
