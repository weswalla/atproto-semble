import { CardLink } from "src/modules/cards/domain/Collection";
import { Record } from "../lexicon/types/network/cosmik/collectionLink";

type CollectionLinkRecordDTO = Record;

export class CollectionLinkMapper {
  static toCreateRecordDTO(
    collectionLink: CardLink,
    collectionPublishedRecordId: { uri: string; cid: string },
    cardPublishedRecordId: { uri: string; cid: string }
  ): CollectionLinkRecordDTO {
    return {
      $type: "network.cosmik.collectionLink",
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
      createdAt: collectionLink.addedAt.toISOString(),
    };
  }
}
