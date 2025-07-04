import { ok, Result } from "src/shared/core/Result";
import { IAppPasswordProcessor } from "../../application/IAppPasswordProcessor";
import { AuthResult } from "src/modules/user/application/services/IOAuthProcessor";
import { IAppPasswordSessionService } from "../../application/IAppPasswordSessionService";

export class AtpAppPasswordProcessor implements IAppPasswordProcessor {
  constructor(private readonly sessionService: IAppPasswordSessionService) {}
  async processAppPassword(
    identifier: string,
    appPassword: string
  ): Promise<Result<AuthResult>> {
    const result = await this.sessionService.createSession(
      identifier,
      appPassword
    );
    if (result.isErr()) {
      return result;
    }
    return ok({
      did: result.value.did,
      handle: result.value.handle,
    });
  }
}
