import { Collection } from "src/modules/cards/domain/Collection";
import { Record } from "../lexicon/types/network/cosmik/collection";

type CollectionRecordDTO = Record;

export class CollectionMapper {
  static toCreateRecordDTO(collection: Collection): CollectionRecordDTO {
    return {
      $type: "network.cosmik.collection",
      name: collection.name.value,
      description: collection.description?.value,
      accessType: collection.accessType,
      collaborators: collection.collaboratorIds.map(
        (collaborator) => collaborator.value
      ),
      createdAt: collection.createdAt.toISOString(),
      updatedAt: collection.updatedAt.toISOString(),
    };
  }
}
