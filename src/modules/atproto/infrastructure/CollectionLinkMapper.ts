import { CollectionLink } from "src/modules/cards/domain/CollectionLink";
import { Record } from "./lexicon/types/app/cards/collectionLink";
import { StrongRef } from "../domain";

type CollectionLinkRecordDTO = Record;

export class CollectionLinkMapper {
  static toCreateRecordDTO(
    collectionLink: CollectionLink,
    collectionPublishedRecordId: { uri: string; cid: string },
    cardPublishedRecordId: { uri: string; cid: string }
  ): CollectionLinkRecordDTO {
    return {
      $type: "app.cards.collectionLink",
      collection: {
        uri: collectionPublishedRecordId.uri,
        cid: collectionPublishedRecordId.cid,
      },
      card: {
        uri: cardPublishedRecordId.uri,
        cid: cardPublishedRecordId.cid,
      },
      addedBy: collectionLink.addedBy.value,
      addedAt: collectionLink.addedAt.toISOString(),
      createdAt: collectionLink.createdAt.toISOString(),
    };
  }
}
