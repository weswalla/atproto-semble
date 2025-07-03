import express, { Express } from "express";
import cors from "cors";
import { Router } from "express";
import { createUserRoutes } from "../../../modules/user/infrastructure/http/routes/userRoutes";
import { DatabaseFactory } from "../database/DatabaseFactory";
import { jwtConfig, oauthConfig } from "../config";
import { EnvironmentConfigService } from "../config/EnvironmentConfigService";

// Controllers
import { InitiateOAuthSignInController } from "../../../modules/user/infrastructure/http/controllers/InitiateOAuthSignInController";
import { CompleteOAuthSignInController } from "../../../modules/user/infrastructure/http/controllers/CompleteOAuthSignInController";
import { GetCurrentUserController } from "../../../modules/user/infrastructure/http/controllers/GetCurrentUserController";
import { RefreshAccessTokenController } from "../../../modules/user/infrastructure/http/controllers/RefreshAccessTokenController";

// Use cases
import { InitiateOAuthSignInUseCase } from "../../../modules/user/application/use-cases/InitiateOAuthSignInUseCase";
import { CompleteOAuthSignInUseCase } from "../../../modules/user/application/use-cases/CompleteOAuthSignInUseCase";
import { GetCurrentUserUseCase } from "../../../modules/user/application/use-cases/GetCurrentUserUseCase";
import { RefreshAccessTokenUseCase } from "../../../modules/user/application/use-cases/RefreshAccessTokenUseCase";

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
import { ATProtoAgentService } from "src/modules/atproto/infrastructure/services/ATProtoAgentService";
import { createAtprotoRoutes } from "src/modules/atproto/infrastructure/atprotoRoutes";

// Cards module imports
import { createCardsModuleRoutes } from "../../../modules/cards/infrastructure/http/routes";

// Cards controllers
import { AddUrlToLibraryController } from "../../../modules/cards/infrastructure/http/controllers/AddUrlToLibraryController";
import { AddCardToLibraryController } from "../../../modules/cards/infrastructure/http/controllers/AddCardToLibraryController";
import { AddCardToCollectionController } from "../../../modules/cards/infrastructure/http/controllers/AddCardToCollectionController";
import { UpdateNoteCardController } from "../../../modules/cards/infrastructure/http/controllers/UpdateNoteCardController";
import { RemoveCardFromLibraryController } from "../../../modules/cards/infrastructure/http/controllers/RemoveCardFromLibraryController";
import { RemoveCardFromCollectionController } from "../../../modules/cards/infrastructure/http/controllers/RemoveCardFromCollectionController";
import { GetUrlMetadataController } from "../../../modules/cards/infrastructure/http/controllers/GetUrlMetadataController";
import { GetUrlCardViewController } from "../../../modules/cards/infrastructure/http/controllers/GetUrlCardViewController";
import { GetLibrariesForCardController } from "../../../modules/cards/infrastructure/http/controllers/GetLibrariesForCardController";
import { GetMyUrlCardsController } from "../../../modules/cards/infrastructure/http/controllers/GetMyUrlCardsController";
import { CreateCollectionController } from "../../../modules/cards/infrastructure/http/controllers/CreateCollectionController";
import { UpdateCollectionController } from "../../../modules/cards/infrastructure/http/controllers/UpdateCollectionController";
import { DeleteCollectionController } from "../../../modules/cards/infrastructure/http/controllers/DeleteCollectionController";
import { GetCollectionPageController } from "../../../modules/cards/infrastructure/http/controllers/GetCollectionPageController";

// Cards use cases
import { AddUrlToLibraryUseCase } from "../../../modules/cards/application/use-cases/AddUrlToLibraryUseCase";
import { AddCardToLibraryUseCase } from "../../../modules/cards/application/use-cases/AddCardToLibraryUseCase";
import { AddCardToCollectionUseCase } from "../../../modules/cards/application/use-cases/AddCardToCollectionUseCase";
import { UpdateNoteCardUseCase } from "../../../modules/cards/application/use-cases/UpdateNoteCardUseCase";
import { RemoveCardFromLibraryUseCase } from "../../../modules/cards/application/use-cases/RemoveCardFromLibraryUseCase";
import { RemoveCardFromCollectionUseCase } from "../../../modules/cards/application/use-cases/RemoveCardFromCollectionUseCase";
import { GetUrlMetadataUseCase } from "../../../modules/cards/application/use-cases/GetUrlMetadataUseCase";
import { GetUrlCardViewUseCase } from "../../../modules/cards/application/use-cases/GetUrlCardViewUseCase";
import { GetLibrariesForCardUseCase } from "../../../modules/cards/application/use-cases/GetLibrariesForCardUseCase";
import { GetMyUrlCardsUseCase } from "../../../modules/cards/application/use-cases/GetMyUrlCardsUseCase";
import { CreateCollectionUseCase } from "../../../modules/cards/application/use-cases/CreateCollectionUseCase";
import { UpdateCollectionUseCase } from "../../../modules/cards/application/use-cases/UpdateCollectionUseCase";
import { DeleteCollectionUseCase } from "../../../modules/cards/application/use-cases/DeleteCollectionUseCase";
import { GetCollectionPageUseCase } from "../../../modules/cards/application/use-cases/GetCollectionPageUseCase";

