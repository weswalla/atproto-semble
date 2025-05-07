import { Router } from "express";
import { InitiateOAuthSignInController } from "../controllers/InitiateOAuthSignInController";
import { CompleteOAuthSignInController } from "../controllers/CompleteOAuthSignInController";
import { GetCurrentUserController } from "../controllers/GetCurrentUserController";
import { RefreshAccessTokenController } from "../controllers/RefreshAccessTokenController";
import { RevokeTokenController } from "../controllers/RevokeTokenController";
import { AuthMiddleware } from "../../../../../shared/infrastructure/http/middleware/AuthMiddleware";

export const createUserRoutes = (
  router: Router,
  authMiddleware: AuthMiddleware,
  initiateOAuthSignInController: InitiateOAuthSignInController,
  completeOAuthSignInController: CompleteOAuthSignInController,
  getCurrentUserController: GetCurrentUserController,
  refreshAccessTokenController: RefreshAccessTokenController,
  revokeTokenController: RevokeTokenController
) => {
  // Public routes
  router.get("/login", (req, res) => initiateOAuthSignInController.execute(req, res));
  router.get("/oauth/callback", (req, res) => completeOAuthSignInController.execute(req, res));
  router.post("/oauth/refresh", (req, res) => refreshAccessTokenController.execute(req, res));
  router.post("/oauth/revoke", (req, res) => revokeTokenController.execute(req, res));
  
  // Protected routes
  router.get("/me", authMiddleware.ensureAuthenticated(), (req, res) => 
    getCurrentUserController.execute(req, res)
  );

  return router;
};
