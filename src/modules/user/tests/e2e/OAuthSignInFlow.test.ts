import { chromium, Browser, Page } from "playwright";
import express from "express";
import { Server } from "http";
import path from "path";
import dotenv from "dotenv";
import { config } from "dotenv";
import { AtProtoOAuthProcessor } from "../../infrastructure/services/AtProtoOAuthProcessor";
import { InitiateOAuthSignInUseCase } from "../../application/use-cases/InitiateOAuthSignInUseCase";
import { CompleteOAuthSignInUseCase } from "../../application/use-cases/CompleteOAuthSignInUseCase";
import { OAuthClientFactory } from "../../infrastructure/services/OAuthClientFactory";
import { InMemoryUserRepository } from "../infrastructure/InMemoryUserRepository";
import {
  JwtTokenService,
  UserAuthenticationService,
} from "../../infrastructure";
import { InMemoryTokenRepository } from "../infrastructure/InMemoryTokenRepository";

// Load environment variables
dotenv.config();
// Load test environment variables
config({ path: ".env.test" });

// Get test credentials from environment
const TEST_HANDLE = process.env.TEST_BLUESKY_HANDLE;
const TEST_PASSWORD = process.env.TEST_BLUESKY_PASSWORD;

if (!TEST_HANDLE || !TEST_PASSWORD) {
  console.error(
    "TEST_BLUESKY_HANDLE and TEST_BLUESKY_PASSWORD must be set in .env.test"
  );
  process.exit(1);
}

describe("OAuth Sign-In Flow", () => {
  let browser: Browser;
  let page: Page;
  let server: Server;
  const PORT = 3001;
  const BASE_URL = `http://127.0.0.1:${PORT}`;

  // This test requires manual interaction
  // Set a longer timeout for manual testing
  jest.setTimeout(5 * 60 * 1000); // 5 minutes

  beforeAll(async () => {
    // Create OAuth client using the factory with in-memory stores
    const oauthClient = OAuthClientFactory.createInMemoryClient(
      `${BASE_URL}/api/user`,
      "Annos Test App"
    );

    // Create OAuth processor with the client
    const oauthProcessor = new AtProtoOAuthProcessor(oauthClient);

    // Create in-memory services
    const userRepository = new InMemoryUserRepository();
    const tokenRepository = new InMemoryTokenRepository();
    const tokenService = new JwtTokenService(tokenRepository, "test-secret");
    const userAuthService = new UserAuthenticationService(userRepository);

    // Create use cases
    const initiateOAuthSignInUseCase = new InitiateOAuthSignInUseCase(
      oauthProcessor
    );

    const completeOAuthSignInUseCase = new CompleteOAuthSignInUseCase(
      oauthProcessor,
      tokenService,
      userRepository,
      userAuthService
    );

    // Start a simple express server to serve our test page
    const app = express();
    app.use(express.static(path.join(__dirname, "public")));

    // Real API endpoints using our actual implementations
    app.get("/api/user/login", async (req, res) => {
      const handle = req.query.handle;

      const result = await initiateOAuthSignInUseCase.execute({
        handle: handle as string | undefined,
      });

      if (result.isErr()) {
        res.status(400).json({ error: result.error });
      }

      res.json({ authUrl: result.unwrap().authUrl });
    });

    app.get("/api/user/oauth/callback", async (req, res) => {
      const { code, state, iss } = req.query;

      if (!code || !state || !iss) {
        res.status(400).json({ error: "Missing required parameters" });
      }

      // Use the CompleteOAuthSignInUseCase to process the callback
      const result = await completeOAuthSignInUseCase.execute({
        code: code as string,
        state: state as string,
        iss: iss as string,
      });

      if (result.isErr()) {
        res.status(400).json({ error: result.error });
      }

      // Return the tokens
      res.json({
        message: "Authentication successful",
        tokens: result.unwrap(),
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

  it("should complete the OAuth sign-in flow automatically", async () => {
    // Navigate to our test page
    await page.goto(`${BASE_URL}/oauth-test.html`);

    // Enter the Bluesky handle from environment variables
    await page.fill("#handle-input", TEST_HANDLE);

    // Click the login button
    await page.click("#login-button");

    // Wait for navigation to the Bluesky OAuth page
    await page.waitForNavigation();

    // We should now be on the Bluesky login page
    // Wait for the login form to be fully loaded
    await page.waitForLoadState("networkidle");

    // The page is a React app, so we need to wait for elements to be available
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });

    // Enter credentials
    await page.fill('input[type="text"]', TEST_HANDLE);
    await page.fill('input[type="password"]', TEST_PASSWORD);

    // Click the login/authorize button - using a more specific selector
    // In React apps, sometimes we need to wait a bit after filling inputs
    await page.waitForTimeout(1000);

    // Find and click the submit button (could be different selectors)
    try {
      // Try different possible selectors for the submit button
      const buttonSelectors = [
        'button[type="submit"]',
        'button:has-text("Sign in")',
        'button:has-text("Authorize")',
        "button.primary",
        'button[aria-label="Sign in"]',
        "form button",
      ];

      for (const selector of buttonSelectors) {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          console.log(`Clicked button with selector: ${selector}`);
          break;
        }
      }
    } catch (error) {
      console.error("Failed to find or click the submit button:", error);
      // Take a screenshot to debug
      await page.screenshot({ path: "login-page-debug.png" });
      throw error;
    }

    // Wait for redirect back to our callback page
    // Use a more robust approach to handle potential redirects
    try {
      await page.waitForNavigation({ timeout: 30000 });

      // Check if we're on the right page
      const currentUrl = page.url();
      console.log(`Redirected to: ${currentUrl}`);

      if (!currentUrl.includes("127.0.0.1:3001")) {
        // We might need to click an additional authorize button
        console.log(
          "Not yet redirected to callback, looking for authorize button..."
        );

        // Try to find and click an authorize button if present
        const authorizeSelectors = [
          'button:has-text("Authorize")',
          'button:has-text("Allow")',
          "button.authorize",
          'button[aria-label="Authorize"]',
        ];

        for (const selector of authorizeSelectors) {
          const button = await page.$(selector);
          if (button) {
            await button.click();
            console.log(`Clicked authorize button with selector: ${selector}`);
            await page.waitForNavigation({ timeout: 30000 });
            break;
          }
        }
      }
    } catch (error) {
      console.error("Navigation error:", error);
      // Take a screenshot to debug
      await page.screenshot({ path: "navigation-debug.png" });
      throw error;
    }

    // Wait for the callback results to be displayed
    await page.waitForSelector("#callback-container:visible");

    // Verify that we received tokens in the response
    const responseText = await page.textContent("#callback-response");
    const response = JSON.parse(responseText || "{}");

    expect(response).toHaveProperty("tokens");
    expect(response.tokens).toHaveProperty("accessToken");
    expect(response.tokens).toHaveProperty("refreshToken");

    console.log("OAuth flow completed successfully!");
  });
});
