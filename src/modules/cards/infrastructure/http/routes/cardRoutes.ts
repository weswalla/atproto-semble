import { Router } from 'express';
import { AddUrlToLibraryController } from '../controllers/AddUrlToLibraryController';
import { AddCardToLibraryController } from '../controllers/AddCardToLibraryController';
import { AddCardToCollectionController } from '../controllers/AddCardToCollectionController';
import { UpdateNoteCardController } from '../controllers/UpdateNoteCardController';
import { RemoveCardFromLibraryController } from '../controllers/RemoveCardFromLibraryController';
import { RemoveCardFromCollectionController } from '../controllers/RemoveCardFromCollectionController';
import { GetUrlMetadataController } from '../controllers/GetUrlMetadataController';
import { GetUrlCardViewController } from '../controllers/GetUrlCardViewController';
import { GetLibrariesForCardController } from '../controllers/GetLibrariesForCardController';
import { GetMyUrlCardsController } from '../controllers/GetMyUrlCardsController';
import { AuthMiddleware } from 'src/shared/infrastructure/http/middleware';

export function createCardRoutes(
  authMiddleware: AuthMiddleware,
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
): Router {
  const router = Router();

  // Apply authentication middleware to all card routes
  router.use(authMiddleware.ensureAuthenticated());

  // Query routes
  // GET /api/cards/metadata - Get URL metadata
  router.get('/metadata', (req, res) =>
    getUrlMetadataController.execute(req, res),
  );

  // GET /api/cards/my - Get my URL cards
  router.get('/my', (req, res) => getMyUrlCardsController.execute(req, res));

  // GET /api/cards/:cardId - Get URL card view
  router.get('/:cardId', (req, res) =>
    getUrlCardViewController.execute(req, res),
  );

  // GET /api/cards/:cardId/libraries - Get libraries for card
  router.get('/:cardId/libraries', (req, res) =>
    getLibrariesForCardController.execute(req, res),
  );

  // Command routes
  // POST /api/cards/library/urls - Add URL to library (with optional note and collections)
  router.post('/library/urls', (req, res) =>
    addUrlToLibraryController.execute(req, res),
  );

  // POST /api/cards/library - Add existing card to library
  router.post('/library', (req, res) =>
    addCardToLibraryController.execute(req, res),
  );

  // POST /api/cards/collections - Add card to collections
  router.post('/collections', (req, res) =>
    addCardToCollectionController.execute(req, res),
  );

  // PUT /api/cards/:cardId/note - Update note card content
  router.put('/:cardId/note', (req, res) =>
    updateNoteCardController.execute(req, res),
  );

  // DELETE /api/cards/:cardId/library - Remove card from user's library
  router.delete('/:cardId/library', (req, res) =>
    removeCardFromLibraryController.execute(req, res),
  );

  // DELETE /api/cards/:cardId/collections - Remove card from specified collections
  router.delete('/:cardId/collections', (req, res) =>
    removeCardFromCollectionController.execute(req, res),
  );

  return router;
}
