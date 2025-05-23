import { Controller } from "../../../../../shared/infrastructure/http/Controller";
import { Request, Response } from "express";
import { CompleteOAuthSignInUseCase } from "../../../application/use-cases/CompleteOAuthSignInUseCase";

export class CompleteOAuthSignInController extends Controller {
  constructor(private completeOAuthSignInUseCase: CompleteOAuthSignInUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<any> {
    try {
      const { code, state, iss } = req.query;

      if (!code || !state || !iss) {
        return this.badRequest(res, "Missing required parameters");
      }

      const result = await this.completeOAuthSignInUseCase.execute({
        code: code as string,
        state: state as string,
        iss: iss as string,
      });

      if (result.isErr()) {
        // Instead of returning JSON, redirect with error
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(result.error.message)}`);
      }

      // Redirect back to frontend with tokens in URL parameters
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/complete?accessToken=${encodeURIComponent(result.value.accessToken)}&refreshToken=${encodeURIComponent(result.value.refreshToken)}`
      );
    } catch (error: any) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(error.message || 'Unknown error')}`);
    }
  }
}
