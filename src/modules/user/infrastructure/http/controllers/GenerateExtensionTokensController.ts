import { Controller } from '../../../../../shared/infrastructure/http/Controller';
import { Response } from 'express';
import { AuthenticatedRequest } from '../../../../../shared/infrastructure/http/middleware/AuthMiddleware';
import { GenerateExtensionTokensUseCase } from '../../../application/use-cases/GenerateExtensionTokensUseCase';
import { configService } from 'src/shared/infrastructure/config';

export class GenerateExtensionTokensController extends Controller {
  constructor(
    private generateExtensionTokensUseCase: GenerateExtensionTokensUseCase,
  ) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const userDid = req.did;

      if (!userDid) {
        return this.unauthorized(res, 'User not authenticated');
      }

      const result = await this.generateExtensionTokensUseCase.execute({
        userDid,
      });

      if (result.isErr()) {
        const errorMessage =
          result.error instanceof Error
            ? result.error.message
            : 'Failed to generate extension tokens';
        return this.fail(res, errorMessage);
      }

      return this.ok(res, result.value);
    } catch (error: any) {
      return this.fail(res, error.message || 'Unknown error');
    }
  }
}
