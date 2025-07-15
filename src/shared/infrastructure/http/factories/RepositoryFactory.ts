import { DatabaseFactory } from "../../database/DatabaseFactory";
import { EnvironmentConfigService } from "../../config/EnvironmentConfigService";
import { DrizzleUserRepository } from "../../../../modules/user/infrastructure/repositories/DrizzleUserRepository";
import { DrizzleTokenRepository } from "../../../../modules/user/infrastructure/repositories/DrizzleTokenRepository";
import { DrizzleCardRepository } from "../../../../modules/cards/infrastructure/repositories/DrizzleCardRepository";
import { DrizzleCardQueryRepository } from "../../../../modules/cards/infrastructure/repositories/DrizzleCardQueryRepository";
import { DrizzleCollectionRepository } from "../../../../modules/cards/infrastructure/repositories/DrizzleCollectionRepository";
import { DrizzleCollectionQueryRepository } from "../../../../modules/cards/infrastructure/repositories/DrizzleCollectionQueryRepository";
import { DrizzleAppPasswordSessionRepository } from "src/modules/atproto/infrastructure/repositories/DrizzleAppPasswordSessionRepository";
import { InMemoryCardRepository } from "../../../../modules/cards/tests/utils/InMemoryCardRepository";
import { InMemoryCardQueryRepository } from "../../../../modules/cards/tests/utils/InMemoryCardQueryRepository";
import { InMemoryCollectionRepository } from "../../../../modules/cards/tests/utils/InMemoryCollectionRepository";
import { InMemoryCollectionQueryRepository } from "../../../../modules/cards/tests/utils/InMemoryCollectionQueryRepository";

export interface Repositories {
  userRepository: DrizzleUserRepository;
  tokenRepository: DrizzleTokenRepository;
  cardRepository: DrizzleCardRepository | InMemoryCardRepository;
  cardQueryRepository: DrizzleCardQueryRepository | InMemoryCardQueryRepository;
  collectionRepository: DrizzleCollectionRepository | InMemoryCollectionRepository;
  collectionQueryRepository: DrizzleCollectionQueryRepository | InMemoryCollectionQueryRepository;
  appPasswordSessionRepository: DrizzleAppPasswordSessionRepository;
}

export class RepositoryFactory {
  static create(configService: EnvironmentConfigService): Repositories {
    const useMockRepos = process.env.USE_MOCK_REPOS === 'true';

    if (useMockRepos) {
      // Create in-memory repositories
      const cardRepository = new InMemoryCardRepository();
      const collectionRepository = new InMemoryCollectionRepository();
      const cardQueryRepository = new InMemoryCardQueryRepository(cardRepository, collectionRepository);
      const collectionQueryRepository = new InMemoryCollectionQueryRepository(collectionRepository);

      const db = DatabaseFactory.createConnection(
        configService.getDatabaseConfig()
      );

      return {
        userRepository: new DrizzleUserRepository(db),
        tokenRepository: new DrizzleTokenRepository(db),
        cardRepository,
        cardQueryRepository,
        collectionRepository,
        collectionQueryRepository,
        appPasswordSessionRepository: new DrizzleAppPasswordSessionRepository(db),
      };
    }

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
