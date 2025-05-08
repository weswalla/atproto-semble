import { Request, Response, NextFunction } from "express";
import { ITokenService } from "../../../../modules/user/application/services/ITokenService";

export interface AuthenticatedRequest extends Request {
  did?: string;
}

export class AuthMiddleware {
  constructor(private tokenService: ITokenService) {}

  public ensureAuthenticated() {
    return async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          res.status(401).json({ message: "No access token provided" });
          return; // Stop execution after sending a response
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Validate token
        const didResult = await this.tokenService.validateToken(token);

        if (didResult.isErr() || !didResult.value) {
          res.status(403).json({ message: "Invalid or expired token" });
          return; // Stop execution after sending a response
        }

        // Attach user DID to request for use in controllers
        req.did = didResult.value;

        // Continue to the next middleware or controller
        next();
      } catch (error) {
        res.status(500).json({ message: "Authentication error" });
      }
    };
  }

  public optionalAuth() {
    return async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => {
      try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          // No token, but that's okay - continue without authentication
          return next();
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Validate token
        const didResult = await this.tokenService.validateToken(token);

        if (didResult.isOk() && didResult.value) {
          // Attach user DID to request for use in controllers
          req.did = didResult.value;
        }

        // Continue to the controller regardless of token validity
        next();
      } catch (error) {
        // Continue without authentication in case of error
        next();
      }
    };
  }
}
