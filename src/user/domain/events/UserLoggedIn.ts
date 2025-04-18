import { DID } from '../value-objects/DID';

export const USER_LOGGED_IN_EVENT = 'user.logged.in';

export class UserLoggedInEvent {
  readonly $type = USER_LOGGED_IN_EVENT;
  constructor(
    public readonly userId: DID,
    public readonly loginAt: Date,
  ) {}
}
