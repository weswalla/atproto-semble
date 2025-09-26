import { Result, ok, err } from 'src/shared/core/Result';
import { IIdentityResolutionService } from 'src/modules/atproto/domain/services/IIdentityResolutionService';
import { DID } from 'src/modules/atproto/domain/DID';
import { DIDOrHandle } from 'src/modules/atproto/domain/DIDOrHandle';

export class FakeIdentityResolutionService
  implements IIdentityResolutionService
{
  private handleToDIDMap: Map<string, string> = new Map();
  private shouldFail = false;

  async resolveToDID(identifier: DIDOrHandle): Promise<Result<DID>> {
    if (this.shouldFail) {
      return err(new Error('Identity resolution service failed'));
    }

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

      // Check if we have a mapping for this handle
      const mappedDID = this.handleToDIDMap.get(handle.value);
      if (!mappedDID) {
        return err(new Error(`Handle not found: ${handle.value}`));
      }

      // Create and return the DID
      const didResult = DID.create(mappedDID);
      if (didResult.isErr()) {
        return err(
          new Error(`Invalid DID in mapping: ${didResult.error.message}`),
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

  // Test helper methods
  addHandleMapping(handle: string, did: string): void {
    this.handleToDIDMap.set(handle, did);
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  clear(): void {
    this.handleToDIDMap.clear();
    this.shouldFail = false;
  }
}
