import { Router } from "express";
import { GetMyProfileController } from "../controllers/GetMyProfileController";
import { AuthMiddleware } from "src/shared/infrastructure/http/middleware";

export function createUserRoutes(
  authMiddleware: AuthMiddleware,
  getMyProfileController: GetMyProfileController
): Router {
  const router = Router();

  // Apply authentication middleware to all user routes
  router.use(authMiddleware.ensureAuthenticated());

  // GET /api/users/me - Get my profile
  router.get("/me", (req, res) =>
    getMyProfileController.execute(req, res)
  );

  return router;
}
