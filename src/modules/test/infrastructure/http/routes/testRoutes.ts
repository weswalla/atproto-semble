import { Router, Request, Response } from 'express';

export const createTestRoutes = (router: Router) => {
  // Simple ping/pong endpoint for performance testing
  router.get('/ping', (req: Request, res: Response) => {
    res.json({ message: 'pong' });
  });

  return router;
};
