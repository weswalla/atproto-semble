import { $Typed } from "@atproto/api";
import { Card } from "src/modules/cards/domain/Card";
import { CardTypeEnum } from "src/modules/cards/domain/value-objects/CardType";
import {
  Record,
  UrlContent,
  NoteContent,
  HighlightContent,
  UrlMetadata,
  HighlightSelector,
  TextQuoteSelector,
  TextPositionSelector,
  RangeSelector,
} from "./lexicon/types/app/cards/card";
import { StrongRef } from "../domain";

type CardRecordDTO = Record;

export class CardMapper {
  static toCreateRecordDTO(card: Card): CardRecordDTO {
    const record: CardRecordDTO = {
      $type: "app.cards.card",
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

    return record;
  }

  private static mapCardContent(
    card: Card
  ): $Typed<UrlContent | NoteContent | HighlightContent> {
    switch (card.type.value) {
      case CardTypeEnum.URL:
        const urlContent = card.content.urlContent!;
        const urlContentDTO: $Typed<UrlContent> = {
          $type: "app.cards.card#urlContent",
          url: urlContent.url.value,
        };

        if (urlContent.metadata) {
          urlContentDTO.metadata = this.mapUrlMetadata(urlContent.metadata);
        }

        return urlContentDTO;

      case CardTypeEnum.NOTE:
        const noteContent = card.content.noteContent!;
        const noteContentDTO: $Typed<NoteContent> = {
          $type: "app.cards.card#noteContent",
          text: noteContent.text,
        };

        if (noteContent.title) {
          noteContentDTO.title = noteContent.title;
        }

        return noteContentDTO;

      case CardTypeEnum.HIGHLIGHT:
        const highlightContent = card.content.highlightContent!;
        return {
          $type: "app.cards.card#highlightContent",
          text: highlightContent.text,
          selectors: highlightContent.selectors.map((selector) =>
            this.mapHighlightSelector(selector)
          ),
          context: highlightContent.context,
          documentUrl: highlightContent.documentUrl,
          documentTitle: highlightContent.documentTitle,
        };

      default:
        throw new Error(`Unsupported card type: ${card.type.value}`);
    }
  }

  private static mapUrlMetadata(
    metadata: any
  ): $Typed<UrlMetadata> {
    return {
      $type: "app.cards.card#urlMetadata",
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

  private static mapHighlightSelector(
    selector: any
  ): $Typed<HighlightSelector> {
    switch (selector.type) {
      case "TextQuoteSelector":
        return {
          $type: "app.cards.card#textQuoteSelector",
          type: "TextQuoteSelector",
          exact: selector.exact,
          prefix: selector.prefix,
          suffix: selector.suffix,
        };

      case "TextPositionSelector":
        return {
          $type: "app.cards.card#textPositionSelector",
          type: "TextPositionSelector",
          start: selector.start,
          end: selector.end,
        };

      case "RangeSelector":
        return {
          $type: "app.cards.card#rangeSelector",
          type: "RangeSelector",
          startSelector: this.mapHighlightSelector(selector.startSelector),
          endSelector: this.mapHighlightSelector(selector.endSelector),
        };

      default:
        throw new Error(`Unsupported highlight selector type: ${selector.type}`);
    }
  }
}
