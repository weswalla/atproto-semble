import { Controller } from "../../../../../shared/infrastructure/http/Controller";
import { Response } from "express";
import { UpdateNoteCardUseCase } from "../../../application/useCases/commands/UpdateNoteCardUseCase";
import { AuthenticatedRequest } from "../../../../../shared/infrastructure/http/middleware/AuthMiddleware";

export class UpdateNoteCardController extends Controller {
  constructor(private updateNoteCardUseCase: UpdateNoteCardUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { cardId } = req.params;
      const { note } = req.body;
      const curatorId = req.did;
      
      if (!curatorId) {
        return this.unauthorized(res);
      }

      if (!cardId) {
        return this.badRequest(res, "Card ID is required");
      }

      if (!note) {
        return this.badRequest(res, "Note text is required");
      }

      const result = await this.updateNoteCardUseCase.execute({
        cardId,
        note,
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
