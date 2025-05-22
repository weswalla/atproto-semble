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
import { FetchMyTemplatesController } from "../../../modules/annotations/infrastructure/http/controllers/FetchMyTemplatesController";
import { FetchTemplateByIdController } from "../../../modules/annotations/infrastructure/http/controllers/FetchTemplateByIdController";
import { FetchAnnotationByIdController } from "../../../modules/annotations/infrastructure/http/controllers/FetchAnnotationByIdController";

// Use cases
import { InitiateOAuthSignInUseCase } from "../../../modules/user/application/use-cases/InitiateOAuthSignInUseCase";
import { CompleteOAuthSignInUseCase } from "../../../modules/user/application/use-cases/CompleteOAuthSignInUseCase";
import { GetCurrentUserUseCase } from "../../../modules/user/application/use-cases/GetCurrentUserUseCase";
import { RefreshAccessTokenUseCase } from "../../../modules/user/application/use-cases/RefreshAccessTokenUseCase";
import { CreateAndPublishAnnotationTemplateUseCase } from "../../../modules/annotations/application/use-cases/CreateAndPublishAnnotationTemplateUseCase";
import { CreateAndPublishAnnotationsFromTemplateUseCase } from "../../../modules/annotations/application/use-cases/CreateAndPublishAnnotationsFromTemplateUseCase";
import { FetchMyTemplatesUseCase } from "../../../modules/annotations/application/use-cases/FetchMyTemplatesUseCase";
import { FetchTemplateByIdUseCase } from "../../../modules/annotations/application/use-cases/FetchTemplateByIdUseCase";

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
import { FetchMyAnnotationsController } from "src/modules/annotations/infrastructure/http/controllers/FetchMyAnnotationsController";
import { FetchMyAnnotationsUseCase } from "src/modules/annotations/application/use-cases/FetchMyAnnotationsUseCase";
import { FetchAnnotationByIdUseCase } from "src/modules/annotations/application/use-cases/FetchAnnotationByIdUseCase";

export const createExpressApp = (
  configService: EnvironmentConfigService
): Express => {
  const app = express();

  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: false,
    })
  );
  // Middleware setup
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Database connection
  const db = DatabaseFactory.createConnection(
    configService.getDatabaseConfig()
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
  const appUrl = configService.get().app.appUrl;
  const nodeOauthClient = OAuthClientFactory.createClient(db, appUrl);
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
  const fetchMyTemplatesUseCase = new FetchMyTemplatesUseCase(
    annotationTemplateRepository
  );
  const fetchTemplateByIdUseCase = new FetchTemplateByIdUseCase(
    annotationTemplateRepository
  );
  const fetchMyAnnotationsUseCase = new FetchMyAnnotationsUseCase(
    annotationRepository
  );
  const fetchAnnotationByIdUseCase = new FetchAnnotationByIdUseCase(
    annotationRepository
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
  const fetchMyTemplatesController = new FetchMyTemplatesController(
    fetchMyTemplatesUseCase
  );
  const fetchTemplateByIdController = new FetchTemplateByIdController(
    fetchTemplateByIdUseCase
  );
  const fetchMyAnnotationsController = new FetchMyAnnotationsController(
    fetchMyAnnotationsUseCase
  );
  const fetchAnnotationByIdController = new FetchAnnotationByIdController(
    fetchAnnotationByIdUseCase
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
    createAndPublishAnnotationsFromTemplateController,
    fetchMyTemplatesController,
    fetchTemplateByIdController,
    fetchMyAnnotationsController,
    fetchAnnotationByIdController
  );

  createAtprotoRoutes(atprotoRouter, nodeOauthClient);

  // Register routes
  app.use("/api/users", userRouter);
  app.use("/api/annotations", annotationRouter);
  app.use("/atproto", atprotoRouter);

  return app;
};
