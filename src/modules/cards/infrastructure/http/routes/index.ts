import { Router } from "express";
import { createCardRoutes } from "./cardRoutes";
import { createCollectionRoutes } from "./collectionRoutes";
import { AddUrlToLibraryController } from "../controllers/AddUrlToLibraryController";
import { AddCardToLibraryController } from "../controllers/AddCardToLibraryController";
import { AddCardToCollectionController } from "../controllers/AddCardToCollectionController";
import { UpdateNoteCardController } from "../controllers/UpdateNoteCardController";
import { RemoveCardFromLibraryController } from "../controllers/RemoveCardFromLibraryController";
import { RemoveCardFromCollectionController } from "../controllers/RemoveCardFromCollectionController";
import { GetUrlMetadataController } from "../controllers/GetUrlMetadataController";
import { GetUrlCardViewController } from "../controllers/GetUrlCardViewController";
import { GetLibrariesForCardController } from "../controllers/GetLibrariesForCardController";
import { GetMyUrlCardsController } from "../controllers/GetMyUrlCardsController";
import { CreateCollectionController } from "../controllers/CreateCollectionController";
import { UpdateCollectionController } from "../controllers/UpdateCollectionController";
import { DeleteCollectionController } from "../controllers/DeleteCollectionController";
import { GetCollectionPageController } from "../controllers/GetCollectionPageController";
import { AuthMiddleware } from "src/shared/infrastructure/http/middleware";
import { GetMyCollectionsController } from "../controllers/GetMyCollectionsController";

export function createCardsModuleRoutes(
  authMiddleware: AuthMiddleware,
  // Card controllers
  addUrlToLibraryController: AddUrlToLibraryController,
  addCardToLibraryController: AddCardToLibraryController,
  addCardToCollectionController: AddCardToCollectionController,
  updateNoteCardController: UpdateNoteCardController,
  removeCardFromLibraryController: RemoveCardFromLibraryController,
  removeCardFromCollectionController: RemoveCardFromCollectionController,
  getUrlMetadataController: GetUrlMetadataController,
  getUrlCardViewController: GetUrlCardViewController,
  getLibrariesForCardController: GetLibrariesForCardController,
  getMyUrlCardsController: GetMyUrlCardsController,
  // Collection controllers
  createCollectionController: CreateCollectionController,
  updateCollectionController: UpdateCollectionController,
  deleteCollectionController: DeleteCollectionController,
  getCollectionPageController: GetCollectionPageController,
  getMyCollectionsController: GetMyCollectionsController
): Router {
  const router = Router();

  // Mount card routes at /api/cards
  router.use(
    "/cards",
    createCardRoutes(
      authMiddleware,
      addUrlToLibraryController,
      addCardToLibraryController,
      addCardToCollectionController,
      updateNoteCardController,
      removeCardFromLibraryController,
      removeCardFromCollectionController,
      getUrlMetadataController,
      getUrlCardViewController,
      getLibrariesForCardController,
      getMyUrlCardsController
    )
  );

  // Mount collection routes at /api/collections
  router.use(
    "/collections",
    createCollectionRoutes(
      authMiddleware,
      createCollectionController,
      updateCollectionController,
      deleteCollectionController,
      getCollectionPageController,
      getMyCollectionsController
    )
  );

  return router;
}
