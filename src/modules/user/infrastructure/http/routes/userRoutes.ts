import { Router } from "express";
import { InitiateOAuthSignInController } from "../controllers/InitiateOAuthSignInController";
import { CompleteOAuthSignInController } from "../controllers/CompleteOAuthSignInController";
import { LoginWithAppPasswordController } from "../controllers/LoginWithAppPasswordController";
import { RefreshAccessTokenController } from "../controllers/RefreshAccessTokenController";
import { AuthMiddleware } from "../../../../../shared/infrastructure/http/middleware/AuthMiddleware";
import { GetMyProfileController } from "src/modules/cards/infrastructure/http/controllers/GetMyProfileController";

export const createUserRoutes = (
  router: Router,
  authMiddleware: AuthMiddleware,
  initiateOAuthSignInController: InitiateOAuthSignInController,
  completeOAuthSignInController: CompleteOAuthSignInController,
  loginWithAppPasswordController: LoginWithAppPasswordController,
  getMyProfileController: GetMyProfileController,
  refreshAccessTokenController: RefreshAccessTokenController
) => {
  // Public routes
  router.get("/login", (req, res) =>
    initiateOAuthSignInController.execute(req, res)
  );
  router.get("/oauth/callback", (req, res) =>
    completeOAuthSignInController.execute(req, res)
  );
  router.post("/login/app-password", (req, res) =>
    loginWithAppPasswordController.execute(req, res)
  );
  router.post("/oauth/refresh", (req, res) =>
    refreshAccessTokenController.execute(req, res)
  );

  // Protected routes
  router.get("/me", authMiddleware.ensureAuthenticated(), (req, res) =>
    getMyProfileController.execute(req, res)
  );

  return router;
};
