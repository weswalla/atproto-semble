import { AggregateRoot } from "src/shared/domain/AggregateRoot";
import { UniqueEntityID } from "src/shared/domain/UniqueEntityID";
import { Guard, IGuardArgument } from "src/shared/core/Guard";
import { err, ok, Result } from "src/shared/core/Result";
import { DID } from "./value-objects/DID";
import { Handle } from "./value-objects/Handle";
import { UserLinkedEvent } from "./events/UserLinkedEvent";
import { UserLoggedInEvent } from "./events/UserLoggedInEvent";

export interface UserProps {
  did: DID;
  handle?: Handle;
  linkedAt: Date;
  lastLoginAt: Date;
}

export class User extends AggregateRoot<UserProps> {
  get userId(): UniqueEntityID {
    return this._id;
  }

  get did(): DID {
    return this.props.did;
  }

  get handle(): Handle | undefined {
    return this.props.handle;
  }

  get linkedAt(): Date {
    return this.props.linkedAt;
  }

  get lastLoginAt(): Date {
    return this.props.lastLoginAt;
  }

  public updateHandle(handle: Handle): void {
    this.props.handle = handle;
  }

  public recordLogin(): void {
    this.props.lastLoginAt = new Date();
  }

  private constructor(props: UserProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: UserProps, id?: UniqueEntityID): Result<User> {
    const guardArgs: IGuardArgument[] = [
      { argument: props.did, argumentName: "did" },
      { argument: props.linkedAt, argumentName: "linkedAt" },
      { argument: props.lastLoginAt, argumentName: "lastLoginAt" },
    ];

    const guardResult = Guard.againstNullOrUndefinedBulk(guardArgs);

    if (guardResult.isErr()) {
      return err(new Error(guardResult.error));
    }

    const user = new User(props, id);

    return ok(user);
  }

  public static createNew(did: DID, handle?: Handle): Result<User> {
    const now = new Date();

    return User.create({
      did,
      handle,
      linkedAt: now,
      lastLoginAt: now,
    });
  }
}
