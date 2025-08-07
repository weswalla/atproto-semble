import { chromium, Browser, Page } from 'playwright';
import express from 'express';
import { Server } from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { config } from 'dotenv';
import { AtProtoOAuthProcessor } from '../../../atproto/infrastructure/services/AtProtoOAuthProcessor';
import { InitiateOAuthSignInUseCase } from '../../application/use-cases/InitiateOAuthSignInUseCase';
import { CompleteOAuthSignInUseCase } from '../../application/use-cases/CompleteOAuthSignInUseCase';
import { OAuthClientFactory } from '../../infrastructure/services/OAuthClientFactory';
import { InMemoryUserRepository } from '../infrastructure/InMemoryUserRepository';
import {
  JwtTokenService,
  UserAuthenticationService,
} from '../../infrastructure';
import { InMemoryTokenRepository } from '../infrastructure/InMemoryTokenRepository';

// Load environment variables
dotenv.config();
// Load test environment variables
config({ path: '.env.test' });

// Get test credentials from environment
const TEST_HANDLE = process.env.TEST_BLUESKY_HANDLE;
const TEST_PASSWORD = process.env.TEST_BLUESKY_PASSWORD;

if (!TEST_HANDLE || !TEST_PASSWORD) {
  console.error(
    'TEST_BLUESKY_HANDLE and TEST_BLUESKY_PASSWORD must be set in .env.test',
  );
  process.exit(1);
}

