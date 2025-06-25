import { $Typed } from "@atproto/api";
import { Card } from "src/modules/cards/domain/Card";
import { CardTypeEnum } from "src/modules/cards/domain/value-objects/CardType";
import {
  Record,
  UrlContent,
  NoteContent,
  UrlMetadata,
} from "../lexicon/types/network/cosmik/card";
import { StrongRef } from "../../domain";

type CardRecordDTO = Record;

export class CardMapper {
  static toCreateRecordDTO(card: Card): CardRecordDTO {
    const record: CardRecordDTO = {
      $type: "network.cosmik.card",
      type: card.type.value,
      content: this.mapCardContent(card),
      createdAt: card.createdAt.toISOString(),
    };

    // Add optional URL property
    if (card.url) {
      record.url = card.url.value;
    }

    // Add optional parent card reference
    if (card.parentCardId) {
      // Note: This assumes the parent card is already published
      // In practice, you'd need to look up the parent card's published record ID
      throw new Error("Parent card publishing not yet implemented");
    }

    // Add optional original card reference
    if (card.originalPublishedRecordId) {
      const strongRef = new StrongRef(
        card.originalPublishedRecordId.getValue()
      );
      record.originalCard = {
        uri: strongRef.getValue().uri,
        cid: strongRef.getValue().cid,
      };
    }

    return record;
  }

  private static mapCardContent(card: Card): $Typed<UrlContent | NoteContent> {
    switch (card.type.value) {
      case CardTypeEnum.URL:
        const urlContent = card.content.urlContent!;
        const urlContentDTO: $Typed<UrlContent> = {
          $type: "network.cosmik.card#urlContent",
          url: urlContent.url.value,
        };

        if (urlContent.metadata) {
          urlContentDTO.metadata = this.mapUrlMetadata(urlContent.metadata);
        }

        return urlContentDTO;

      case CardTypeEnum.NOTE:
        const noteContent = card.content.noteContent!;
        const noteContentDTO: $Typed<NoteContent> = {
          $type: "network.cosmik.card#noteContent",
          text: noteContent.text,
        };

        // Add originalCard reference if this note references another card
        if (card.parentCardId) {
          // Note: This assumes the parent card is already published
          // In practice, you'd need to look up the parent card's published record ID
          throw new Error("Parent card publishing not yet implemented");
        }

        return noteContentDTO;

      default:
        throw new Error(`Unsupported card type: ${card.type.value}`);
    }
  }

  private static mapUrlMetadata(metadata: any): $Typed<UrlMetadata> {
    return {
      $type: "network.cosmik.card#urlMetadata",
      url: metadata.url,
      title: metadata.title,
      description: metadata.description,
      author: metadata.author,
      publishedDate: metadata.publishedDate?.toISOString(),
      siteName: metadata.siteName,
      imageUrl: metadata.imageUrl,
      type: metadata.type,
      retrievedAt: metadata.retrievedAt?.toISOString(),
    };
  }
}
