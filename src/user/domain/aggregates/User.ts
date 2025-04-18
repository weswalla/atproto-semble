import { DID } from '../value-objects/DID';
import { Handle } from '../value-objects/Handle';

export interface UserProps {
  id: DID; // User's DID is the primary identifier
  handle: Handle; // User's handle
  linkedAt: Date;
  lastLoginAt: Date;
  // Add other application-specific properties if needed
}

// Properties required to create a new User (typically upon first OAuth link)
export type UserCreateProps = Omit<UserProps, 'lastLoginAt'> & {
  lastLoginAt?: Date; // Optional on creation, defaults to linkedAt
};

/**
 * Represents a user account within this application, linked via OAuth.
 * Aggregate Root for the User Management context.
 */
export class User {
  readonly id: DID;
  readonly handle: Handle;
  readonly linkedAt: Date;
  readonly lastLoginAt: Date;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.handle = props.handle;
    this.linkedAt = props.linkedAt;
    this.lastLoginAt = props.lastLoginAt;
  }

  /**
   * Factory method for creating a new User instance, typically upon first link.
   */
  public static create(props: UserCreateProps): User {
    const now = new Date();
    const userProps: UserProps = {
      ...props,
      linkedAt: props.linkedAt ?? now, // Default linkedAt if not provided
      lastLoginAt: props.lastLoginAt ?? props.linkedAt ?? now, // Default lastLoginAt
    };

    // Add validation if needed (e.g., handle format already done in VO)
    return new User(userProps);
  }

  /**
   * Updates the last login timestamp.
   * Returns a new User instance with the updated timestamp.
   */
  public recordLogin(): User {
    const newProps = { ...this.props, lastLoginAt: new Date() };
    return new User(newProps);
  }

  /**
   * Updates the user's handle.
   * Returns a new User instance with the updated handle.
   */
  public updateHandle(newHandle: Handle): User {
    const newProps = { ...this.props, handle: newHandle };
    return new User(newProps);
  }

  // Helper to get all properties, useful for mappers or internal logic
  private get props(): UserProps {
    return {
      id: this.id,
      handle: this.handle,
      linkedAt: this.linkedAt,
      lastLoginAt: this.lastLoginAt,
    };
  }
}
