import {
  NodeOAuthClient,
  OAuthClientMetadataInput,
} from "@atproto/oauth-client-node";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DrizzleStateStore } from "./DrizzleStateStore";
import { DrizzleSessionStore } from "./DrizzleSessionStore";
import { InMemoryStateStore } from "../../tests/infrastructure/InMemoryStateStore";
import { InMemorySessionStore } from "../../tests/infrastructure/InMemorySessionStore";
import { configService } from "src/shared/infrastructure/config";

export class OAuthClientFactory {
  static getClientMetadata(
    baseUrl: string,
    appName: string = "Annotation App"
  ): { clientMetadata: OAuthClientMetadataInput } {
    const url = baseUrl || "http://127.0.0.1:3000";
    const enc = encodeURIComponent;
    const isLocal = configService.get().environment === "local";

    return {
      clientMetadata: {
        client_name: appName,
        client_id: !isLocal
          ? `${url}/client-metadata.json`
          : `http://localhost?redirect_uri=${enc(`${url}/api/users/oauth/callback`)}&scope=${enc("atproto transition:generic")}`,
        client_uri: url,
        redirect_uris: [`${url}/api/users/oauth/callback`],
        scope: "atproto transition:generic",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        application_type: "web",
        token_endpoint_auth_method: "none",
        dpop_bound_access_tokens: true,
      },
    };
  }

  static createClient(
    db: PostgresJsDatabase,
    baseUrl: string,
    appName: string = "Annotation App"
  ): NodeOAuthClient {
    const { clientMetadata } = this.getClientMetadata(baseUrl, appName);
    const stateStore = new DrizzleStateStore(db);
    const sessionStore = new DrizzleSessionStore(db);

    return new NodeOAuthClient({
      clientMetadata,
      stateStore,
      sessionStore,
    });
  }

  static createInMemoryClient(
    baseUrl: string,
    appName: string = "Annotation App"
  ): NodeOAuthClient {
    const { clientMetadata } = this.getClientMetadata(baseUrl, appName);
    const stateStore = new InMemoryStateStore();
    const sessionStore = new InMemorySessionStore();

    return new NodeOAuthClient({
      clientMetadata,
      stateStore,
      sessionStore,
    });
  }
}
