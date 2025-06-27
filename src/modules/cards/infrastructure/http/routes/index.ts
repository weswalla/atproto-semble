import { Router } from "express";
import { createCardRoutes } from "./cardRoutes";
import { createCollectionRoutes } from "./collectionRoutes";
import { AddUrlToLibraryController } from "../controllers/AddUrlToLibraryController";
import { AddCardToLibraryController } from "../controllers/AddCardToLibraryController";
import { AddCardToCollectionController } from "../controllers/AddCardToCollectionController";
import { UpdateNoteCardController } from "../controllers/UpdateNoteCardController";
import { RemoveCardFromLibraryController } from "../controllers/RemoveCardFromLibraryController";
import { RemoveCardFromCollectionController } from "../controllers/RemoveCardFromCollectionController";
import { CreateCollectionController } from "../controllers/CreateCollectionController";
import { UpdateCollectionController } from "../controllers/UpdateCollectionController";
import { DeleteCollectionController } from "../controllers/DeleteCollectionController";
import { AuthMiddleware } from "src/shared/infrastructure/http/middleware";

export function createCardsModuleRoutes(
  authMiddleware: AuthMiddleware,
  // Card controllers
  addUrlToLibraryController: AddUrlToLibraryController,
  addCardToLibraryController: AddCardToLibraryController,
  addCardToCollectionController: AddCardToCollectionController,
  updateNoteCardController: UpdateNoteCardController,
  removeCardFromLibraryController: RemoveCardFromLibraryController,
  removeCardFromCollectionController: RemoveCardFromCollectionController,
  // Collection controllers
  createCollectionController: CreateCollectionController,
  updateCollectionController: UpdateCollectionController,
  deleteCollectionController: DeleteCollectionController
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
      removeCardFromCollectionController
    )
  );

  // Mount collection routes at /api/collections
  router.use(
    "/collections",
    createCollectionRoutes(
      authMiddleware,
      createCollectionController,
      updateCollectionController,
      deleteCollectionController
    )
  );

  return router;
}
