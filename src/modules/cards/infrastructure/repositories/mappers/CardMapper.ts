import { UniqueEntityID } from "../../../../../shared/domain/UniqueEntityID";
import { Card } from "../../../domain/Card";
import { CardId } from "../../../domain/value-objects/CardId";
import { CardType, CardTypeEnum } from "../../../domain/value-objects/CardType";
import { CardContent } from "../../../domain/value-objects/CardContent";
import { CuratorId } from "../../../domain/value-objects/CuratorId";
import { PublishedRecordId } from "../../../domain/value-objects/PublishedRecordId";
import { URL } from "../../../domain/value-objects/URL";
import { UrlMetadata } from "../../../domain/value-objects/UrlMetadata";
import { err, ok, Result } from "../../../../../shared/core/Result";
import { v4 as uuid } from "uuid";
import {
  UrlCardQueryResultDTO,
  CollectionCardQueryResultDTO,
  UrlCardViewDTO,
} from "../../../domain/ICardQueryRepository";

// Type-safe content data interfaces
interface UrlContentData {
  url: string;
  metadata?: {
    url: string;
    title?: string;
    description?: string;
    author?: string;
    publishedDate?: string;
    siteName?: string;
    imageUrl?: string;
    type?: string;
    retrievedAt: string;
  };
}

interface NoteContentData {
  text: string;
  authorId: string;
}

type CardContentData = UrlContentData | NoteContentData;

// Raw data for URL card queries
export interface RawUrlCardData {
  id: string;
  url: string;
  contentData: any;
  libraryCount: number;
  createdAt: Date;
  updatedAt: Date;
  collections: {
    id: string;
    name: string;
    authorId: string;
  }[];
  note?: {
    id: string;
    contentData: any;
  };
}

