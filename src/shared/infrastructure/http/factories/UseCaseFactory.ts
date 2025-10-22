import { InitiateOAuthSignInUseCase } from '../../../../modules/user/application/use-cases/InitiateOAuthSignInUseCase';
import { CompleteOAuthSignInUseCase } from '../../../../modules/user/application/use-cases/CompleteOAuthSignInUseCase';
import { RefreshAccessTokenUseCase } from '../../../../modules/user/application/use-cases/RefreshAccessTokenUseCase';
import { AddUrlToLibraryUseCase } from '../../../../modules/cards/application/useCases/commands/AddUrlToLibraryUseCase';
import { AddCardToLibraryUseCase } from '../../../../modules/cards/application/useCases/commands/AddCardToLibraryUseCase';
import { AddCardToCollectionUseCase } from '../../../../modules/cards/application/useCases/commands/AddCardToCollectionUseCase';
import { UpdateNoteCardUseCase } from '../../../../modules/cards/application/useCases/commands/UpdateNoteCardUseCase';
import { UpdateUrlCardAssociationsUseCase } from '../../../../modules/cards/application/useCases/commands/UpdateUrlCardAssociationsUseCase';
import { RemoveCardFromLibraryUseCase } from '../../../../modules/cards/application/useCases/commands/RemoveCardFromLibraryUseCase';
import { RemoveCardFromCollectionUseCase } from '../../../../modules/cards/application/useCases/commands/RemoveCardFromCollectionUseCase';
import { GetUrlMetadataUseCase } from '../../../../modules/cards/application/useCases/queries/GetUrlMetadataUseCase';
import { GetUrlCardViewUseCase } from '../../../../modules/cards/application/useCases/queries/GetUrlCardViewUseCase';
import { GetLibrariesForCardUseCase } from '../../../../modules/cards/application/useCases/queries/GetLibrariesForCardUseCase';
import { GetUrlCardsUseCase } from '../../../../modules/cards/application/useCases/queries/GetUrlCardsUseCase';
import { CreateCollectionUseCase } from '../../../../modules/cards/application/useCases/commands/CreateCollectionUseCase';
import { UpdateCollectionUseCase } from '../../../../modules/cards/application/useCases/commands/UpdateCollectionUseCase';
import { DeleteCollectionUseCase } from '../../../../modules/cards/application/useCases/commands/DeleteCollectionUseCase';
import { GetCollectionPageUseCase } from '../../../../modules/cards/application/useCases/queries/GetCollectionPageUseCase';
import { Repositories } from './RepositoryFactory';
import { Services, SharedServices } from './ServiceFactory';
import { GetProfileUseCase } from 'src/modules/cards/application/useCases/queries/GetProfileUseCase';
import { LoginWithAppPasswordUseCase } from 'src/modules/user/application/use-cases/LoginWithAppPasswordUseCase';
import { LogoutUseCase } from 'src/modules/user/application/use-cases/LogoutUseCase';
import { GenerateExtensionTokensUseCase } from 'src/modules/user/application/use-cases/GenerateExtensionTokensUseCase';
import { GetGlobalFeedUseCase } from '../../../../modules/feeds/application/useCases/queries/GetGlobalFeedUseCase';
import { AddActivityToFeedUseCase } from '../../../../modules/feeds/application/useCases/commands/AddActivityToFeedUseCase';
import { GetCollectionsUseCase } from 'src/modules/cards/application/useCases/queries/GetCollectionsUseCase';
import { GetCollectionPageByAtUriUseCase } from 'src/modules/cards/application/useCases/queries/GetCollectionPageByAtUriUseCase';
import { GetUrlStatusForMyLibraryUseCase } from '../../../../modules/cards/application/useCases/queries/GetUrlStatusForMyLibraryUseCase';
import { GetLibrariesForUrlUseCase } from '../../../../modules/cards/application/useCases/queries/GetLibrariesForUrlUseCase';
import { GetCollectionsForUrlUseCase } from '../../../../modules/cards/application/useCases/queries/GetCollectionsForUrlUseCase';
import { GetNoteCardsForUrlUseCase } from '../../../../modules/cards/application/useCases/queries/GetNoteCardsForUrlUseCase';

