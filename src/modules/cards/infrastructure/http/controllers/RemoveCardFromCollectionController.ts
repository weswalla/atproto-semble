import { Controller } from "../../../../../shared/infrastructure/http/Controller";
import { Response } from "express";
import { RemoveCardFromCollectionUseCase } from "../../../application/useCases/commands/RemoveCardFromCollectionUseCase";
import { AuthenticatedRequest } from "../../../../../shared/infrastructure/http/middleware/AuthMiddleware";

export class RemoveCardFromCollectionController extends Controller {
  constructor(private removeCardFromCollectionUseCase: RemoveCardFromCollectionUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { cardId } = req.params;
      const { collectionIds } = req.body;
      const curatorId = req.did;
      
      if (!curatorId) {
        return this.unauthorized(res);
      }

      if (!cardId) {
        return this.badRequest(res, "Card ID is required");
      }

      if (!collectionIds || !Array.isArray(collectionIds)) {
        return this.badRequest(res, "Collection IDs array is required");
      }

      const result = await this.removeCardFromCollectionUseCase.execute({
        cardId,
        collectionIds,
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
