import { ok, Result, err } from 'src/shared/core/Result';
import { IAppPasswordProcessor } from '../../application/IAppPasswordProcessor';
import { AuthResult } from 'src/modules/user/application/services/IOAuthProcessor';

export class FakeAtpAppPasswordProcessor implements IAppPasswordProcessor {
  async processAppPassword(
    identifier: string,
    appPassword: string,
  ): Promise<Result<AuthResult>> {
    try {
      // Use mock data from environment variables
      const mockDid = process.env.BSKY_DID || 'did:plc:mock123';
      const mockHandle = process.env.BSKY_HANDLE || 'mock.bsky.social';

      // Simulate successful authentication with any identifier/password
      return ok({
        did: mockDid,
        handle: mockHandle,
      });
    } catch (error: any) {
      return err(error);
    }
  }
}
