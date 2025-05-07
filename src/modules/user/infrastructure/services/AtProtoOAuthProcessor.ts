import { NodeOAuthClient, NodeSavedSessionStore, NodeSavedStateStore } from "@atproto/oauth-client-node";
import { Result, err, ok } from "src/shared/core/Result";
import { IOAuthProcessor, AuthResult } from "../../application/services/IOAuthProcessor";
import { OAuthCallbackDTO } from "../../application/dtos/OAuthCallbackDTO";

export class AtProtoOAuthProcessor implements IOAuthProcessor {
  private client: NodeOAuthClient;

  constructor(
    private clientMetadata: {
      client_name: string;
      client_id: string;
      client_uri: string;
      redirect_uris: string[];
      scope: string;
      grant_types: string[];
      response_types: string[];
      application_type: string;
      token_endpoint_auth_method: string;
      dpop_bound_access_tokens: boolean;
    },
    private stateStore: NodeSavedStateStore,
    private sessionStore: NodeSavedSessionStore
  ) {
    this.client = new NodeOAuthClient({
      clientMetadata,
      stateStore,
      sessionStore
    });
  }

  async generateAuthUrl(handle?: string): Promise<Result<string>> {
    try {
      const url = await this.client.authorize(handle, {
        scope: this.clientMetadata.scope
      });
      return ok(url.toString());
    } catch (error) {
      return err(error);
    }
  }

  async processCallback(params: OAuthCallbackDTO): Promise<Result<AuthResult>> {
    try {
      // Convert params to URLSearchParams
      const searchParams = new URLSearchParams();
      searchParams.append("code", params.code);
      searchParams.append("state", params.state);

      const { session } = await this.client.callback(searchParams);
      
      return ok({
        did: session.did,
        handle: session.handle
      });
    } catch (error) {
      return err(error);
    }
  }
}
