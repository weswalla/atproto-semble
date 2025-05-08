import { Router } from "express";
import { CreateAndPublishAnnotationTemplateController } from "../controllers/CreateAndPublishAnnotationTemplateController";
import { AuthMiddleware } from "../../../../../shared/infrastructure/http/middleware/AuthMiddleware";

export const createAnnotationRoutes = (
  router: Router,
  authMiddleware: AuthMiddleware,
  createAndPublishAnnotationTemplateController: CreateAndPublishAnnotationTemplateController
) => {
  // Protected routes - all annotation routes require authentication
  router.post("/templates", authMiddleware.ensureAuthenticated(), (req, res) =>
    createAndPublishAnnotationTemplateController.execute(req, res)
  );

  return router;
};
