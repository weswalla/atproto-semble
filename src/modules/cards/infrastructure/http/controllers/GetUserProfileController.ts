import { Controller } from '../../../../../shared/infrastructure/http/Controller';
import { Request, Response } from 'express';
import { GetProfileUseCase } from '../../../application/useCases/queries/GetProfileUseCase';
import { DIDOrHandle } from '../../../../atproto/domain/DIDOrHandle';

export class GetUserProfileController extends Controller {
  constructor(private getProfileUseCase: GetProfileUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<any> {
    try {
      const { identifier } = req.params;

      if (!identifier) {
        return this.fail(res, 'Identifier (DID or handle) is required');
      }

      // Validate the identifier as either DID or handle
      const didOrHandleResult = DIDOrHandle.create(identifier);
      if (didOrHandleResult.isErr()) {
        return this.fail(res, `Invalid identifier: ${didOrHandleResult.error.message}`);
      }

      const result = await this.getProfileUseCase.execute({ userId: didOrHandleResult.value });

      if (result.isErr()) {
        return this.fail(res, result.error as any);
      }

      return this.ok(res, result.value);
    } catch (error: any) {
      return this.fail(res, error);
    }
  }
}
