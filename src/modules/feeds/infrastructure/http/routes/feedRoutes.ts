import { Router } from 'express';
import { GetGlobalFeedController } from '../controllers/GetGlobalFeedController';
import { AuthMiddleware } from '../../../../../shared/infrastructure/http/middleware/AuthMiddleware';

export function createFeedRoutes(
  authMiddleware: AuthMiddleware,
  getGlobalFeedController: GetGlobalFeedController,
): Router {
  const router = Router();

  // Apply authentication middleware to all feed routes
  router.use(authMiddleware.ensureAuthenticated());

  // GET /api/feeds/global - Get global feed
  router.get('/global', (req, res) =>
    getGlobalFeedController.execute(req, res),
  );

  return router;
}
