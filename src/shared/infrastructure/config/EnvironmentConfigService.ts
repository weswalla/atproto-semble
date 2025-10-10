export interface EnvironmentConfig {
  environment: 'local' | 'dev' | 'prod';
  database: {
    url: string;
  };
  auth: {
    jwtSecret: string;
    accessTokenExpiresIn: number;
    refreshTokenExpiresIn: number;
  };
  atproto: {
    serviceEndpoint: string;
    baseUrl: string;
    collections: {
      card: string;
      collection: string;
      collectionLink: string;
    };
  };
  server: {
    port: number;
    host: string;
  };
  app: {
    appUrl: string;
  };
  iframely: {
    apiKey: string;
  };
  workers: {
    redisUrl: string;
    redisConfig: {
      host: string;
      port: number;
      password?: string;
      maxRetriesPerRequest: number | null; // Disable automatic retries
    };
  };
}

export class EnvironmentConfigService {
  private config: EnvironmentConfig;

  constructor() {
    const environment = (process.env.NODE_ENV || 'local') as
      | 'local'
      | 'dev'
      | 'prod';

    this.config = {
      environment,
      database: {
        url:
          process.env.DATABASE_URL ||
          'postgres://postgres:postgres@localhost:5432/annotations',
      },
      auth: {
        jwtSecret:
          process.env.JWT_SECRET || 'default-secret-change-in-production',
        accessTokenExpiresIn: parseInt(
          process.env.ACCESS_TOKEN_EXPIRES_IN || '3600',
        ),
        refreshTokenExpiresIn: parseInt(
          process.env.REFRESH_TOKEN_EXPIRES_IN || '2592000',
        ),
      },
      atproto: {
        serviceEndpoint:
          process.env.ATPROTO_SERVICE_ENDPOINT || 'https://bsky.social',
        baseUrl: process.env.BASE_URL || 'http://127.0.0.1:3000',
        collections: {
          card:
            environment === 'prod'
              ? 'network.cosmik.card'
              : `network.cosmik.${environment}.card`,
          collection:
            environment === 'prod'
              ? 'network.cosmik.collection'
              : `network.cosmik.${environment}.collection`,
          collectionLink:
            environment === 'prod'
              ? 'network.cosmik.collectionLink'
              : `network.cosmik.${environment}.collectionLink`,
        },
      },
      server: {
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || '127.0.0.1',
      },
      app: {
        appUrl: process.env.APP_URL || 'http://localhost:4000',
      },
      iframely: {
        apiKey: process.env.IFRAMELY_API_KEY || '',
      },
      workers: {
        redisConfig: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined,
          maxRetriesPerRequest: null, // Disable automatic retries
        },
        redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    };

    this.applyEnvironmentSpecificConfig();
  }

  private applyEnvironmentSpecificConfig(): void {
    switch (this.config.environment) {
      case 'dev':
        // Override defaults with dev-specific values
        break;
      case 'prod':
        // Override defaults with production-specific values
        if (
          this.config.auth.jwtSecret === 'default-secret-change-in-production'
        ) {
          throw new Error('JWT secret must be set in production environment');
        }
        break;
      case 'local':
      default:
        // Local development defaults are already set
        break;
    }
  }

  public get(): EnvironmentConfig {
    return this.config;
  }

  public getDatabaseConfig() {
    return this.config.database;
  }

  public getAuthConfig() {
    return this.config.auth;
  }

  public getAtProtoConfig() {
    return this.config.atproto;
  }

  public getAtProtoCollections() {
    return this.config.atproto.collections;
  }

  public getServerConfig() {
    return this.config.server;
  }
  public getAppConfig() {
    return this.config.app;
  }

  public getIFramelyApiKey(): string {
    return this.config.iframely.apiKey;
  }
  public getWorkersConfig() {
    return this.config.workers;
  }
}
