import express, { Express } from "express";
import cors from "cors";
import { Router } from "express";
import { createUserRoutes } from "../../../modules/user/infrastructure/http/routes/userRoutes";
import { createAnnotationRoutes } from "../../../modules/annotations/infrastructure/http/routes/annotationRoutes";
import { DatabaseFactory } from "../database/DatabaseFactory";
import { jwtConfig, oauthConfig } from "../config";
import { EnvironmentConfigService } from "../config/EnvironmentConfigService";

// Controllers
import { InitiateOAuthSignInController } from "../../../modules/user/infrastructure/http/controllers/InitiateOAuthSignInController";
import { CompleteOAuthSignInController } from "../../../modules/user/infrastructure/http/controllers/CompleteOAuthSignInController";
import { GetCurrentUserController } from "../../../modules/user/infrastructure/http/controllers/GetCurrentUserController";
import { RefreshAccessTokenController } from "../../../modules/user/infrastructure/http/controllers/RefreshAccessTokenController";
import { CreateAndPublishAnnotationTemplateController } from "../../../modules/annotations/infrastructure/http/controllers/CreateAndPublishAnnotationTemplateController";
import { CreateAndPublishAnnotationsFromTemplateController } from "../../../modules/annotations/infrastructure/http/controllers/CreateAndPublishAnnotationsFromTemplateController";

// Use cases
import { InitiateOAuthSignInUseCase } from "../../../modules/user/application/use-cases/InitiateOAuthSignInUseCase";
import { CompleteOAuthSignInUseCase } from "../../../modules/user/application/use-cases/CompleteOAuthSignInUseCase";
import { GetCurrentUserUseCase } from "../../../modules/user/application/use-cases/GetCurrentUserUseCase";
import { RefreshAccessTokenUseCase } from "../../../modules/user/application/use-cases/RefreshAccessTokenUseCase";
import { CreateAndPublishAnnotationTemplateUseCase } from "../../../modules/annotations/application/use-cases/CreateAndPublishAnnotationTemplateUseCase";
import { CreateAndPublishAnnotationsFromTemplateUseCase } from "../../../modules/annotations/application/use-cases/CreateAndPublishAnnotationsFromTemplateUseCase";

// Services and repositories
import { JwtTokenService } from "../../../modules/user/infrastructure/services/JwtTokenService";
import { AuthMiddleware } from "./middleware/AuthMiddleware";
import { UserAuthenticationService } from "../../../modules/user/infrastructure/services/UserAuthenticationService";
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
import { ATProtoAgentService } from "src/modules/atproto/infrastructure/services/ATProtoAgentService";
import { createAtprotoRoutes } from "src/modules/atproto/infrastructure/atprotoRoutes";

export const createExpressApp = (
  configService?: EnvironmentConfigService
): Express => {
  const app = express();

  app.use(
    cors({
      origin: ["http://localhost:4000"],
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    })
  );
  // Middleware setup
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Database connection
  const db = DatabaseFactory.createConnection(
    configService?.getDatabaseConfig()
  );

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
  const tokenService = new JwtTokenService(
    tokenRepository,
    jwtConfig.jwtSecret,
    jwtConfig.accessTokenExpiresIn,
    jwtConfig.refreshTokenExpiresIn
  );
  const nodeOauthClient = OAuthClientFactory.createClient(
    db,
    oauthConfig.baseUrl
  );
  const oauthProcessor = new AtProtoOAuthProcessor(nodeOauthClient);
  const userAuthService = new UserAuthenticationService(userRepository);
  const atProtoAgentService = new ATProtoAgentService(nodeOauthClient);
  const annotationTemplatePublisher = new ATProtoAnnotationTemplatePublisher(
    atProtoAgentService
  );
  const annotationFieldPublisher = new ATProtoAnnotationFieldPublisher(
    atProtoAgentService
  );
  const annotationsFromTemplatePublisher =
    new ATProtoAnnotationsFromTemplatePublisher(atProtoAgentService);

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
  const atprotoRouter = Router();

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

  createAtprotoRoutes(atprotoRouter, nodeOauthClient);

  // Register routes
  app.use("/api/users", userRouter);
  app.use("/api/annotations", annotationRouter);
  app.use("/atproto", atprotoRouter);

  return app;
};
