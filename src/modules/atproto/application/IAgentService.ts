import { Result } from "src/shared/core/Result";
import { DID } from "../domain/DID";
import { Agent } from "@atproto/api";

export interface IAgentService {
  getAuthenticatedAgent(did: DID): Promise<Result<Agent, Error>>;
}
