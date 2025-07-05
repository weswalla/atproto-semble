import { AtpSessionData } from "@atproto/api";
import { Result } from "src/shared/core/Result";

export type SessionWithAppPassword = {
  session: AtpSessionData;
  appPassword: string;
};
export interface IAppPasswordSessionRepository {
  saveSession(
    did: string,
    session: SessionWithAppPassword
  ): Promise<Result<void>>;

  getSession(did: string): Promise<Result<SessionWithAppPassword | null>>;
}
