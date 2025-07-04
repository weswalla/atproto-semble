import { AuthResult } from "src/modules/user/application/services/IOAuthProcessor";
import { Result } from "src/shared/core/Result";

export interface IAppPasswordProcessor {
  processAppPassword(
    identifier: string,
    appPassword: string
  ): Promise<Result<AuthResult>>;
}
