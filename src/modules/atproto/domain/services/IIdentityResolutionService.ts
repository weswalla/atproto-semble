import { Result } from 'src/shared/core/Result';
import { DID } from '../DID';
import { DIDOrHandle } from '../DIDOrHandle';
import { Handle } from '../Handle';

export interface IIdentityResolutionService {
  resolveToDID(identifier: DIDOrHandle): Promise<Result<DID>>;
  resolveToHandle(identifier: DIDOrHandle): Promise<Result<Handle>>;
}
