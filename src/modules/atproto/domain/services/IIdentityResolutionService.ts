import { Result } from 'src/shared/core/Result';
import { DID } from '../DID';
import { DIDOrHandle } from '../DIDOrHandle';

export interface IIdentityResolutionService {
  resolveToDID(identifier: DIDOrHandle): Promise<Result<DID>>;
}
