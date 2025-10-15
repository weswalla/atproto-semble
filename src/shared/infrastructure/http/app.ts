import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Router } from 'express';
import { createUserRoutes } from '../../../modules/user/infrastructure/http/routes/userRoutes';
import { createAtprotoRoutes } from '../../../modules/atproto/infrastructure/atprotoRoutes';
import { createCardsModuleRoutes } from '../../../modules/cards/infrastructure/http/routes';
import { createFeedRoutes } from '../../../modules/feeds/infrastructure/http/routes/feedRoutes';
import { EnvironmentConfigService } from '../config/EnvironmentConfigService';
import { RepositoryFactory } from './factories/RepositoryFactory';
import { ServiceFactory } from './factories/ServiceFactory';
import { UseCaseFactory } from './factories/UseCaseFactory';
import { ControllerFactory } from './factories/ControllerFactory';

export const createExpressApp = (
  configService: EnvironmentConfigService,
): Express => {
  const app = express();

  // Determine allowed origins based on environment
  const getAllowedOrigins = () => {
    const environment = configService.get().environment;
    const appUrl = configService.getAppConfig().appUrl;

    switch (environment) {
      case 'prod':
        return ['https://semble.so', 'https://api.semble.so'];
      case 'dev':
        return ['https://dev.semble.so', 'https://api.dev.semble.so'];
      case 'local':
      default:
        // Allow both localhost:4000 and configured appUrl for flexibility
        return [
          'http://localhost:4000',
          'http://127.0.0.1:4000',
          appUrl,
          'http://localhost:3000',
          'http://127.0.0.1:3000',
        ];
    }
  };

  app.use(
    cors({
      origin: getAllowedOrigins(),
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true, // Required for cookies to work in cross-origin requests
    }),
  );

  // Middleware setup
  app.use(cookieParser()); // Parse cookies from incoming requests
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Create all dependencies using factories
  const repositories = RepositoryFactory.create(configService);
  const services = ServiceFactory.createForWebApp(configService, repositories);
  const useCases = UseCaseFactory.createForWebApp(repositories, services);
  const controllers = ControllerFactory.create(useCases, services.cookieService);

  // Routes
  const userRouter = Router();
  const atprotoRouter = Router();

  createUserRoutes(
    userRouter,
    services.authMiddleware,
    controllers.initiateOAuthSignInController,
    controllers.completeOAuthSignInController,
    controllers.loginWithAppPasswordController,
    controllers.logoutController,
    controllers.getMyProfileController,
    controllers.getUserProfileController,
    controllers.refreshAccessTokenController,
    controllers.generateExtensionTokensController,
  );

  createAtprotoRoutes(atprotoRouter, services.nodeOauthClient);

  const cardsRouter = createCardsModuleRoutes(
    services.authMiddleware,
    // Card controllers
    controllers.addUrlToLibraryController,
    controllers.addCardToLibraryController,
    controllers.addCardToCollectionController,
    controllers.updateNoteCardController,
    controllers.removeCardFromLibraryController,
    controllers.removeCardFromCollectionController,
    controllers.getUrlMetadataController,
    controllers.getUrlCardViewController,
    controllers.getLibrariesForCardController,
    controllers.getMyUrlCardsController,
    controllers.getUserUrlCardsController,
    controllers.getUrlStatusForMyLibraryController,
    controllers.getLibrariesForUrlController,
    controllers.getNoteCardsForUrlController,
    // Collection controllers
    controllers.createCollectionController,
    controllers.updateCollectionController,
    controllers.deleteCollectionController,
    controllers.getCollectionPageController,
    controllers.getCollectionPageByAtUriController,
    controllers.getMyCollectionsController,
    controllers.getCollectionsController,
    controllers.getCollectionsForUrlController,
  );

  const feedRouter = createFeedRoutes(
    services.authMiddleware,
    controllers.getGlobalFeedController,
  );

  // Register routes
  app.use('/api/users', userRouter);
  app.use('/atproto', atprotoRouter);
  app.use('/api', cardsRouter);
  app.use('/api/feeds', feedRouter);

  return app;
};
