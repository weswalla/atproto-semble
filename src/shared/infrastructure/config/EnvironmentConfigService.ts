export interface EnvironmentConfig {
  environment: 'local' | 'dev' | 'prod';
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
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
  };
  server: {
    port: number;
    host: string;
  };
}

export class EnvironmentConfigService {
  private config: EnvironmentConfig;

  constructor() {
    const environment = (process.env.NODE_ENV || 'local') as 'local' | 'dev' | 'prod';

    this.config = {
      environment,
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'annotations',
        url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/annotations',
      },
      auth: {
        jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
        accessTokenExpiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN || '3600'),
        refreshTokenExpiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN || '2592000'),
      },
      atproto: {
        serviceEndpoint: process.env.ATPROTO_SERVICE_ENDPOINT || 'https://bsky.social',
        redirectUri: process.env.ATPROTO_REDIRECT_URI || 'http://localhost:3000/api/users/oauth/callback',
      },
      server: {
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || '127.0.0.1',
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
        if (this.config.auth.jwtSecret === 'default-secret-change-in-production') {
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
}
