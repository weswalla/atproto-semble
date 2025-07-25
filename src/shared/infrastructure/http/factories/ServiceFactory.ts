import { EnvironmentConfigService } from '../../config/EnvironmentConfigService';
import { jwtConfig, oauthConfig } from '../../config';
import { JwtTokenService } from '../../../../modules/user/infrastructure/services/JwtTokenService';
import {
  AtProtoOAuthProcessor,
  OAuthClientFactory,
} from '../../../../modules/user/infrastructure';
import { UserAuthenticationService } from '../../../../modules/user/infrastructure/services/UserAuthenticationService';
import { ATProtoAgentService } from '../../../../modules/atproto/infrastructure/services/ATProtoAgentService';
import { IFramelyMetadataService } from '../../../../modules/cards/infrastructure/IFramelyMetadataService';
import { BlueskyProfileService } from '../../../../modules/atproto/infrastructure/services/BlueskyProfileService';
import { ATProtoCollectionPublisher } from '../../../../modules/atproto/infrastructure/publishers/ATProtoCollectionPublisher';
import { ATProtoCardPublisher } from '../../../../modules/atproto/infrastructure/publishers/ATProtoCardPublisher';
import { FakeCollectionPublisher } from '../../../../modules/cards/tests/utils/FakeCollectionPublisher';
import { FakeCardPublisher } from '../../../../modules/cards/tests/utils/FakeCardPublisher';
import { CardLibraryService } from '../../../../modules/cards/domain/services/CardLibraryService';
import { CardCollectionService } from '../../../../modules/cards/domain/services/CardCollectionService';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { Repositories } from './RepositoryFactory';
import { NodeOAuthClient } from '@atproto/oauth-client-node';
import { AppPasswordSessionService } from 'src/modules/atproto/infrastructure/services/AppPasswordSessionService';
import { AtpAppPasswordProcessor } from 'src/modules/atproto/infrastructure/services/AtpAppPasswordProcessor';
import { ICollectionPublisher } from 'src/modules/cards/application/ports/ICollectionPublisher';
import { ICardPublisher } from 'src/modules/cards/application/ports/ICardPublisher';
import { IMetadataService } from 'src/modules/cards/domain/services/IMetadataService';
// Mock/Fake service imports
import { FakeJwtTokenService } from '../../../../modules/user/infrastructure/services/FakeJwtTokenService';
import { FakeAtProtoOAuthProcessor } from '../../../../modules/atproto/infrastructure/services/FakeAtProtoOAuthProcessor';
import { FakeUserAuthenticationService } from '../../../../modules/user/infrastructure/services/FakeUserAuthenticationService';
import { FakeAgentService } from '../../../../modules/atproto/infrastructure/services/FakeAgentService';
import { FakeBlueskyProfileService } from '../../../../modules/atproto/infrastructure/services/FakeBlueskyProfileService';
import { FakeAppPasswordSessionService } from '../../../../modules/atproto/infrastructure/services/FakeAppPasswordSessionService';
import { FakeAtpAppPasswordProcessor } from '../../../../modules/atproto/infrastructure/services/FakeAtpAppPasswordProcessor';
import { ITokenService } from 'src/modules/user/application/services/ITokenService';
import { IOAuthProcessor } from 'src/modules/user/application/services/IOAuthProcessor';
import { IAppPasswordProcessor } from 'src/modules/atproto/application/IAppPasswordProcessor';
import { IUserAuthenticationService } from 'src/modules/user/domain/services/IUserAuthenticationService';
import { IAgentService } from 'src/modules/atproto/application/IAgentService';
import { IProfileService } from 'src/modules/cards/domain/services/IProfileService';

export interface Services {
  tokenService: ITokenService;
  nodeOauthClient: NodeOAuthClient;
  oauthProcessor: IOAuthProcessor;
  appPasswordProcessor: IAppPasswordProcessor;
  userAuthService: IUserAuthenticationService;
  atProtoAgentService: IAgentService;
  metadataService: IMetadataService;
  profileService: IProfileService;
  collectionPublisher: ICollectionPublisher;
  cardPublisher: ICardPublisher;
  cardLibraryService: CardLibraryService;
  cardCollectionService: CardCollectionService;
  authMiddleware: AuthMiddleware;
}

export class ServiceFactory {
  static create(
    configService: EnvironmentConfigService,
    repositories: Repositories,
  ): Services {
    const useMockAuth = process.env.USE_MOCK_AUTH === 'true';

    // Token Service
    const tokenService = useMockAuth
      ? new FakeJwtTokenService(repositories.tokenRepository)
      : new JwtTokenService(
          repositories.tokenRepository,
          jwtConfig.jwtSecret,
          jwtConfig.accessTokenExpiresIn,
          jwtConfig.refreshTokenExpiresIn,
        );

    // OAuth Client (always create for real, but may not be used if mocking)
    const nodeOauthClient = OAuthClientFactory.createClient(
      repositories.oauthStateStore,
      repositories.oauthSessionStore,
      oauthConfig.baseUrl,
    );

    // App Password Session Service
    const appPasswordSessionService = useMockAuth
      ? new FakeAppPasswordSessionService()
      : new AppPasswordSessionService(
          repositories.appPasswordSessionRepository,
        );

    // App Password Processor
    const appPasswordProcessor = useMockAuth
      ? new FakeAtpAppPasswordProcessor()
      : new AtpAppPasswordProcessor(appPasswordSessionService);

    // OAuth Processor
    const oauthProcessor = useMockAuth
      ? new FakeAtProtoOAuthProcessor()
      : new AtProtoOAuthProcessor(nodeOauthClient);

    // User Authentication Service
    const userAuthService = useMockAuth
      ? new FakeUserAuthenticationService(repositories.userRepository)
      : new UserAuthenticationService(repositories.userRepository);

    // ATProto Agent Service
    const atProtoAgentService = useMockAuth
      ? new FakeAgentService()
      : new ATProtoAgentService(nodeOauthClient, appPasswordSessionService);

    const metadataService = new IFramelyMetadataService(
      configService.getIFramelyApiKey(),
    );

    // Profile Service
    const profileService = useMockAuth
      ? new FakeBlueskyProfileService()
      : new BlueskyProfileService(atProtoAgentService);

    const useFakePublishers = process.env.USE_FAKE_PUBLISHERS === 'true';

    const collectionPublisher = useFakePublishers
      ? new FakeCollectionPublisher()
      : new ATProtoCollectionPublisher(atProtoAgentService);

    const cardPublisher = useFakePublishers
      ? new FakeCardPublisher()
      : new ATProtoCardPublisher(atProtoAgentService);

    const cardLibraryService = new CardLibraryService(
      repositories.cardRepository,
      cardPublisher,
    );
    const cardCollectionService = new CardCollectionService(
      repositories.collectionRepository,
      collectionPublisher,
    );

    const authMiddleware = new AuthMiddleware(tokenService);

    return {
      tokenService,
      nodeOauthClient,
      oauthProcessor,
      appPasswordProcessor,
      userAuthService,
      atProtoAgentService,
      metadataService,
      profileService,
      collectionPublisher,
      cardPublisher,
      cardLibraryService,
      cardCollectionService,
      authMiddleware,
    };
  }
}
