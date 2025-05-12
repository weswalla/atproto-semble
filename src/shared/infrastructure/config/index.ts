import dotenv from "dotenv";
import path from "path";
import { EnvironmentConfigService } from "./EnvironmentConfigService";

// Load environment variables from the appropriate .env file
const envFile = `.env.${process.env.NODE_ENV || "local"}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Fallback to regular .env if specific file doesn't exist
dotenv.config();

// Create and export the config service instance
export const configService = new EnvironmentConfigService();

// For backward compatibility
export const databaseConfig = configService.getDatabaseConfig();
export const serverConfig = configService.getServerConfig();
export const jwtConfig = configService.getAuthConfig();
export const oauthConfig = {
  callbackUrl: configService.getAtProtoConfig().redirectUri,
};