export interface UseCases {
  // User use cases
  loginWithAppPasswordUseCase: LoginWithAppPasswordUseCase;
  logoutUseCase: LogoutUseCase;
  initiateOAuthSignInUseCase: InitiateOAuthSignInUseCase;
  completeOAuthSignInUseCase: CompleteOAuthSignInUseCase;
  getMyProfileUseCase: GetProfileUseCase;
  refreshAccessTokenUseCase: RefreshAccessTokenUseCase;
  generateExtensionTokensUseCase: GenerateExtensionTokensUseCase;
  // Card use cases
  addUrlToLibraryUseCase: AddUrlToLibraryUseCase;
  addCardToLibraryUseCase: AddCardToLibraryUseCase;
  addCardToCollectionUseCase: AddCardToCollectionUseCase;
  updateNoteCardUseCase: UpdateNoteCardUseCase;
  updateUrlCardAssociationsUseCase: UpdateUrlCardAssociationsUseCase;
  removeCardFromLibraryUseCase: RemoveCardFromLibraryUseCase;
  removeCardFromCollectionUseCase: RemoveCardFromCollectionUseCase;
  getUrlMetadataUseCase: GetUrlMetadataUseCase;
  getUrlCardViewUseCase: GetUrlCardViewUseCase;
  getLibrariesForCardUseCase: GetLibrariesForCardUseCase;
  getMyUrlCardsUseCase: GetUrlCardsUseCase;
  createCollectionUseCase: CreateCollectionUseCase;
  updateCollectionUseCase: UpdateCollectionUseCase;
  deleteCollectionUseCase: DeleteCollectionUseCase;
  getCollectionPageUseCase: GetCollectionPageUseCase;
  getCollectionPageByAtUriUseCase: GetCollectionPageByAtUriUseCase;
  getCollectionsUseCase: GetCollectionsUseCase;
  getUrlStatusForMyLibraryUseCase: GetUrlStatusForMyLibraryUseCase;
  getLibrariesForUrlUseCase: GetLibrariesForUrlUseCase;
  getCollectionsForUrlUseCase: GetCollectionsForUrlUseCase;
  getNoteCardsForUrlUseCase: GetNoteCardsForUrlUseCase;
  // Feed use cases
  getGlobalFeedUseCase: GetGlobalFeedUseCase;
  addActivityToFeedUseCase: AddActivityToFeedUseCase;
}

export class UseCaseFactory {
  static create(repositories: Repositories, services: Services): UseCases {
    return this.createForWebApp(repositories, services);
  }

