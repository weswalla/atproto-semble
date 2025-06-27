import { Controller } from "../../../../../shared/infrastructure/http/Controller";
import { Response } from "express";
import { RemoveCardFromLibraryUseCase } from "../../../application/useCases/commands/RemoveCardFromLibraryUseCase";
import { AuthenticatedRequest } from "../../../../../shared/infrastructure/http/middleware/AuthMiddleware";

export class RemoveCardFromLibraryController extends Controller {
  constructor(private removeCardFromLibraryUseCase: RemoveCardFromLibraryUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { cardId } = req.params;
      const curatorId = req.did;
      
      if (!curatorId) {
        return this.unauthorized(res);
      }

      if (!cardId) {
        return this.badRequest(res, "Card ID is required");
      }

      const result = await this.removeCardFromLibraryUseCase.execute({
        cardId,
        curatorId,
      });

      if (result.isErr()) {
        return this.fail(res, result.error as any);
      }

      return this.ok(res, result.value);
    } catch (error: any) {
      return this.fail(res, error);
    }
  }
}
