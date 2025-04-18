import { DID } from '../value-objects/DID';
import { Handle } from '../value-objects/Handle';

export const USER_ACCOUNT_LINKED_EVENT = 'user.account.linked';

export class UserAccountLinkedEvent {
  readonly $type = USER_ACCOUNT_LINKED_EVENT;
  constructor(
    public readonly userId: DID,
    public readonly handle: Handle,
    public readonly linkedAt: Date,
  ) {}
}
