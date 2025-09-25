import { Router } from 'express';
import { CreateCollectionController } from '../controllers/CreateCollectionController';
import { UpdateCollectionController } from '../controllers/UpdateCollectionController';
import { DeleteCollectionController } from '../controllers/DeleteCollectionController';
import { GetCollectionPageController } from '../controllers/GetCollectionPageController';
import { GetMyCollectionsController } from '../controllers/GetMyCollectionsController';
import { AuthMiddleware } from 'src/shared/infrastructure/http/middleware';

export function createCollectionRoutes(
  authMiddleware: AuthMiddleware,
  createCollectionController: CreateCollectionController,
  updateCollectionController: UpdateCollectionController,
  deleteCollectionController: DeleteCollectionController,
  getCollectionPageController: GetCollectionPageController,
  getMyCollectionsController: GetMyCollectionsController,
): Router {
  const router = Router();

  // Query routes
  // GET /api/collections - Get my collections
  router.get('/', authMiddleware.ensureAuthenticated(), (req, res) =>
    getMyCollectionsController.execute(req, res),
  );

  // GET /api/collections/:collectionId - Get collection page
  router.get('/:collectionId', authMiddleware.optionalAuth(), (req, res) =>
    getCollectionPageController.execute(req, res),
  );

  // Command routes
  // POST /api/collections - Create a new collection
  router.post('/', authMiddleware.ensureAuthenticated(), (req, res) =>
    createCollectionController.execute(req, res),
  );

  // PUT /api/collections/:collectionId - Update collection details
  router.put(
    '/:collectionId',
    authMiddleware.ensureAuthenticated(),
    (req, res) => updateCollectionController.execute(req, res),
  );

  // DELETE /api/collections/:collectionId - Delete a collection
  router.delete(
    '/:collectionId',
    authMiddleware.ensureAuthenticated(),
    (req, res) => deleteCollectionController.execute(req, res),
  );

  return router;
}
