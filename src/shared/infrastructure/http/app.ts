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

  // Register routes
  app.use("/api/users", userRouter);
  app.use("/atproto", atprotoRouter);

  return app;
};
