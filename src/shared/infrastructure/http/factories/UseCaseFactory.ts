import { InitiateOAuthSignInUseCase } from "../../../../modules/user/application/use-cases/InitiateOAuthSignInUseCase";
import { CompleteOAuthSignInUseCase } from "../../../../modules/user/application/use-cases/CompleteOAuthSignInUseCase";
import { GetCurrentUserUseCase } from "../../../../modules/user/application/use-cases/GetCurrentUserUseCase";
import { RefreshAccessTokenUseCase } from "../../../../modules/user/application/use-cases/RefreshAccessTokenUseCase";
import { AddUrlToLibraryUseCase } from "../../../../modules/cards/application/useCases/commands/AddUrlToLibraryUseCase";
import { AddCardToLibraryUseCase } from "../../../../modules/cards/application/useCases/commands/AddCardToLibraryUseCase";
import { AddCardToCollectionUseCase } from "../../../../modules/cards/application/useCases/commands/AddCardToCollectionUseCase";
import { UpdateNoteCardUseCase } from "../../../../modules/cards/application/useCases/commands/UpdateNoteCardUseCase";
import { RemoveCardFromLibraryUseCase } from "../../../../modules/cards/application/useCases/commands/RemoveCardFromLibraryUseCase";
import { RemoveCardFromCollectionUseCase } from "../../../../modules/cards/application/useCases/commands/RemoveCardFromCollectionUseCase";
import { GetUrlMetadataUseCase } from "../../../../modules/cards/application/useCases/queries/GetUrlMetadataUseCase";
import { GetUrlCardViewUseCase } from "../../../../modules/cards/application/useCases/queries/GetUrlCardViewUseCase";
import { GetLibrariesForCardUseCase } from "../../../../modules/cards/application/useCases/queries/GetLibrariesForCardUseCase";
import { GetMyUrlCardsUseCase } from "../../../../modules/cards/application/useCases/queries/GetMyUrlCardsUseCase";
import { CreateCollectionUseCase } from "../../../../modules/cards/application/useCases/commands/CreateCollectionUseCase";
import { UpdateCollectionUseCase } from "../../../../modules/cards/application/useCases/commands/UpdateCollectionUseCase";
import { DeleteCollectionUseCase } from "../../../../modules/cards/application/useCases/commands/DeleteCollectionUseCase";
import { GetCollectionPageUseCase } from "../../../../modules/cards/application/useCases/queries/GetCollectionPageUseCase";
import { GetMyCollectionsUseCase } from "../../../../modules/cards/application/useCases/queries/GetMyCollectionsUseCase";
import { Repositories } from "./RepositoryFactory";
import { Services } from "./ServiceFactory";

export interface UseCases {
  // User use cases
  initiateOAuthSignInUseCase: InitiateOAuthSignInUseCase;
  completeOAuthSignInUseCase: CompleteOAuthSignInUseCase;
  getCurrentUserUseCase: GetCurrentUserUseCase;
  refreshAccessTokenUseCase: RefreshAccessTokenUseCase;
  // Card use cases
  addUrlToLibraryUseCase: AddUrlToLibraryUseCase;
  addCardToLibraryUseCase: AddCardToLibraryUseCase;
  addCardToCollectionUseCase: AddCardToCollectionUseCase;
  updateNoteCardUseCase: UpdateNoteCardUseCase;
  removeCardFromLibraryUseCase: RemoveCardFromLibraryUseCase;
  removeCardFromCollectionUseCase: RemoveCardFromCollectionUseCase;
  getUrlMetadataUseCase: GetUrlMetadataUseCase;
  getUrlCardViewUseCase: GetUrlCardViewUseCase;
  getLibrariesForCardUseCase: GetLibrariesForCardUseCase;
  getMyUrlCardsUseCase: GetMyUrlCardsUseCase;
  createCollectionUseCase: CreateCollectionUseCase;
  updateCollectionUseCase: UpdateCollectionUseCase;
  deleteCollectionUseCase: DeleteCollectionUseCase;
  getCollectionPageUseCase: GetCollectionPageUseCase;
  getMyCollectionsUseCase: GetMyCollectionsUseCase;
}

export class UseCaseFactory {
  static create(repositories: Repositories, services: Services): UseCases {
    return {
      // User use cases
      initiateOAuthSignInUseCase: new InitiateOAuthSignInUseCase(
        services.oauthProcessor
      ),
      completeOAuthSignInUseCase: new CompleteOAuthSignInUseCase(
        services.oauthProcessor,
        services.tokenService,
        repositories.userRepository,
        services.userAuthService
      ),
      getCurrentUserUseCase: new GetCurrentUserUseCase(repositories.userRepository),
      refreshAccessTokenUseCase: new RefreshAccessTokenUseCase(services.tokenService),
      
      // Card use cases
      addUrlToLibraryUseCase: new AddUrlToLibraryUseCase(
        repositories.cardRepository,
        services.metadataService,
        services.cardLibraryService,
        services.cardCollectionService
      ),
      addCardToLibraryUseCase: new AddCardToLibraryUseCase(
        repositories.cardRepository,
        services.cardLibraryService,
        services.cardCollectionService
      ),
      addCardToCollectionUseCase: new AddCardToCollectionUseCase(
        repositories.cardRepository,
        services.cardCollectionService
      ),
      updateNoteCardUseCase: new UpdateNoteCardUseCase(
        repositories.cardRepository,
        services.cardPublisher
      ),
      removeCardFromLibraryUseCase: new RemoveCardFromLibraryUseCase(
        repositories.cardRepository,
        services.cardLibraryService
      ),
      removeCardFromCollectionUseCase: new RemoveCardFromCollectionUseCase(
        repositories.cardRepository,
        services.cardCollectionService
      ),
      getUrlMetadataUseCase: new GetUrlMetadataUseCase(
        services.metadataService,
        repositories.cardRepository
      ),
      getUrlCardViewUseCase: new GetUrlCardViewUseCase(
        repositories.cardQueryRepository,
        services.profileService
      ),
      getLibrariesForCardUseCase: new GetLibrariesForCardUseCase(
        repositories.cardQueryRepository,
        services.profileService
      ),
      getMyUrlCardsUseCase: new GetMyUrlCardsUseCase(repositories.cardQueryRepository),
      createCollectionUseCase: new CreateCollectionUseCase(
        repositories.collectionRepository,
        services.collectionPublisher
      ),
      updateCollectionUseCase: new UpdateCollectionUseCase(
        repositories.collectionRepository,
        services.collectionPublisher
      ),
      deleteCollectionUseCase: new DeleteCollectionUseCase(
        repositories.collectionRepository,
        services.collectionPublisher
      ),
      getCollectionPageUseCase: new GetCollectionPageUseCase(
        repositories.collectionRepository,
        repositories.cardQueryRepository,
        services.profileService
      ),
      getMyCollectionsUseCase: new GetMyCollectionsUseCase(
        repositories.collectionQueryRepository,
        services.profileService
      ),
    };
  }
}
