import { ok, err, Result } from 'src/shared/core/Result';
import { Agent } from '@atproto/api';
import {
  ISpacesClient,
  SpaceRecordRef,
  buildSpaceUri,
} from '../../application/ISpacesClient';
import { IAgentService } from '../../application/IAgentService';
import { DID } from '../../domain/DID';

/**
 * ISpacesClient backed by the com.atproto.space.* / com.atproto.simplespace.*
 * XRPC endpoints. These methods are not part of the generated @atproto/api
 * client, so they go through the untyped XrpcClient.call surface.
 */
export class ATProtoSpacesClient implements ISpacesClient {
  constructor(private readonly agentService: IAgentService) {}

  private async agentFor(did: DID): Promise<Result<Agent, Error>> {
    const agentResult = await this.agentService.getAuthenticatedAgent(did);
    if (agentResult.isErr()) return err(agentResult.error);
    if (!agentResult.value) {
      return err(new Error('No authenticated session found'));
    }
    return ok(agentResult.value);
  }

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  async createSpace(
    owner: DID,
    type: string,
    skey: string,
  ): Promise<Result<{ uri: string }, Error>> {
    try {
      const agent = await this.agentFor(owner);
      if (agent.isErr()) return err(agent.error);
      const res = await agent.value.call(
        'com.atproto.simplespace.createSpace',
        undefined,
        {
          type,
          skey,
          policy: { $type: 'com.atproto.simplespace.defs#memberList' },
          appAccess: { $type: 'com.atproto.simplespace.defs#open' },
        },
        { encoding: 'application/json' },
      );
      const uri =
        (res.data as { uri?: string } | undefined)?.uri ??
        buildSpaceUri(owner.value, type, skey);
      return ok({ uri });
    } catch (error) {
      return err(this.toError(error));
    }
  }

  async spaceExists(
    owner: DID,
    spaceUri: string,
  ): Promise<Result<boolean, Error>> {
    try {
      const agent = await this.agentFor(owner);
      if (agent.isErr()) return err(agent.error);
      await agent.value.call('com.atproto.simplespace.getSpace', {
        space: spaceUri,
      });
      return ok(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/SpaceNotFound|SpaceDeleted|not found/i.test(message)) {
        return ok(false);
      }
      return err(this.toError(error));
    }
  }

  async deleteSpace(
    owner: DID,
    spaceUri: string,
  ): Promise<Result<void, Error>> {
    try {
      const agent = await this.agentFor(owner);
      if (agent.isErr()) return err(agent.error);
      await agent.value.call(
        'com.atproto.simplespace.deleteSpace',
        undefined,
        { space: spaceUri },
        { encoding: 'application/json' },
      );
      return ok(undefined);
    } catch (error) {
      return err(this.toError(error));
    }
  }

  async createRecord(input: {
    space: string;
    repo: DID;
    collection: string;
    record: Record<string, unknown>;
    rkey?: string;
  }): Promise<Result<SpaceRecordRef, Error>> {
    try {
      const agent = await this.agentFor(input.repo);
      if (agent.isErr()) return err(agent.error);
      const res = await agent.value.call(
        'com.atproto.space.createRecord',
        undefined,
        {
          space: input.space,
          repo: input.repo.value,
          collection: input.collection,
          ...(input.rkey ? { rkey: input.rkey } : {}),
          record: input.record,
        },
        { encoding: 'application/json' },
      );
      const data = res.data as { uri: string; cid: string };
      return ok({ uri: data.uri, cid: data.cid });
    } catch (error) {
      return err(this.toError(error));
    }
  }

  async putRecord(input: {
    space: string;
    repo: DID;
    collection: string;
    rkey: string;
    record: Record<string, unknown>;
  }): Promise<Result<SpaceRecordRef, Error>> {
    try {
      const agent = await this.agentFor(input.repo);
      if (agent.isErr()) return err(agent.error);
      const res = await agent.value.call(
        'com.atproto.space.putRecord',
        undefined,
        {
          space: input.space,
          repo: input.repo.value,
          collection: input.collection,
          rkey: input.rkey,
          record: input.record,
        },
        { encoding: 'application/json' },
      );
      const data = res.data as { uri: string; cid: string };
      return ok({ uri: data.uri, cid: data.cid });
    } catch (error) {
      return err(this.toError(error));
    }
  }

  async deleteRecord(input: {
    space: string;
    repo: DID;
    collection: string;
    rkey: string;
  }): Promise<Result<void, Error>> {
    try {
      const agent = await this.agentFor(input.repo);
      if (agent.isErr()) return err(agent.error);
      await agent.value.call(
        'com.atproto.space.deleteRecord',
        undefined,
        {
          space: input.space,
          repo: input.repo.value,
          collection: input.collection,
          rkey: input.rkey,
        },
        { encoding: 'application/json' },
      );
      return ok(undefined);
    } catch (error) {
      return err(this.toError(error));
    }
  }
}
