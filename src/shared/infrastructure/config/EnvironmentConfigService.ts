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
    redirectUri: string;
    baseUrl: string;
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
        redirectUri:
          process.env.ATPROTO_REDIRECT_URI ||
          'http://127.0.0.1:3000/api/users/oauth/callback',
      },
      server: {
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || '127.0.0.1',
      },
      app: {
        appUrl: process.env.APP_URL || 'http://127.0.0.1:4000',
      },
      iframely: {
        apiKey: process.env.IFRAMELY_API_KEY || '',
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

  public getServerConfig() {
    return this.config.server;
  }
  public getAppConfig() {
    return this.config.app;
  }

  public getIFramelyApiKey(): string {
    return this.config.iframely.apiKey;
  }
}
