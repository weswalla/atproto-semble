import { EnvironmentConfigService } from "../../config/EnvironmentConfigService";
import { jwtConfig, oauthConfig } from "../../config";
import { DatabaseFactory } from "../../database/DatabaseFactory";
import { JwtTokenService } from "../../../../modules/user/infrastructure/services/JwtTokenService";
import {
  AtProtoOAuthProcessor,
  OAuthClientFactory,
} from "../../../../modules/user/infrastructure";
import { UserAuthenticationService } from "../../../../modules/user/infrastructure/services/UserAuthenticationService";
import { ATProtoAgentService } from "../../../../modules/atproto/infrastructure/services/ATProtoAgentService";
import { IFramelyMetadataService } from "../../../../modules/cards/infrastructure/IFramelyMetadataService";
import { BlueskyProfileService } from "../../../../modules/atproto/infrastructure/services/BlueskyProfileService";
import { ATProtoCollectionPublisher } from "../../../../modules/atproto/infrastructure/publishers/ATProtoCollectionPublisher";
import { ATProtoCardPublisher } from "../../../../modules/atproto/infrastructure/publishers/ATProtoCardPublisher";
import { CardLibraryService } from "../../../../modules/cards/domain/services/CardLibraryService";
import { CardCollectionService } from "../../../../modules/cards/domain/services/CardCollectionService";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { Repositories } from "./RepositoryFactory";

export interface Services {
  tokenService: JwtTokenService;
  nodeOauthClient: any;
  oauthProcessor: AtProtoOAuthProcessor;
  userAuthService: UserAuthenticationService;
  atProtoAgentService: ATProtoAgentService;
  metadataService: IFramelyMetadataService;
  profileService: BlueskyProfileService;
  collectionPublisher: ATProtoCollectionPublisher;
  cardPublisher: ATProtoCardPublisher;
  cardLibraryService: CardLibraryService;
  cardCollectionService: CardCollectionService;
  authMiddleware: AuthMiddleware;
}

export class ServiceFactory {
  static create(
    configService: EnvironmentConfigService,
    repositories: Repositories
  ): Services {
    const tokenService = new JwtTokenService(
      repositories.tokenRepository,
      jwtConfig.jwtSecret,
      jwtConfig.accessTokenExpiresIn,
      jwtConfig.refreshTokenExpiresIn
    );

    // Get database connection for OAuth client
    const db = DatabaseFactory.createConnection(
      configService.getDatabaseConfig()
    );

    const nodeOauthClient = OAuthClientFactory.createClient(
      db,
      oauthConfig.baseUrl
    );

    const oauthProcessor = new AtProtoOAuthProcessor(nodeOauthClient);
    const userAuthService = new UserAuthenticationService(
      repositories.userRepository
    );
    const atProtoAgentService = new ATProtoAgentService(nodeOauthClient);

    const metadataService = new IFramelyMetadataService(
      configService.getIFramelyApiKey()
    );
    const profileService = new BlueskyProfileService(atProtoAgentService);
    const collectionPublisher = new ATProtoCollectionPublisher(
      atProtoAgentService
    );
    const cardPublisher = new ATProtoCardPublisher(atProtoAgentService);

    const cardLibraryService = new CardLibraryService(
      repositories.cardRepository,
      cardPublisher
    );
    const cardCollectionService = new CardCollectionService(
      repositories.collectionRepository,
      collectionPublisher
    );

    const authMiddleware = new AuthMiddleware(tokenService);

    return {
      tokenService,
      nodeOauthClient,
      oauthProcessor,
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
