import express from 'express';
import request from 'supertest';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';
import {
  AuthMiddleware,
  AuthenticatedRequest,
} from '../../../../shared/infrastructure/http/middleware/AuthMiddleware';
import { InMemoryTokenRepository } from 'src/modules/user/tests/infrastructure/InMemoryTokenRepository';

describe('Auth Integration Tests', () => {
  let app: express.Application;
  let tokenService: JwtTokenService;
  let validToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    // Setup
    const mockTokenRepo = new InMemoryTokenRepository();
    tokenService = new JwtTokenService(
      mockTokenRepo,
      'test-secret',
      60, // Short expiry for testing
      300, // Short refresh expiry
    );

    // Generate a valid token for testing
    const tokenResult = await tokenService.generateToken('did:plc:testuser');
    if (tokenResult.isOk()) {
      validToken = tokenResult.value.accessToken;
      refreshToken = tokenResult.value.refreshToken;
    }

    // Create Express app
    app = express();
    app.use(express.json());

    const authMiddleware = new AuthMiddleware(tokenService);

    // Public route
    app.get('/api/public', (req, res) => {
      res.json({ message: 'Public route' });
    });

    // Protected route
    app.get(
      '/api/protected',
      authMiddleware.ensureAuthenticated(),
      (req: AuthenticatedRequest, res) => {
        res.json({ message: 'Protected route', did: req.did });
      },
    );

    // Optional auth route
    app.get(
      '/api/optional',
      authMiddleware.optionalAuth(),
      (req: AuthenticatedRequest, res) => {
        res.json({
          message: 'Optional auth route',
          did: req.did || 'anonymous',
        });
      },
    );

    // Refresh token route
    app.post('/api/refresh', async (req, res) => {
      const result = await tokenService.refreshToken(req.body.refreshToken);
      if (result.isOk() && result.value) {
        res.json(result.value);
      } else {
        res.status(401).json({ message: 'Invalid refresh token' });
      }
    });
  });

  test('Public route should be accessible without token', async () => {
    const response = await request(app).get('/api/public');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Public route');
  });

  test('Protected route should require valid token', async () => {
    // Without token
    const noTokenResponse = await request(app).get('/api/protected');
    expect(noTokenResponse.status).toBe(401);

    // With invalid token
    const invalidTokenResponse = await request(app)
      .get('/api/protected')
      .set('Authorization', 'Bearer invalid_token');
    expect(invalidTokenResponse.status).toBe(403);

    // With valid token
    const validTokenResponse = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${validToken}`);
    expect(validTokenResponse.status).toBe(200);
    expect(validTokenResponse.body.did).toBe('did:plc:testuser');
  });

  test('Optional auth route should work with or without token', async () => {
    // Without token
    const noTokenResponse = await request(app).get('/api/optional');
    expect(noTokenResponse.status).toBe(200);
    expect(noTokenResponse.body.did).toBe('anonymous');

    // With valid token
    const validTokenResponse = await request(app)
      .get('/api/optional')
      .set('Authorization', `Bearer ${validToken}`);
    expect(validTokenResponse.status).toBe(200);
    expect(validTokenResponse.body.did).toBe('did:plc:testuser');
  });

  test('Should be able to refresh token', async () => {
    const response = await request(app)
      .post('/api/refresh')
      .send({ refreshToken });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.expiresIn).toBeDefined();
  });
});
