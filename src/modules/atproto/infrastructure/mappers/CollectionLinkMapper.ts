import { CardLink } from 'src/modules/cards/domain/Collection';
import { Record } from '../lexicon/types/network/cosmik/collectionLink';
import { PublishedRecordIdProps } from 'src/modules/cards/domain/value-objects/PublishedRecordId';

type CollectionLinkRecordDTO = Record;

export class CollectionLinkMapper {
  static toCreateRecordDTO(
    link: CardLink,
    collectionRecord: PublishedRecordIdProps,
    cardRecord: PublishedRecordIdProps,
    originalCardRecord: PublishedRecordIdProps,
  ): CollectionLinkRecordDTO {
    return {
      $type: 'network.cosmik.collectionLink',
      collection: {
        uri: collectionRecord.uri,
        cid: collectionRecord.cid,
      },
      card: {
        uri: cardRecord.uri,
        cid: cardRecord.cid,
      },
      originalCard: {
        uri: originalCardRecord.uri,
        cid: originalCardRecord.cid,
      },
      addedBy: link.addedBy.value,
      addedAt: link.addedAt.toISOString(),
      createdAt: new Date().toISOString(),
    };
  }
}
