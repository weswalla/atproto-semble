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
import { GetUserUrlCardsController } from '../controllers/GetUserUrlCardsController';
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
  getUserUrlCardsController: GetUserUrlCardsController,
): Router {
  const router = Router();

  // Query routes
  // GET /api/cards/metadata - Get URL metadata
  router.get('/metadata', authMiddleware.optionalAuth(), (req, res) =>
    getUrlMetadataController.execute(req, res),
  );

  // GET /api/cards/my - Get my URL cards
  router.get('/my', authMiddleware.ensureAuthenticated(), (req, res) =>
    getMyUrlCardsController.execute(req, res),
  );

  // GET /api/cards/user/:did - Get user's URL cards by DID
  router.get('/user/:did', authMiddleware.optionalAuth(), (req, res) =>
    getUserUrlCardsController.execute(req, res),
  );

  // GET /api/cards/:cardId - Get URL card view
  router.get('/:cardId', authMiddleware.optionalAuth(), (req, res) =>
    getUrlCardViewController.execute(req, res),
  );

  // GET /api/cards/:cardId/libraries - Get libraries for card
  router.get('/:cardId/libraries', authMiddleware.optionalAuth(), (req, res) =>
    getLibrariesForCardController.execute(req, res),
  );

  // Command routes
  // POST /api/cards/library/urls - Add URL to library (with optional note and collections)
  router.post(
    '/library/urls',
    authMiddleware.ensureAuthenticated(),
    (req, res) => addUrlToLibraryController.execute(req, res),
  );

  // POST /api/cards/library - Add existing card to library
  router.post('/library', authMiddleware.ensureAuthenticated(), (req, res) =>
    addCardToLibraryController.execute(req, res),
  );

  // POST /api/cards/collections - Add card to collections
  router.post(
    '/collections',
    authMiddleware.ensureAuthenticated(),
    (req, res) => addCardToCollectionController.execute(req, res),
  );

  // PUT /api/cards/:cardId/note - Update note card content
  router.put(
    '/:cardId/note',
    authMiddleware.ensureAuthenticated(),
    (req, res) => updateNoteCardController.execute(req, res),
  );

  // DELETE /api/cards/:cardId/library - Remove card from user's library
  router.delete(
    '/:cardId/library',
    authMiddleware.ensureAuthenticated(),
    (req, res) => removeCardFromLibraryController.execute(req, res),
  );

  // DELETE /api/cards/:cardId/collections - Remove card from specified collections
  router.delete(
    '/:cardId/collections',
    authMiddleware.ensureAuthenticated(),
    (req, res) => removeCardFromCollectionController.execute(req, res),
  );

  return router;
}
