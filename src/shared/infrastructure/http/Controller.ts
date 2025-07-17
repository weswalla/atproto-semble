import { Response } from 'express';

export abstract class Controller {
  protected abstract executeImpl(req: any, res: Response): Promise<any>;

  public async execute(req: any, res: Response): Promise<void> {
    try {
      await this.executeImpl(req, res);
    } catch (err) {
      console.log(`[Controller]: Uncaught controller error`);
      console.log(err);
      this.fail(res, 'An unexpected error occurred');
    }
  }

  public static jsonResponse(res: Response, code: number, message: string) {
    return res.status(code).json({ message });
  }

  public ok<T>(res: Response, dto?: T) {
    if (dto) {
      return res.status(200).json(dto);
    } else {
      return res.sendStatus(200);
    }
  }

  public created<T>(res: Response, dto?: T) {
    if (dto) {
      return res.status(201).json(dto);
    } else {
      return res.sendStatus(201);
    }
  }

  public badRequest(res: Response, message?: string) {
    return Controller.jsonResponse(res, 400, message || 'Bad request');
  }

  public unauthorized(res: Response, message?: string) {
    return Controller.jsonResponse(res, 401, message || 'Unauthorized');
  }

  public forbidden(res: Response, message?: string) {
    return Controller.jsonResponse(res, 403, message || 'Forbidden');
  }

  public notFound(res: Response, message?: string) {
    return Controller.jsonResponse(res, 404, message || 'Not found');
  }

  public conflict(res: Response, message?: string) {
    return Controller.jsonResponse(res, 409, message || 'Conflict');
  }

  public tooMany(res: Response, message?: string) {
    return Controller.jsonResponse(res, 429, message || 'Too many requests');
  }

  public fail(res: Response, error: Error | string) {
    console.log(error);
    return res.status(500).json({
      message: error.toString(),
    });
  }
}
