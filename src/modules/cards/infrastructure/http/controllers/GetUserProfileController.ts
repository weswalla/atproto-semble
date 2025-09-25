import { Controller } from '../../../../../shared/infrastructure/http/Controller';
import { Request, Response } from 'express';
import { GetProfileUseCase } from '../../../application/useCases/queries/GetMyProfileUseCase';

export class GetUserProfileController extends Controller {
  constructor(private getProfileUseCase: GetProfileUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<any> {
    try {
      const { did } = req.params;

      if (!did) {
        return this.fail(res, 'DID is required');
      }

      const result = await this.getProfileUseCase.execute({ userId: did });

      if (result.isErr()) {
        return this.fail(res, result.error as any);
      }

      return this.ok(res, result.value);
    } catch (error: any) {
      return this.fail(res, error);
    }
  }
}
