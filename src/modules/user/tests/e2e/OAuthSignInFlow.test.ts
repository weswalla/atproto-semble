import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import express from 'express';
import { Server } from 'http';
import path from 'path';

describe('OAuth Sign-In Flow', () => {
  let browser: Browser;
  let page: Page;
  let server: Server;
  const PORT = 3001;
  const BASE_URL = `http://localhost:${PORT}`;

  beforeAll(async () => {
    // Start a simple express server to serve our test page
    const app = express();
    app.use(express.static(path.join(__dirname, 'public')));
    
    // Mock API endpoints for testing
    app.get('/api/user/login', (req, res) => {
      const handle = req.query.handle;
      if (!handle) {
        return res.status(400).json({ error: 'Handle is required' });
      }
      // In a real test, this would redirect to the Bluesky OAuth page
      // For testing, we'll just return a mock auth URL
      res.json({ 
        authUrl: `https://bsky.app/oauth?handle=${handle}&redirect=${encodeURIComponent(`${BASE_URL}/api/user/oauth/callback`)}` 
      });
    });

    app.get('/api/user/oauth/callback', (req, res) => {
      const { code, state } = req.query;
      if (!code || !state) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      // Mock successful authentication
      res.json({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600
      });
    });

    server = app.listen(PORT);

    // Launch browser
    browser = await chromium.launch({ headless: false }); // Set to true for headless mode
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
    server.close();
  });

  it('should complete the OAuth sign-in flow', async () => {
    // Navigate to our test page
    await page.goto(`${BASE_URL}/oauth-test.html`);
    
    // Fill in the handle
    await page.fill('#handle-input', 'test.bsky.social');
    
    // Click the sign-in button
    await page.click('#sign-in-button');
    
    // Wait for the auth URL to be displayed (in a real test, this would navigate to Bluesky)
    await page.waitForSelector('#auth-url');
    const authUrl = await page.$eval('#auth-url', el => el.textContent);
    expect(authUrl).toContain('bsky.app/oauth');
    
    // In a real test, we would now be on the Bluesky login page
    // For our mock test, we'll simulate the callback by directly calling our endpoint
    
    // Click the simulate callback button
    await page.click('#simulate-callback');
    
    // Wait for the token response
    await page.waitForSelector('#token-response');
    const tokenResponse = await page.$eval('#token-response', el => el.textContent);
    expect(tokenResponse).toContain('mock-access-token');
  });
});
