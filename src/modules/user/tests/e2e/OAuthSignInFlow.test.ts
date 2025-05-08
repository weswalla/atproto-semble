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
    // Enter credentials and authorize
    await page.fill('input[type="text"]', TEST_HANDLE);
    await page.fill('input[type="password"]', TEST_PASSWORD);

    // Click the login/authorize button
    // Note: The actual selector may need to be adjusted based on Bluesky's login page structure
    await page.click('button[type="submit"]');

    // Wait for redirect back to our callback page
    await page.waitForNavigation();

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
