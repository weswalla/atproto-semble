import AtpAgent, { Agent } from "@atproto/api";
import { err, ok, Result } from "src/shared/core/Result";
import { IAgentService } from "../../application/IAgentService";
import { DID } from "../../domain/DID";

export class AppPasswordAgentService implements IAgentService {
  constructor(private readonly props: { did: string; password: string }) {
    this.props = props;
  }
  getUnauthenticatedAgent(): Result<Agent, Error> {
    return ok(
      new AtpAgent({
        service: "https://bsky.social",
      })
    );
  }
  async getAuthenticatedAgent(did: DID): Promise<Result<Agent, Error>> {
    try {
      const agent = new AtpAgent({
        service: "https://bsky.social",
      });

      await agent.login({
        identifier: this.props.did,
        password: this.props.password,
      });

      return ok(agent);
    } catch (error) {
      return err(
        new Error(
          `Failed to get authenticated agent: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      );
    }
  }
}
