import { AtpSessionData } from "@atproto/api";
import { Result } from "src/shared/core/Result";

export interface IAppPasswordSessionService {
  getSession(did: string): Promise<Result<AtpSessionData>>;
  createSession(
    identifier: string,
    appPassword: string
  ): Promise<Result<AtpSessionData>>;
}