describe('OAuth Sign-In Flow', () => {
  let browser: Browser;
  let page: Page;
  let server: Server;
  const PORT = 3001;
  const BASE_URL = `http://127.0.0.1:${PORT}`;

  // This test requires manual interaction
  // Set a longer timeout for manual testing
  jest.setTimeout(5 * 60 * 1000); // 5 minutes
  let oauthTokens: any = null;

  beforeAll(async () => {
    // Create OAuth client using the factory with in-memory stores
    const oauthClient = OAuthClientFactory.createInMemoryClient(
      `${BASE_URL}/api/user`,
      'Annos Test App',
    );

    // Create OAuth processor with the client
    const oauthProcessor = new AtProtoOAuthProcessor(oauthClient);

    // Create in-memory services
    const userRepository = new InMemoryUserRepository();
    const tokenRepository = new InMemoryTokenRepository();
    const tokenService = new JwtTokenService(tokenRepository, 'test-secret');
    const userAuthService = new UserAuthenticationService(userRepository);

    // Create use cases
    const initiateOAuthSignInUseCase = new InitiateOAuthSignInUseCase(
      oauthProcessor,
    );

    const completeOAuthSignInUseCase = new CompleteOAuthSignInUseCase(
      oauthProcessor,
      tokenService,
      userRepository,
      userAuthService,
    );

    // Start a simple express server to serve our test page
    const app = express();
    app.use(express.static(path.join(__dirname, 'public')));

    // Real API endpoints using our actual implementations
    app.get('/api/user/login', async (req, res) => {
      const handle = req.query.handle;

      const result = await initiateOAuthSignInUseCase.execute({
        handle: handle as string | undefined,
      });

      if (result.isErr()) {
        res.status(400).json({ error: result.error });
      }

      res.json({ authUrl: result.unwrap().authUrl });
    });

    // Store tokens globally so we can access them in the test

    app.get('/api/user/oauth/callback', async (req, res) => {
      const { code, state, iss } = req.query;

      if (!code || !state || !iss) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
      }

      // Use the CompleteOAuthSignInUseCase to process the callback
      const result = await completeOAuthSignInUseCase.execute({
        code: code as string,
        state: state as string,
        iss: iss as string,
      });

      if (result.isErr()) {
        res.status(400).json({ error: result.error });
        return;
      }

      // Store tokens for test verification
      oauthTokens = result.unwrap();

      // Return the tokens
      res.json({
        message: 'Authentication successful',
        tokens: oauthTokens,
        testComplete: true,
      });
    });

    server = app.listen(PORT);

    // Launch browser
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
    server.close();
  });

  it('should complete the OAuth sign-in flow automatically', async () => {
    // Navigate to our test page
    await page.goto(`${BASE_URL}/oauth-test.html`);

    // Enter the Bluesky handle from environment variables
    await page.fill('#handle-input', TEST_HANDLE);

    // Click the login button
    await page.click('#login-button');

    // Wait for navigation to the Bluesky OAuth page
    await page.waitForNavigation();

    // We should now be on the Bluesky login page
    // Wait for the login form to be fully loaded
    await page.waitForLoadState('networkidle');

    // The page is a React app, so we need to wait for elements to be available
    // Only wait for password field since the identifier is pre-filled
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });

    // Enter password (identifier is already filled)
    await page.fill('input[type="password"]', TEST_PASSWORD);

    // Click the login/authorize button - using a more specific selector
    // In React apps, sometimes we need to wait a bit after filling inputs
    await page.waitForTimeout(1000);

    // Find and click the submit button
    try {
      // Take a screenshot before clicking to help with debugging
      await page.screenshot({ path: 'before-login-click.png' });

      // Try different possible selectors for the submit button
      const buttonSelectors = [
        'button[type="submit"]',
        'button:has-text("Sign in")',
        'button:has-text("Continue")',
        'button:has-text("Authorize")',
        'button.primary',
        'button[aria-label="Sign in"]',
        'form button',
        // More specific selectors based on the HTML structure
        'div > button',
        'form > div > button',
      ];

      let buttonClicked = false;
      for (const selector of buttonSelectors) {
        const button = await page.$(selector);
        if (button) {
          // Check if button is visible and enabled
          const isVisible = await button.isVisible();
          if (isVisible) {
            await button.click();
            console.log(`Clicked button with selector: ${selector}`);
            buttonClicked = true;
            break;
          }
        }
      }

      if (!buttonClicked) {
        console.log(
          'No button found with standard selectors, trying JavaScript click',
        );
        // Try clicking any button that looks like a submit button using JavaScript
        await page.evaluate(() => {
          // @ts-ignore
          const buttons = Array.from(document.querySelectorAll('button'));
          const loginButton = buttons.find(
            (button: any) =>
              button.innerText.includes('Sign in') ||
              button.innerText.includes('Continue') ||
              button.innerText.includes('Log in') ||
              button.innerText.includes('Authorize'),
          );
          // @ts-ignore
          if (loginButton) loginButton.click();
        });
      }
    } catch (error) {
      console.error('Failed to find or click the submit button:', error);
      // Take a screenshot to debug
      await page.screenshot({ path: 'login-page-debug.png' });
      throw error;
    }

    // Wait for redirect back to our callback page
    // Use a more robust approach to handle potential redirects
    try {
      // Wait for any navigation to complete
      await page.waitForNavigation({ timeout: 1000 }).catch((e) => {
        console.log('Initial navigation timeout, continuing...');
      });

      // Take a screenshot after login attempt
      await page.screenshot({ path: 'after-login-click.png' });

      // Check if we're on the right page
      const currentUrl = page.url();
      console.log(`Current page URL: ${currentUrl}`);

      // If we're not on our callback page yet, we might need to authorize
      if (!currentUrl.includes('127.0.0.1:3001')) {
        console.log(
          'Not yet redirected to callback, looking for authorize button...',
        );

        // Wait a shorter time for page transitions
        await page.waitForTimeout(500);

        // Take another screenshot to see the current state
        await page.screenshot({ path: 'authorize-page.png' });

        // Wait for the authorization page to fully load, but with shorter timeouts
        await page.waitForLoadState('networkidle', { timeout: 5000 });
        await page.waitForTimeout(1000); // Give React app time to render

        // Try to find and click an authorize button if present
        const authorizeSelectors = [
          'button:has-text("Authorize")',
          'button:has-text("Allow")',
          'button:has-text("Continue")',
          'button.authorize',
          'button[aria-label="Authorize"]',
          // More generic selectors
          'button.primary',
          'form button',
        ];

        let buttonClicked = false;
        for (const selector of authorizeSelectors) {
          try {
            const button = await page.$(selector);
            if (button && (await button.isVisible())) {
              await button.click();
              console.log(
                `Clicked authorize button with selector: ${selector}`,
              );
              buttonClicked = true;
              await page.waitForNavigation({ timeout: 1000 }).catch((e) => {
                console.log('Navigation after authorize click timed out');
              });
              break;
            }
          } catch (e) {
            console.log(`Error with selector ${selector}:`, e);
          }
        }

        if (!buttonClicked) {
          console.log(
            'No standard authorize button found, trying JavaScript click',
          );
          // Try clicking any button that looks like an authorize button using JavaScript
          await page.evaluate(() => {
            // @ts-ignore
            const buttons = Array.from(document.querySelectorAll('button'));
            const authorizeButton = buttons.find(
              (button: any) =>
                button.innerText.includes('Authorize') ||
                button.innerText.includes('Allow') ||
                button.innerText.includes('Continue'),
            );
            // @ts-ignore
            if (authorizeButton) authorizeButton.click();
          });

          await page.waitForNavigation({ timeout: 1000 }).catch((e) => {
            console.log('Navigation after JS authorize click timed out');
          });
        }
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Take a screenshot to debug
      await page.screenshot({ path: 'navigation-debug.png' });
      throw error;
    }

    // Wait for the test-complete element to appear, which signals the callback was processed
    console.log('Waiting for OAuth flow to complete...');

    try {
      // Wait for the test-complete element that's added when the callback is successful
      await page.waitForSelector('#test-complete', { timeout: 10000 });
      console.log('Test complete element found, OAuth flow completed!');

      // Take a final screenshot
      await page.screenshot({ path: 'final-callback-page.png' });

      // Close the browser early since we're done
      await browser.close();

      // Verify that we received tokens in the global variable
      expect(oauthTokens).toBeTruthy();
      expect(oauthTokens).toHaveProperty('accessToken');
      expect(oauthTokens).toHaveProperty('refreshToken');

      console.log('OAuth flow completed successfully!');
    } catch (error) {
      console.error('Error waiting for test completion:', error);
      await page.screenshot({ path: 'test-completion-error.png' });
      throw error;
    }
  });
});
