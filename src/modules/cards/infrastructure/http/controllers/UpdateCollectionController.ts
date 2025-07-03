import { Controller } from "../../../../../shared/infrastructure/http/Controller";
import { Response } from "express";
import { UpdateCollectionUseCase } from "../../../application/useCases/commands/UpdateCollectionUseCase";
import { AuthenticatedRequest } from "../../../../../shared/infrastructure/http/middleware/AuthMiddleware";

export class UpdateCollectionController extends Controller {
  constructor(private updateCollectionUseCase: UpdateCollectionUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { collectionId } = req.params;
      const { name, description } = req.body;
      const curatorId = req.did;
      
      if (!curatorId) {
        return this.unauthorized(res);
      }

      if (!collectionId) {
        return this.badRequest(res, "Collection ID is required");
      }

      if (!name) {
        return this.badRequest(res, "Collection name is required");
      }

      const result = await this.updateCollectionUseCase.execute({
        collectionId,
        name,
        description,
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
