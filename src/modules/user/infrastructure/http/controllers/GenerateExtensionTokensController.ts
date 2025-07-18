import { Controller } from '../../../../../shared/infrastructure/http/Controller';
import { Response } from 'express';
import { AuthenticatedRequest } from '../../../../../shared/infrastructure/http/middleware/AuthMiddleware';
import { GenerateExtensionTokensUseCase } from '../../../application/use-cases/GenerateExtensionTokensUseCase';
import { configService } from 'src/shared/infrastructure/config';

export class GenerateExtensionTokensController extends Controller {
  constructor(private generateExtensionTokensUseCase: GenerateExtensionTokensUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const userDid = req.did;
      const extensionId = configService.getExtensionConfig().extensionId;

      if (!userDid) {
        return this.unauthorized(res, 'User not authenticated');
      }

      if (!extensionId) {
        return this.badRequest(res, 'Extension ID not configured');
      }

      const result = await this.generateExtensionTokensUseCase.execute({
        userDid,
      });

      if (result.isErr()) {
        return this.fail(res, result.error.message);
      }

      // Redirect to chrome extension with tokens
      const redirectUrl = `chrome-extension://${extensionId}/options.html#accessToken=${encodeURIComponent(result.value.accessToken)}&refreshToken=${encodeURIComponent(result.value.refreshToken)}`;
      
      return res.redirect(redirectUrl);
    } catch (error: any) {
      return this.fail(res, error.message || 'Unknown error');
    }
  }
}
