import {
  NodeOAuthClient,
  OAuthClientMetadataInput,
} from "@atproto/oauth-client-node";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DrizzleStateStore } from "./DrizzleStateStore";
import { DrizzleSessionStore } from "./DrizzleSessionStore";
import { InMemoryStateStore } from "../../tests/infrastructure/InMemoryStateStore";
import { InMemorySessionStore } from "../../tests/infrastructure/InMemorySessionStore";

export class OAuthClientFactory {
  static getClientMetadata(
    baseUrl: string,
    appName: string = "Annotation App"
  ): { clientMetadata: OAuthClientMetadataInput } {
    const publicUrl = process.env.PUBLIC_URL;
    const url = baseUrl || "http://127.0.0.1:3000";
    const enc = encodeURIComponent;

    return {
      clientMetadata: {
        client_name: appName,
        client_id: publicUrl
          ? `${url}/client-metadata.json`
          : `http://localhost?redirect_uri=${enc(`${url}/oauth/callback`)}&scope=${enc("atproto transition:generic")}`,
        client_uri: url,
        redirect_uris: [`${url}/oauth/callback`],
        scope: "atproto transition:generic",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        application_type: "web",
        token_endpoint_auth_method: "none",
        dpop_bound_access_tokens: true,
      },
    };
  }

  static async createClient(
    db: PostgresJsDatabase,
    baseUrl: string,
    appName: string = "Annotation App"
  ): Promise<NodeOAuthClient> {
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
