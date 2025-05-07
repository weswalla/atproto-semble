import { DomainService } from "src/shared/domain/DomainService";
import { Result } from "src/shared/core/Result";
import { User } from "../User";
import { DID } from "../value-objects/DID";
import { Handle } from "../value-objects/Handle";

export interface AuthenticationResult {
  user: User;
  isNewUser: boolean;
}

export interface IUserAuthenticationService extends DomainService {
  validateUserCredentials(did: DID, handle?: Handle): Promise<Result<AuthenticationResult>>;
}
