import { RuntimeLock } from '@atproto/oauth-client-node';

export interface ILockService {
  createRequestLock(): RuntimeLock;
}
