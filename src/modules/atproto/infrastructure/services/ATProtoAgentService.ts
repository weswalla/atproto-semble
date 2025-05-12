import { Agent } from "@atproto/api";
import { NodeOAuthClient } from "@atproto/oauth-client-node";
import { Result, ok, err } from "src/shared/core/Result";
import { IAgentService } from "../../application/IAgentService";
import { DID } from "../../domain/DID";

export class ATProtoAgentService implements IAgentService {
  constructor(private readonly oauthClient: NodeOAuthClient) {}

  async getAuthenticatedAgent(did: DID): Promise<Result<Agent, Error>> {
    try {
      // Try to restore the session for the DID
      const oauthSession = await this.oauthClient.restore(did.value);

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