// Database representation of a card
export interface CardDTO {
  id: string;
  type: string;
  contentData: CardContentData; // Type-safe JSON data for the content
  url?: string;
  parentCardId?: string;
  originalPublishedRecordId?: {
    uri: string;
    cid: string;
  };
  libraryCount: number;
  libraryMemberships: Array<{
    userId: string;
    addedAt: Date;
    publishedRecordId?: {
      uri: string;
      cid: string;
    };
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export class CardMapper {
  public static toDomain(dto: CardDTO): Result<Card> {
    try {
      const cardTypeOrError = CardType.create(dto.type as CardTypeEnum);
      if (cardTypeOrError.isErr()) return err(cardTypeOrError.error);

      // Create content based on type
      const contentOrError = this.createCardContent(
        dto.type as CardTypeEnum,
        dto.contentData
      );
      if (contentOrError.isErr()) return err(contentOrError.error);

      // Create optional URL
      let url: URL | undefined;
      if (dto.url) {
        const urlOrError = URL.create(dto.url);
        if (urlOrError.isErr()) return err(urlOrError.error);
        url = urlOrError.value;
      }

      // Create optional parent card ID
      let parentCardId: CardId | undefined;
      if (dto.parentCardId) {
        const parentCardIdOrError = CardId.createFromString(dto.parentCardId);
        if (parentCardIdOrError.isErr()) return err(parentCardIdOrError.error);
        parentCardId = parentCardIdOrError.value;
      }

      // Create optional original published record ID
      let originalPublishedRecordId: PublishedRecordId | undefined;
      if (dto.originalPublishedRecordId) {
        originalPublishedRecordId = PublishedRecordId.create({
          uri: dto.originalPublishedRecordId.uri,
          cid: dto.originalPublishedRecordId.cid,
        });
      }
      const libraryMemberships = dto.libraryMemberships.map((membership) => {
        const curatorIdResult = CuratorId.create(membership.userId);
        if (curatorIdResult.isErr()) {
          throw new Error(
            `Invalid curator ID in library membership: ${membership.userId}`
          );
        }
        const curatorId = curatorIdResult.value;
        let publishedRecordId: PublishedRecordId | undefined;
        if (membership.publishedRecordId) {
          // We need to parse the AT URI to get the CID - this is a simplified approach
          // In practice, you might need a more robust URI parser
          publishedRecordId = PublishedRecordId.create({
            uri: membership.publishedRecordId.uri,
            cid: membership.publishedRecordId.cid,
          });
        }
        return {
          curatorId,
          addedAt: membership.addedAt,
          publishedRecordId: publishedRecordId,
        };
      });

      // Create the card
      const cardOrError = Card.create(
        {
          type: cardTypeOrError.value,
          content: contentOrError.value,
          url,
          parentCardId,
          originalPublishedRecordId,
          libraryMemberships,
          libraryCount: dto.libraryCount,
          createdAt: dto.createdAt,
          updatedAt: dto.updatedAt,
        },
        new UniqueEntityID(dto.id)
      );

      if (cardOrError.isErr()) return err(cardOrError.error);

      // Set timestamps manually since Card.create sets them to now
      const card = cardOrError.value;
      card.props.createdAt = dto.createdAt;
      card.props.updatedAt = dto.updatedAt;

      return ok(card);
    } catch (error) {
      return err(error as Error);
    }
  }

  private static createCardContent(
    type: CardTypeEnum,
    data: CardContentData
  ): Result<CardContent> {
    try {
      switch (type) {
        case CardTypeEnum.URL:
          const urlData = data as UrlContentData;
          const urlOrError = URL.create(urlData.url);
          if (urlOrError.isErr()) return err(urlOrError.error);

          let metadata: UrlMetadata | undefined;
          if (urlData.metadata) {
            const metadataResult = UrlMetadata.create({
              url: urlData.metadata.url,
              title: urlData.metadata.title,
              description: urlData.metadata.description,
              author: urlData.metadata.author,
              publishedDate: urlData.metadata.publishedDate
                ? new Date(urlData.metadata.publishedDate)
                : undefined,
              siteName: urlData.metadata.siteName,
              imageUrl: urlData.metadata.imageUrl,
              type: urlData.metadata.type,
              retrievedAt: new Date(urlData.metadata.retrievedAt),
            });
            if (metadataResult.isErr()) return err(metadataResult.error);
            metadata = metadataResult.value;
          }

          return CardContent.createUrlContent(urlOrError.value, metadata);

        case CardTypeEnum.NOTE:
          const noteData = data as NoteContentData;
          const authorIdResult = CuratorId.create(noteData.authorId);
          if (authorIdResult.isErr()) return err(authorIdResult.error);
          return CardContent.createNoteContent(noteData.text);

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
      type: string;
      contentData: CardContentData;
      url?: string;
      parentCardId?: string;
      libraryCount: number;
      createdAt: Date;
      updatedAt: Date;
    };
    libraryMemberships: Array<{
      cardId: string;
      userId: string;
      addedAt: Date;
      publishedRecordId?: string;
    }>;
    originalPublishedRecord?: {
      id: string;
      uri: string;
      cid: string;
      recordedAt?: Date;
    };
    membershipPublishedRecords?: Array<{
      id: string;
      uri: string;
      cid: string;
      recordedAt?: Date;
    }>;
  } {
    const content = card.content;
    let contentData: CardContentData;

    // Extract content data based on type
    if (content.type === CardTypeEnum.URL) {
      const urlContent = content.urlContent!;
      contentData = {
        url: urlContent.url.value,
        metadata: urlContent.metadata
          ? {
              url: urlContent.metadata.url,
              title: urlContent.metadata.title,
              description: urlContent.metadata.description,
              author: urlContent.metadata.author,
              publishedDate: urlContent.metadata.publishedDate?.toISOString(),
              siteName: urlContent.metadata.siteName,
              imageUrl: urlContent.metadata.imageUrl,
              type: urlContent.metadata.type,
              retrievedAt: urlContent.metadata.retrievedAt?.toISOString(),
            }
          : undefined,
      } as UrlContentData;
    } else if (content.type === CardTypeEnum.NOTE) {
      const noteContent = content.noteContent!;
      // For note content, we need to get the author ID from the content
      // Since NoteCardContent now has authorId, we need to access it
      contentData = {
        text: noteContent.text,
        authorId: (noteContent as any).props.authorId.value, // Access the authorId from props
      } as NoteContentData;
    } else {
      throw new Error(`Unknown card type: ${content.type}`);
    }

    // Collect all published records that need to be created
    const originalPublishedRecord = card.originalPublishedRecordId
      ? {
          id: uuid(),
          uri: card.originalPublishedRecordId.uri,
          cid: card.originalPublishedRecordId.cid,
        }
      : undefined;

    const membershipPublishedRecords: Array<{
      id: string;
      uri: string;
      cid: string;
    }> = [];

    // Map library memberships and collect their published records
    const libraryMemberships = card.libraryMemberships.map((membership) => {
      let publishedRecordId: string | undefined;

      if (membership.publishedRecordId) {
        publishedRecordId = uuid();
        membershipPublishedRecords.push({
          id: publishedRecordId,
          uri: membership.publishedRecordId.uri,
          cid: membership.publishedRecordId.cid,
        });
      }

      return {
        cardId: card.cardId.getStringValue(),
        userId: membership.curatorId.value,
        addedAt: membership.addedAt,
        publishedRecordId,
      };
    });

    return {
      card: {
        id: card.cardId.getStringValue(),
        type: card.type.value,
        contentData,
        url: card.url?.value,
        parentCardId: card.parentCardId?.getStringValue(),
        libraryCount: card.libraryCount,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
      },
      libraryMemberships,
      originalPublishedRecord,
      membershipPublishedRecords:
        membershipPublishedRecords.length > 0
          ? membershipPublishedRecords
          : undefined,
    };
  }

  public static toUrlCardQueryResult(
    raw: RawUrlCardData
  ): UrlCardQueryResultDTO {
    // Extract URL metadata from contentData
    const cardContent = {
      url: raw.contentData?.url,
      title: raw.contentData?.metadata?.title,
      description: raw.contentData?.metadata?.description,
      author: raw.contentData?.metadata?.author,
      thumbnailUrl: raw.contentData?.metadata?.imageUrl,
    };

    // Extract note text from note's contentData
    const note = raw.note
      ? {
          id: raw.note.id,
          text: raw.note.contentData?.text || "",
        }
      : undefined;

    return {
      id: raw.id,
      type: CardTypeEnum.URL,
      url: raw.url,
      cardContent,
      libraryCount: raw.libraryCount,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      collections: raw.collections,
      note,
    };
  }

  public static toCollectionCardQueryResult(raw: {
    id: string;
    url: string;
    contentData: any;
    libraryCount: number;
    createdAt: Date;
    updatedAt: Date;
    note?: {
      id: string;
      contentData: any;
    };
  }): CollectionCardQueryResultDTO {
    // Extract URL metadata from contentData
    const cardContent = {
      url: raw.contentData.url,
      title: raw.contentData?.metadata?.title,
      description: raw.contentData?.metadata?.description,
      author: raw.contentData?.metadata?.author,
      thumbnailUrl: raw.contentData?.metadata?.imageUrl,
    };

    // Extract note text from note's contentData
    const note = raw.note
      ? {
          id: raw.note.id,
          text: raw.note.contentData?.text || "",
        }
      : undefined;

    return {
      id: raw.id,
      type: CardTypeEnum.URL,
      url: raw.url,
      cardContent,
      libraryCount: raw.libraryCount,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      note,
    };
  }

  public static toUrlCardViewDTO(raw: {
    id: string;
    type: string;
    url: string;
    contentData: UrlContentData;
    libraryCount: number;
    createdAt: Date;
    updatedAt: Date;
    inLibraries: {
      userId: string;
    }[];
    inCollections: {
      id: string;
      name: string;
      authorId: string;
    }[];
    note?: {
      id: string;
      contentData: any;
    };
  }): UrlCardViewDTO {
    // Extract URL metadata from contentData
    const cardContent = {
      url: raw.contentData.url,
      title: raw.contentData?.metadata?.title,
      description: raw.contentData?.metadata?.description,
      author: raw.contentData?.metadata?.author,
      thumbnailUrl: raw.contentData?.metadata?.imageUrl,
    };

    // Extract note text from note's contentData
    const note = raw.note
      ? {
          id: raw.note.id,
          text: raw.note.contentData?.text || "",
        }
      : undefined;

    return {
      id: raw.id,
      type: CardTypeEnum.URL,
      url: raw.url,
      cardContent,
      libraryCount: raw.libraryCount,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      collections: raw.inCollections,
      libraries: raw.inLibraries,
      note,
    };
  }
}
