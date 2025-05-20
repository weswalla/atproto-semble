import { Router } from "express";
import { CreateAndPublishAnnotationTemplateController } from "../controllers/CreateAndPublishAnnotationTemplateController";
import { CreateAndPublishAnnotationsFromTemplateController } from "../controllers/CreateAndPublishAnnotationsFromTemplateController";
import { FetchMyTemplatesController } from "../controllers/FetchMyTemplatesController";
import { FetchTemplateByIdController } from "../controllers/FetchTemplateByIdController";
import { FetchMyAnnotationsController } from "../controllers/FetchMyAnnotationsController";
import { FetchAnnotationByIdController } from "../controllers/FetchAnnotationByIdController";
import { AuthMiddleware } from "../../../../../shared/infrastructure/http/middleware/AuthMiddleware";

export const createAnnotationRoutes = (
  router: Router,
  authMiddleware: AuthMiddleware,
  createAndPublishAnnotationTemplateController: CreateAndPublishAnnotationTemplateController,
  createAndPublishAnnotationsFromTemplateController: CreateAndPublishAnnotationsFromTemplateController,
  fetchMyTemplatesController: FetchMyTemplatesController,
  fetchTemplateByIdController: FetchTemplateByIdController,
  fetchMyAnnotationsController: FetchMyAnnotationsController,
  fetchAnnotationByIdController: FetchAnnotationByIdController
) => {
  // Protected routes - all annotation routes require authentication
  router.post("/templates", authMiddleware.ensureAuthenticated(), (req, res) =>
    createAndPublishAnnotationTemplateController.execute(req, res)
  );

  router.get("/templates", authMiddleware.ensureAuthenticated(), (req, res) =>
    fetchMyTemplatesController.execute(req, res)
  );

  router.get(
    "/templates/:id",
    authMiddleware.ensureAuthenticated(),
    (req, res) => fetchTemplateByIdController.execute(req, res)
  );

  router.post(
    "/from-template",
    authMiddleware.ensureAuthenticated(),
    (req, res) =>
      createAndPublishAnnotationsFromTemplateController.execute(req, res)
  );

  router.get(
    "/my-annotations",
    authMiddleware.ensureAuthenticated(),
    (req, res) => fetchMyAnnotationsController.execute(req, res)
  );

  router.get(
    "/:id",
    authMiddleware.ensureAuthenticated(),
    (req, res) => fetchAnnotationByIdController.execute(req, res)
  );

  return router;
};
