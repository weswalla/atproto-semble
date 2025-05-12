import { Agent } from "@atproto/api";
import { NodeOAuthClient } from "@atproto/oauth-client-node";
import { Result, ok, err } from "src/shared/core/Result";

export class ATProtoAgentService {
  constructor(private readonly oauthClient: NodeOAuthClient) {}

  async getAuthenticatedAgent(did: string): Promise<Result<Agent, Error>> {
    try {
      // Try to restore the session for the DID
      const oauthSession = await this.oauthClient.restore(did);

      // If we have a session, create and return an Agent
      if (oauthSession) {
        return ok(new Agent(oauthSession));
      }

      // No session found
      throw new Error("No session found for the provided DID");
    } catch (error) {
      return err(
        new Error(
          `Failed to get authenticated agent: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }
}
