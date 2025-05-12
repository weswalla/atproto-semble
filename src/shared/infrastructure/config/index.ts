import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Database configuration
export const databaseConfig = {
  url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/myapp',
};

// Server configuration
export const serverConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
};

// JWT configuration
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'default-secret',
  accessTokenExpiresIn: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '3600', 10), // 1 hour
  refreshTokenExpiresIn: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '2592000', 10), // 30 days
};

// OAuth configuration
export const oauthConfig = {
  callbackUrl: process.env.OAUTH_CALLBACK_URL || 'http://127.0.0.1:3000',
};
