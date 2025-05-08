import { Router } from "express";
import { CreateAndPublishAnnotationTemplateController } from "../controllers/CreateAndPublishAnnotationTemplateController";
import { CreateAndPublishAnnotationsFromTemplateController } from "../controllers/CreateAndPublishAnnotationsFromTemplateController";
import { AuthMiddleware } from "../../../../../shared/infrastructure/http/middleware/AuthMiddleware";

export const createAnnotationRoutes = (
  router: Router,
  authMiddleware: AuthMiddleware,
  createAndPublishAnnotationTemplateController: CreateAndPublishAnnotationTemplateController,
  createAndPublishAnnotationsFromTemplateController: CreateAndPublishAnnotationsFromTemplateController
) => {
  // Protected routes - all annotation routes require authentication
  router.post("/templates", authMiddleware.ensureAuthenticated(), (req, res) =>
    createAndPublishAnnotationTemplateController.execute(req, res)
  );
  
  router.post("/annotations/from-template", authMiddleware.ensureAuthenticated(), (req, res) =>
    createAndPublishAnnotationsFromTemplateController.execute(req, res)
  );

  return router;
};
