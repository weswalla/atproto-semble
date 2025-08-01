import { InitiateOAuthSignInController } from '../../../../modules/user/infrastructure/http/controllers/InitiateOAuthSignInController';
import { CompleteOAuthSignInController } from '../../../../modules/user/infrastructure/http/controllers/CompleteOAuthSignInController';
import { RefreshAccessTokenController } from '../../../../modules/user/infrastructure/http/controllers/RefreshAccessTokenController';
import { AddUrlToLibraryController } from '../../../../modules/cards/infrastructure/http/controllers/AddUrlToLibraryController';
import { AddCardToLibraryController } from '../../../../modules/cards/infrastructure/http/controllers/AddCardToLibraryController';
import { AddCardToCollectionController } from '../../../../modules/cards/infrastructure/http/controllers/AddCardToCollectionController';
import { UpdateNoteCardController } from '../../../../modules/cards/infrastructure/http/controllers/UpdateNoteCardController';
import { RemoveCardFromLibraryController } from '../../../../modules/cards/infrastructure/http/controllers/RemoveCardFromLibraryController';
import { RemoveCardFromCollectionController } from '../../../../modules/cards/infrastructure/http/controllers/RemoveCardFromCollectionController';
import { GetUrlMetadataController } from '../../../../modules/cards/infrastructure/http/controllers/GetUrlMetadataController';
import { GetUrlCardViewController } from '../../../../modules/cards/infrastructure/http/controllers/GetUrlCardViewController';
import { GetLibrariesForCardController } from '../../../../modules/cards/infrastructure/http/controllers/GetLibrariesForCardController';
import { GetMyUrlCardsController } from '../../../../modules/cards/infrastructure/http/controllers/GetMyUrlCardsController';
import { CreateCollectionController } from '../../../../modules/cards/infrastructure/http/controllers/CreateCollectionController';
import { UpdateCollectionController } from '../../../../modules/cards/infrastructure/http/controllers/UpdateCollectionController';
import { DeleteCollectionController } from '../../../../modules/cards/infrastructure/http/controllers/DeleteCollectionController';
import { GetCollectionPageController } from '../../../../modules/cards/infrastructure/http/controllers/GetCollectionPageController';
import { GetMyCollectionsController } from '../../../../modules/cards/infrastructure/http/controllers/GetMyCollectionsController';
import { UseCases } from './UseCaseFactory';
import { GetMyProfileController } from 'src/modules/cards/infrastructure/http/controllers/GetMyProfileController';
import { LoginWithAppPasswordController } from 'src/modules/user/infrastructure/http/controllers/LoginWithAppPasswordController';
import { GenerateExtensionTokensController } from 'src/modules/user/infrastructure/http/controllers/GenerateExtensionTokensController';

export interface Controllers {
  // User controllers
  loginWithAppPasswordController: LoginWithAppPasswordController;
  initiateOAuthSignInController: InitiateOAuthSignInController;
  completeOAuthSignInController: CompleteOAuthSignInController;
  getMyProfileController: GetMyProfileController;
  refreshAccessTokenController: RefreshAccessTokenController;
  generateExtensionTokensController: GenerateExtensionTokensController;
  // Card controllers
  addUrlToLibraryController: AddUrlToLibraryController;
  addCardToLibraryController: AddCardToLibraryController;
  addCardToCollectionController: AddCardToCollectionController;
  updateNoteCardController: UpdateNoteCardController;
  removeCardFromLibraryController: RemoveCardFromLibraryController;
  removeCardFromCollectionController: RemoveCardFromCollectionController;
  getUrlMetadataController: GetUrlMetadataController;
  getUrlCardViewController: GetUrlCardViewController;
  getLibrariesForCardController: GetLibrariesForCardController;
  getMyUrlCardsController: GetMyUrlCardsController;
  createCollectionController: CreateCollectionController;
  updateCollectionController: UpdateCollectionController;
  deleteCollectionController: DeleteCollectionController;
  getCollectionPageController: GetCollectionPageController;
  getMyCollectionsController: GetMyCollectionsController;
}

export class ControllerFactory {
  static create(useCases: UseCases): Controllers {
    return {
      // User controllers
      loginWithAppPasswordController: new LoginWithAppPasswordController(
        useCases.loginWithAppPasswordUseCase,
      ),
      initiateOAuthSignInController: new InitiateOAuthSignInController(
        useCases.initiateOAuthSignInUseCase,
      ),
      completeOAuthSignInController: new CompleteOAuthSignInController(
        useCases.completeOAuthSignInUseCase,
      ),
      getMyProfileController: new GetMyProfileController(
        useCases.getMyProfileUseCase,
      ),
      refreshAccessTokenController: new RefreshAccessTokenController(
        useCases.refreshAccessTokenUseCase,
      ),
      generateExtensionTokensController: new GenerateExtensionTokensController(
        useCases.generateExtensionTokensUseCase,
      ),

      // Card controllers
      addUrlToLibraryController: new AddUrlToLibraryController(
        useCases.addUrlToLibraryUseCase,
      ),
      addCardToLibraryController: new AddCardToLibraryController(
        useCases.addCardToLibraryUseCase,
      ),
      addCardToCollectionController: new AddCardToCollectionController(
        useCases.addCardToCollectionUseCase,
      ),
      updateNoteCardController: new UpdateNoteCardController(
        useCases.updateNoteCardUseCase,
      ),
      removeCardFromLibraryController: new RemoveCardFromLibraryController(
        useCases.removeCardFromLibraryUseCase,
      ),
      removeCardFromCollectionController:
        new RemoveCardFromCollectionController(
          useCases.removeCardFromCollectionUseCase,
        ),
      getUrlMetadataController: new GetUrlMetadataController(
        useCases.getUrlMetadataUseCase,
      ),
      getUrlCardViewController: new GetUrlCardViewController(
        useCases.getUrlCardViewUseCase,
      ),
      getLibrariesForCardController: new GetLibrariesForCardController(
        useCases.getLibrariesForCardUseCase,
      ),
      getMyUrlCardsController: new GetMyUrlCardsController(
        useCases.getMyUrlCardsUseCase,
      ),
      createCollectionController: new CreateCollectionController(
        useCases.createCollectionUseCase,
      ),
      updateCollectionController: new UpdateCollectionController(
        useCases.updateCollectionUseCase,
      ),
      deleteCollectionController: new DeleteCollectionController(
        useCases.deleteCollectionUseCase,
      ),
      getCollectionPageController: new GetCollectionPageController(
        useCases.getCollectionPageUseCase,
      ),
      getMyCollectionsController: new GetMyCollectionsController(
        useCases.getMyCollectionsUseCase,
      ),

      // Feed controllers
      getGlobalFeedController: new GetGlobalFeedController(
        useCases.getGlobalFeedUseCase,
      ),
    };
  }
}
