import { Result, ok, err } from 'src/shared/core/Result';
import { IIdentityResolutionService } from '../../domain/services/IIdentityResolutionService';
import { DID } from '../../domain/DID';
import { DIDOrHandle } from '../../domain/DIDOrHandle';
import { IAgentService } from '../../application/IAgentService';

export class ATProtoIdentityResolutionService implements IIdentityResolutionService {
  constructor(private readonly agentService: IAgentService) {}

  async resolveToDID(identifier: DIDOrHandle): Promise<Result<DID>> {
    try {
      // If it's already a DID, return it directly
      if (identifier.isDID) {
        const did = identifier.getDID();
        if (!did) {
          return err(new Error('Invalid DID in identifier'));
        }
        return ok(did);
      }

      // If it's a handle, resolve it to a DID
      const handle = identifier.getHandle();
      if (!handle) {
        return err(new Error('Invalid handle in identifier'));
      }

      // Get an unauthenticated agent to resolve the handle
      const agentResult = this.agentService.getUnauthenticatedAgent();
      if (agentResult.isErr()) {
        return err(
          new Error(
            `Failed to get agent for handle resolution: ${agentResult.error.message}`,
          ),
        );
      }

      const agent = agentResult.value;

      // Resolve the handle to get the DID
      const profileResult = await agent.resolveHandle({ handle: handle.value });

      if (!profileResult.success) {
        return err(
          new Error(
            `Failed to resolve handle ${handle.value}: ${JSON.stringify(profileResult)}`,
          ),
        );
      }

      // Create and return the DID
      const didResult = DID.create(profileResult.data.did);
      if (didResult.isErr()) {
        return err(
          new Error(
            `Invalid DID returned from handle resolution: ${didResult.error.message}`,
          ),
        );
      }

      return ok(didResult.value);
    } catch (error) {
      return err(
        new Error(
          `Error resolving identifier to DID: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    }
  }
}
