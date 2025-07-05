import { DatabaseFactory } from "../../database/DatabaseFactory";
import { EnvironmentConfigService } from "../../config/EnvironmentConfigService";
import { DrizzleUserRepository } from "../../../../modules/user/infrastructure/repositories/DrizzleUserRepository";
import { DrizzleTokenRepository } from "../../../../modules/user/infrastructure/repositories/DrizzleTokenRepository";
import { DrizzleCardRepository } from "../../../../modules/cards/infrastructure/repositories/DrizzleCardRepository";
import { DrizzleCardQueryRepository } from "../../../../modules/cards/infrastructure/repositories/DrizzleCardQueryRepository";
import { DrizzleCollectionRepository } from "../../../../modules/cards/infrastructure/repositories/DrizzleCollectionRepository";
import { DrizzleCollectionQueryRepository } from "../../../../modules/cards/infrastructure/repositories/DrizzleCollectionQueryRepository";
import { DrizzleAppPasswordSessionRepository } from "src/modules/atproto/infrastructure/repositories/DrizzleAppPasswordSessionRepository";

export interface Repositories {
  userRepository: DrizzleUserRepository;
  tokenRepository: DrizzleTokenRepository;
  cardRepository: DrizzleCardRepository;
  cardQueryRepository: DrizzleCardQueryRepository;
  collectionRepository: DrizzleCollectionRepository;
  collectionQueryRepository: DrizzleCollectionQueryRepository;
  appPasswordSessionRepository: DrizzleAppPasswordSessionRepository;
}

export class RepositoryFactory {
  static create(configService: EnvironmentConfigService): Repositories {
    const db = DatabaseFactory.createConnection(
      configService.getDatabaseConfig()
    );

    return {
      userRepository: new DrizzleUserRepository(db),
      tokenRepository: new DrizzleTokenRepository(db),
      cardRepository: new DrizzleCardRepository(db),
      cardQueryRepository: new DrizzleCardQueryRepository(db),
      collectionRepository: new DrizzleCollectionRepository(db),
      collectionQueryRepository: new DrizzleCollectionQueryRepository(db),
      appPasswordSessionRepository: new DrizzleAppPasswordSessionRepository(db),
    };
  }
}