// Cards repositories and services
import { DrizzleCardRepository } from "../../../modules/cards/infrastructure/repositories/DrizzleCardRepository";
import { DrizzleCardQueryRepository } from "../../../modules/cards/infrastructure/repositories/DrizzleCardQueryRepository";
import { DrizzleCollectionRepository } from "../../../modules/cards/infrastructure/repositories/DrizzleCollectionRepository";
import { DrizzleCollectionQueryRepository } from "../../../modules/cards/infrastructure/repositories/DrizzleCollectionQueryRepository";
import { IFramelyMetadataService } from "../../../modules/cards/infrastructure/IFramelyMetadataService";
import { ATProtoProfileService } from "../../../modules/cards/infrastructure/services/ATProtoProfileService";
import { ATProtoCollectionPublisher } from "../../../modules/cards/infrastructure/publishers/ATProtoCollectionPublisher";

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
  
  // Cards repositories
  const cardRepository = new DrizzleCardRepository(db);
  const cardQueryRepository = new DrizzleCardQueryRepository(db);
  const collectionRepository = new DrizzleCollectionRepository(db);
  const collectionQueryRepository = new DrizzleCollectionQueryRepository(db);
  
  // Cards services
  const metadataService = new IFramelyMetadataService(configService.getIFramelyApiKey());
  const profileService = new ATProtoProfileService(atProtoAgentService);
  const collectionPublisher = new ATProtoCollectionPublisher(atProtoAgentService);
  
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

  // Cards use cases
  const addUrlToLibraryUseCase = new AddUrlToLibraryUseCase(
    cardRepository,
    metadataService
  );
  const addCardToLibraryUseCase = new AddCardToLibraryUseCase(cardRepository);
  const addCardToCollectionUseCase = new AddCardToCollectionUseCase(
    cardRepository,
    collectionRepository
  );
  const updateNoteCardUseCase = new UpdateNoteCardUseCase(cardRepository);
  const removeCardFromLibraryUseCase = new RemoveCardFromLibraryUseCase(
    cardRepository
  );
  const removeCardFromCollectionUseCase = new RemoveCardFromCollectionUseCase(
    cardRepository,
    collectionRepository
  );
  const getUrlMetadataUseCase = new GetUrlMetadataUseCase(metadataService);
  const getUrlCardViewUseCase = new GetUrlCardViewUseCase(
    cardQueryRepository,
    profileService
  );
  const getLibrariesForCardUseCase = new GetLibrariesForCardUseCase(
    cardQueryRepository
  );
  const getMyUrlCardsUseCase = new GetMyUrlCardsUseCase(cardQueryRepository);
  const createCollectionUseCase = new CreateCollectionUseCase(
    collectionRepository,
    collectionPublisher
  );
  const updateCollectionUseCase = new UpdateCollectionUseCase(
    collectionRepository,
    collectionPublisher
  );
  const deleteCollectionUseCase = new DeleteCollectionUseCase(
    collectionRepository,
    collectionPublisher
  );
  const getCollectionPageUseCase = new GetCollectionPageUseCase(
    collectionQueryRepository,
    profileService
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

  // Cards controllers
  const addUrlToLibraryController = new AddUrlToLibraryController(
    addUrlToLibraryUseCase
  );
  const addCardToLibraryController = new AddCardToLibraryController(
    addCardToLibraryUseCase
  );
  const addCardToCollectionController = new AddCardToCollectionController(
    addCardToCollectionUseCase
  );
  const updateNoteCardController = new UpdateNoteCardController(
    updateNoteCardUseCase
  );
  const removeCardFromLibraryController = new RemoveCardFromLibraryController(
    removeCardFromLibraryUseCase
  );
  const removeCardFromCollectionController = new RemoveCardFromCollectionController(
    removeCardFromCollectionUseCase
  );
  const getUrlMetadataController = new GetUrlMetadataController(
    getUrlMetadataUseCase
  );
  const getUrlCardViewController = new GetUrlCardViewController(
    getUrlCardViewUseCase
  );
  const getLibrariesForCardController = new GetLibrariesForCardController(
    getLibrariesForCardUseCase
  );
  const getMyUrlCardsController = new GetMyUrlCardsController(
    getMyUrlCardsUseCase
  );
  const createCollectionController = new CreateCollectionController(
    createCollectionUseCase
  );
  const updateCollectionController = new UpdateCollectionController(
    updateCollectionUseCase
  );
  const deleteCollectionController = new DeleteCollectionController(
    deleteCollectionUseCase
  );
  const getCollectionPageController = new GetCollectionPageController(
    getCollectionPageUseCase
  );

  // Routes
  const userRouter = Router();
  const atprotoRouter = Router();

  createUserRoutes(
    userRouter,
    authMiddleware,
    initiateOAuthSignInController,
    completeOAuthSignInController,
    getCurrentUserController,
    refreshAccessTokenController
  );

  createAtprotoRoutes(atprotoRouter, nodeOauthClient);

  const cardsRouter = createCardsModuleRoutes(
    authMiddleware,
    // Card controllers
    addUrlToLibraryController,
    addCardToLibraryController,
    addCardToCollectionController,
    updateNoteCardController,
    removeCardFromLibraryController,
    removeCardFromCollectionController,
    getUrlMetadataController,
    getUrlCardViewController,
    getLibrariesForCardController,
    getMyUrlCardsController,
    // Collection controllers
    createCollectionController,
    updateCollectionController,
    deleteCollectionController,
    getCollectionPageController
  );

  // Register routes
  app.use("/api/users", userRouter);
  app.use("/atproto", atprotoRouter);
  app.use("/api", cardsRouter);

  return app;
};
