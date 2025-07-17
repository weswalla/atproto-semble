import { AtpAgent, Agent } from '@atproto/api';
import { NodeOAuthClient } from '@atproto/oauth-client-node';
import { Result, ok, err } from 'src/shared/core/Result';
import { IAgentService } from '../../application/IAgentService';
import { DID } from '../../domain/DID';
import { AppPasswordSessionService } from './AppPasswordSessionService';

export class ATProtoAgentService implements IAgentService {
  constructor(
    private readonly oauthClient: NodeOAuthClient,
    private readonly appPasswordSessionService: AppPasswordSessionService,
  ) {}
  getUnauthenticatedAgent(): Result<Agent, Error> {
    return ok(
      new Agent({
        service: 'https://bsky.social',
      }),
    );
  }
  async getAuthenticatedAgent(did: DID): Promise<Result<Agent, Error>> {
    const oauthAgentResult =
      await this.getAuthenticatedAgentByOAuthSession(did);
    if (oauthAgentResult.isErr()) {
      // If OAuth session fails, try App Password session
      const appPasswordAgentResult =
        await this.getAuthenticatedAgentByAppPasswordSession(did);
      if (appPasswordAgentResult.isErr()) {
        return err(
          new Error(
            `Failed to get authenticated agent: ${oauthAgentResult.error.message} | ${appPasswordAgentResult.error.message}`,
          ),
        );
      }
      return appPasswordAgentResult;
    }
    return oauthAgentResult;
  }
  async getAuthenticatedAgentByOAuthSession(
    did: DID,
  ): Promise<Result<Agent, Error>> {
    try {
      // Try to restore the session for the DID
      const oauthSession = await this.oauthClient.restore(did.value);

      // If we have a session, create and return an Agent
      if (oauthSession) {
        return ok(new Agent(oauthSession));
      }

      // No session found
      throw new Error('No session found for the provided DID');
    } catch (error) {
      return err(
        new Error(
          `Failed to get authenticated agent by OAuth session: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    }
  }
  async getAuthenticatedAgentByAppPasswordSession(
    did: DID,
  ): Promise<Result<Agent, Error>> {
    try {
      // Try to restore the session for the DID
      const appPasswordSessionResult =
        await this.appPasswordSessionService.getSession(did.value);

      if (appPasswordSessionResult.isErr()) {
        return err(
          new Error(
            `Failed to get App Password session: ${appPasswordSessionResult.error.message}`,
          ),
        );
      }
      const session = appPasswordSessionResult.value;
      if (session) {
        // Create an Agent with the session
        const agent = new AtpAgent({
          service: 'https://bsky.social',
        });

        // Resume the session
        await agent.resumeSession(session);

        // Return the authenticated agent
        return ok(agent);
      }

      // No session found
      throw new Error('No session found for the provided DID');
    } catch (error) {
      return err(
        new Error(
          `Failed to get authenticated agent by App Password session: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    }
  }
}
