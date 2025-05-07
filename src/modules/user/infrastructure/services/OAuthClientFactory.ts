import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { NodeOAuthClient } from "@atproto/oauth-client-node";
import { DrizzleStateStore } from "./DrizzleStateStore";
import { DrizzleSessionStore } from "./DrizzleSessionStore";

export class OAuthClientFactory {
  static async createClient(
    db: PostgresJsDatabase,
    baseUrl: string,
    appName: string = "Annotation App"
  ): Promise<NodeOAuthClient> {
    const url = baseUrl || "http://localhost:3000";
    const enc = encodeURIComponent;
    
    return new NodeOAuthClient({
      clientMetadata: {
        client_name: appName,
        client_id: `${url}/client-metadata.json`,
        client_uri: url,
        redirect_uris: [`${url}/oauth/callback`],
        scope: "atproto transition:generic",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        application_type: "web",
        token_endpoint_auth_method: "none",
        dpop_bound_access_tokens: true,
      },
      stateStore: new DrizzleStateStore(db),
      sessionStore: new DrizzleSessionStore(db),
    });
  }
}
