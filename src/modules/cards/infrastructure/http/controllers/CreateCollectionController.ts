import { Controller } from "../../../../../shared/infrastructure/http/Controller";
import { Response } from "express";
import { CreateCollectionUseCase } from "../../../application/useCases/commands/CreateCollectionUseCase";
import { AuthenticatedRequest } from "../../../../../shared/infrastructure/http/middleware/AuthMiddleware";

export class CreateCollectionController extends Controller {
  constructor(private createCollectionUseCase: CreateCollectionUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { name, description } = req.body;
      const curatorId = req.did;
      
      if (!curatorId) {
        return this.unauthorized(res);
      }

      if (!name) {
        return this.badRequest(res, "Collection name is required");
      }

      const result = await this.createCollectionUseCase.execute({
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
