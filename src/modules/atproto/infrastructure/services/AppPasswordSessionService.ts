import { err, ok, Result } from "src/shared/core/Result";
import { IAppPasswordSessionRepository } from "../repositories/IAppPasswordSessionRepository";
import { AtpAgent, AtpSessionData } from "@atproto/api";
import { IAppPasswordSessionService } from "../../application/IAppPasswordSessionService";

export class AppPasswordSessionService implements IAppPasswordSessionService {
  constructor(
    private readonly appPasswordSessionRepository: IAppPasswordSessionRepository
  ) {}
  async getSession(did: string): Promise<Result<AtpSessionData>> {
    const sessionResult =
      await this.appPasswordSessionRepository.getSession(did);
    if (sessionResult.isErr()) {
      return err(sessionResult.error);
    }
    const agent = new AtpAgent({
      service: "https://bsky.social",
    });

    const sessionWithAppPassword = sessionResult.value;
    if (!sessionWithAppPassword) {
      return err(new Error(`No session found for DID: ${did}`));
    }
    try {
      await agent.resumeSession(sessionResult.value.session);
      const session = agent.session;
      if (!session) {
        return err(new Error(`Failed to resume session for DID: ${did}`));
      }
      return ok(session);
    } catch (error) {
      try {
        await agent.login({
          identifier: sessionWithAppPassword.session.did,
          password: sessionWithAppPassword.appPassword,
        });
        const updatedSession = agent.session;
        if (!updatedSession) {
          return err(
            new Error(`Failed to login with app password for DID: ${did}`)
          );
        }
        const saveResult = await this.appPasswordSessionRepository.saveSession(
          did,
          {
            session: updatedSession,
            appPassword: sessionWithAppPassword.appPassword,
          }
        );
        if (saveResult.isErr()) {
          return err(
            new Error(
              `Failed to save session after login for DID: ${did}, error: ${saveResult.error.message}`
            )
          );
        }
        return ok(updatedSession);
      } catch (error) {
        return err(
          new Error(
            `Failed to login with app password for DID: ${did}, error: ${
              error instanceof Error ? error.message : String(error)
            }`
          )
        );
      }
    }
  }
  async createSession(
    identifier: string,
    appPassword: string
  ): Promise<Result<AtpSessionData>> {
    const agent = new AtpAgent({
      service: "https://bsky.social",
    });

    try {
      await agent.login({
        identifier,
        password: appPassword,
      });
      const session = agent.session;
      if (!session) {
        return err(
          new Error(`Failed to create session for identifier: ${identifier}`)
        );
      }
      const saveResult = await this.appPasswordSessionRepository.saveSession(
        session.did,
        { session, appPassword }
      );
      if (saveResult.isErr()) {
        return err(
          new Error(
            `Failed to save session after login for identifier: ${identifier}, error: ${saveResult.error.message}`
          )
        );
      }
      return ok(session);
    } catch (error) {
      return err(
        new Error(
          `Failed to create session for identifier: ${identifier}, error: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      );
    }
  }
}
