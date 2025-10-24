import { Router } from 'express';
import { GetSimilarUrlsForUrlController } from '../controllers/GetSimilarUrlsForUrlController';
import { AuthMiddleware } from '../../../../../shared/infrastructure/http/middleware/AuthMiddleware';

export function createSearchRoutes(
  authMiddleware: AuthMiddleware,
  getSimilarUrlsForUrlController: GetSimilarUrlsForUrlController,
): Router {
  const router = Router();

  // GET /api/search/similar-urls - Get similar URLs for a given URL
  router.get('/similar-urls', authMiddleware.optionalAuth(), (req, res) =>
    getSimilarUrlsForUrlController.execute(req, res),
  );

  return router;
}
