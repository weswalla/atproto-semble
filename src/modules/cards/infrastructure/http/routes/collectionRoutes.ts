import { Router } from "express";
import { CreateCollectionController } from "../controllers/CreateCollectionController";
import { UpdateCollectionController } from "../controllers/UpdateCollectionController";
import { DeleteCollectionController } from "../controllers/DeleteCollectionController";
import { AuthMiddleware } from "src/shared/infrastructure/http/middleware";

export function createCollectionRoutes(
  authMiddleware: AuthMiddleware,
  createCollectionController: CreateCollectionController,
  updateCollectionController: UpdateCollectionController,
  deleteCollectionController: DeleteCollectionController
): Router {
  const router = Router();

  // Apply authentication middleware to all collection routes
  router.use(authMiddleware.ensureAuthenticated());

  // POST /api/collections - Create a new collection
  router.post("/", (req, res) => createCollectionController.execute(req, res));

  // PUT /api/collections/:collectionId - Update collection details
  router.put("/:collectionId", (req, res) =>
    updateCollectionController.execute(req, res)
  );

  // DELETE /api/collections/:collectionId - Delete a collection
  router.delete("/:collectionId", (req, res) =>
    deleteCollectionController.execute(req, res)
  );

  return router;
}
