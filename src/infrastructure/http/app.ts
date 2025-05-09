import express, { Express } from "express";
import { Router } from "express";
import { createUserRoutes } from "../../modules/user/infrastructure/http/routes/userRoutes";
import { createAnnotationRoutes } from "../../modules/annotations/infrastructure/http/routes/annotationRoutes";
import { DatabaseFactory } from "../database/DatabaseFactory";

// Controllers
import { InitiateOAuthSignInController } from "../../modules/user/infrastructure/http/controllers/InitiateOAuthSignInController";
import { CompleteOAuthSignInController } from "../../modules/user/infrastructure/http/controllers/CompleteOAuthSignInController";
import { GetCurrentUserController } from "../../modules/user/infrastructure/http/controllers/GetCurrentUserController";
import { RefreshAccessTokenController } from "../../modules/user/infrastructure/http/controllers/RefreshAccessTokenController";
import { CreateAndPublishAnnotationTemplateController } from "../../modules/annotations/infrastructure/http/controllers/CreateAndPublishAnnotationTemplateController";
import { CreateAndPublishAnnotationsFromTemplateController } from "../../modules/annotations/infrastructure/http/controllers/CreateAndPublishAnnotationsFromTemplateController";

// Use cases
import { InitiateOAuthSignInUseCase } from "../../modules/user/application/use-cases/InitiateOAuthSignInUseCase";
import { CompleteOAuthSignInUseCase } from "../../modules/user/application/use-cases/CompleteOAuthSignInUseCase";
import { GetCurrentUserUseCase } from "../../modules/user/application/use-cases/GetCurrentUserUseCase";
import { RefreshAccessTokenUseCase } from "../../modules/user/application/use-cases/RefreshAccessTokenUseCase";
import { CreateAndPublishAnnotationTemplateUseCase } from "../../modules/annotations/application/use-cases/CreateAndPublishAnnotationTemplateUseCase";
import { CreateAndPublishAnnotationsFromTemplateUseCase } from "../../modules/annotations/application/use-cases/CreateAndPublishAnnotationsFromTemplateUseCase";

// Services and repositories
import { JwtTokenService } from "../../modules/user/infrastructure/services/JwtTokenService";
import { AuthMiddleware } from "../../shared/infrastructure/http/middleware/AuthMiddleware";
import { UserAuthenticationService } from "../../modules/user/infrastructure/services/UserAuthenticationService";
import {
  AtProtoOAuthProcessor,
  DrizzleUserRepository,
  OAuthClientFactory,
} from "src/modules/user/infrastructure";
import { DrizzleTokenRepository } from "src/modules/user/infrastructure/repositories/DrizzleTokenRepository";
import { DrizzleAnnotationTemplateRepository } from "src/modules/annotations/infrastructure/repositories";
import { DrizzleAnnotationRepository } from "src/modules/annotations/infrastructure/repositories/DrizzleAnnotationRepository";
import { ATProtoAnnotationTemplatePublisher } from "src/modules/atproto/infrastructure/ATProtoAnnotationTemplatePublisher";
import { ATProtoAnnotationFieldPublisher } from "src/modules/atproto/infrastructure/ATProtoAnnotationFieldPublisher";
import { ATProtoAnnotationsFromTemplatePublisher } from "src/modules/atproto/infrastructure/ATProtoAnnotationsFromTemplatePublisher";
import { DrizzleAnnotationFieldRepository } from "src/modules/annotations/infrastructure/repositories/DrizzleAnnotationFieldRepository";

export const createExpressApp = (): Express => {
  const app = express();

  // Middleware setup
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Database connection
  const db = DatabaseFactory.createConnection();

  // Repositories with DB injection
  const userRepository = new DrizzleUserRepository(db);
  const tokenRepository = new DrizzleTokenRepository(db);
  const annotationFieldRepository = new DrizzleAnnotationFieldRepository(db);
  const annotationTemplateRepository = new DrizzleAnnotationTemplateRepository(
    db,
    annotationFieldRepository
  );
  const annotationRepository = new DrizzleAnnotationRepository(
    db,
    annotationFieldRepository
  );

  // Services
  const jwtSecret = process.env.JWT_SECRET || "default-secret";
  const tokenService = new JwtTokenService(tokenRepository, jwtSecret);
  const nodeOauthClient = OAuthClientFactory.createClient();
  const oauthProcessor = new AtProtoOAuthProcessor(nodeOauthClient);
  const userAuthService = new UserAuthenticationService();
  const annotationTemplatePublisher = new ATProtoAnnotationTemplatePublisher();
  const annotationFieldPublisher = new ATProtoAnnotationFieldPublisher();
  const annotationsFromTemplatePublisher =
    new ATProtoAnnotationsFromTemplatePublisher();

  // Auth middleware
  const authMiddleware = new AuthMiddleware(tokenService);

  // Use cases
  const initiateOAuthSignInUseCase = new InitiateOAuthSignInUseCase(
    oauthProcessor
  );
  const completeOAuthSignInUseCase = new CompleteOAuthSignInUseCase(
    oauthProcessor,
    tokenService,
    userRepository,
    userAuthService
  );
  const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);
  const refreshAccessTokenUseCase = new RefreshAccessTokenUseCase(tokenService);

  const createAndPublishAnnotationTemplateUseCase =
    new CreateAndPublishAnnotationTemplateUseCase(
      annotationTemplateRepository,
      annotationTemplatePublisher,
      annotationFieldPublisher
    );
  const createAndPublishAnnotationsFromTemplateUseCase =
    new CreateAndPublishAnnotationsFromTemplateUseCase(
      annotationRepository,
      annotationTemplateRepository,
      annotationFieldRepository,
      annotationsFromTemplatePublisher
    );

  // Controllers
  const initiateOAuthSignInController = new InitiateOAuthSignInController(
    initiateOAuthSignInUseCase
  );
  const completeOAuthSignInController = new CompleteOAuthSignInController(
    completeOAuthSignInUseCase
  );
  const getCurrentUserController = new GetCurrentUserController(
    getCurrentUserUseCase
  );
  const refreshAccessTokenController = new RefreshAccessTokenController(
    refreshAccessTokenUseCase
  );

  const createAndPublishAnnotationTemplateController =
    new CreateAndPublishAnnotationTemplateController(
      createAndPublishAnnotationTemplateUseCase
    );
  const createAndPublishAnnotationsFromTemplateController =
    new CreateAndPublishAnnotationsFromTemplateController(
      createAndPublishAnnotationsFromTemplateUseCase
    );

  // Routes
  const userRouter = Router();
  const annotationRouter = Router();

  createUserRoutes(
    userRouter,
    authMiddleware,
    initiateOAuthSignInController,
    completeOAuthSignInController,
    getCurrentUserController,
    refreshAccessTokenController
  );

  createAnnotationRoutes(
    annotationRouter,
    authMiddleware,
    createAndPublishAnnotationTemplateController,
    createAndPublishAnnotationsFromTemplateController
  );

  // Register routes
  app.use("/api/users", userRouter);
  app.use("/api/annotations", annotationRouter);

  return app;
};