  static createForWebApp(
    repositories: Repositories,
    services: Services,
  ): UseCases {
    const getCollectionPageUseCase = new GetCollectionPageUseCase(
      repositories.collectionRepository,
      repositories.cardQueryRepository,
      services.profileService,
    );

    return {
      // User use cases
      loginWithAppPasswordUseCase: new LoginWithAppPasswordUseCase(
        services.appPasswordProcessor,
        services.tokenService,
        repositories.userRepository,
        services.userAuthService,
      ),
      logoutUseCase: new LogoutUseCase(services.tokenService),
      initiateOAuthSignInUseCase: new InitiateOAuthSignInUseCase(
        services.oauthProcessor,
      ),
      completeOAuthSignInUseCase: new CompleteOAuthSignInUseCase(
        services.oauthProcessor,
        services.tokenService,
        repositories.userRepository,
        services.userAuthService,
      ),
      getMyProfileUseCase: new GetProfileUseCase(
        services.profileService,
        services.identityResolutionService,
      ),
      refreshAccessTokenUseCase: new RefreshAccessTokenUseCase(
        services.tokenService,
      ),
      generateExtensionTokensUseCase: new GenerateExtensionTokensUseCase(
        services.tokenService,
      ),

      // Card use cases
      addUrlToLibraryUseCase: new AddUrlToLibraryUseCase(
        repositories.cardRepository,
        services.metadataService,
        services.cardLibraryService,
        services.cardCollectionService,
        services.eventPublisher,
      ),
      addCardToLibraryUseCase: new AddCardToLibraryUseCase(
        repositories.cardRepository,
        services.cardLibraryService,
        services.cardCollectionService,
      ),
      addCardToCollectionUseCase: new AddCardToCollectionUseCase(
        repositories.cardRepository,
        services.cardCollectionService,
        services.eventPublisher,
      ),
      updateNoteCardUseCase: new UpdateNoteCardUseCase(
        repositories.cardRepository,
        services.cardPublisher,
      ),
      updateUrlCardAssociationsUseCase: new UpdateUrlCardAssociationsUseCase(
        repositories.cardRepository,
        services.cardLibraryService,
        services.cardCollectionService,
        services.eventPublisher,
      ),
      removeCardFromLibraryUseCase: new RemoveCardFromLibraryUseCase(
        repositories.cardRepository,
        services.cardLibraryService,
      ),
      removeCardFromCollectionUseCase: new RemoveCardFromCollectionUseCase(
        repositories.cardRepository,
        services.cardCollectionService,
      ),
      getUrlMetadataUseCase: new GetUrlMetadataUseCase(
        services.metadataService,
        repositories.cardRepository,
      ),
      getUrlCardViewUseCase: new GetUrlCardViewUseCase(
        repositories.cardQueryRepository,
        services.profileService,
        repositories.collectionRepository,
      ),
      getLibrariesForCardUseCase: new GetLibrariesForCardUseCase(
        repositories.cardQueryRepository,
        services.profileService,
      ),
      getMyUrlCardsUseCase: new GetUrlCardsUseCase(
        repositories.cardQueryRepository,
        services.identityResolutionService,
      ),
      createCollectionUseCase: new CreateCollectionUseCase(
        repositories.collectionRepository,
        services.collectionPublisher,
      ),
      updateCollectionUseCase: new UpdateCollectionUseCase(
        repositories.collectionRepository,
        services.collectionPublisher,
      ),
      deleteCollectionUseCase: new DeleteCollectionUseCase(
        repositories.collectionRepository,
        services.collectionPublisher,
      ),
      getCollectionPageUseCase,
      getCollectionPageByAtUriUseCase: new GetCollectionPageByAtUriUseCase(
        services.identityResolutionService,
        repositories.atUriResolutionService,
        getCollectionPageUseCase,
        services.configService.getAtProtoCollections().collection,
      ),
      getCollectionsUseCase: new GetCollectionsUseCase(
        repositories.collectionQueryRepository,
        services.profileService,
        services.identityResolutionService,
      ),
      getUrlStatusForMyLibraryUseCase: new GetUrlStatusForMyLibraryUseCase(
        repositories.cardRepository,
        repositories.collectionQueryRepository,
        repositories.collectionRepository,
        services.profileService,
        services.eventPublisher,
      ),
      getLibrariesForUrlUseCase: new GetLibrariesForUrlUseCase(
        repositories.cardQueryRepository,
        services.profileService,
      ),
      getCollectionsForUrlUseCase: new GetCollectionsForUrlUseCase(
        repositories.collectionQueryRepository,
        services.profileService,
        repositories.collectionRepository,
      ),
      getNoteCardsForUrlUseCase: new GetNoteCardsForUrlUseCase(
        repositories.cardQueryRepository,
        services.profileService,
      ),

      // Feed use cases
      getGlobalFeedUseCase: new GetGlobalFeedUseCase(
        repositories.feedRepository,
        services.profileService,
        repositories.cardQueryRepository,
        repositories.collectionRepository,
        services.identityResolutionService,
      ),
      addActivityToFeedUseCase: new AddActivityToFeedUseCase(
        services.feedService,
      ),
    };
  }

  static createForWorker(
    repositories: Repositories,
    services: SharedServices,
  ): Pick<UseCases, 'addActivityToFeedUseCase'> {
    return {
      // Feed use cases (only ones needed by workers)
      addActivityToFeedUseCase: new AddActivityToFeedUseCase(
        services.feedService,
      ),
    };
  }
}
