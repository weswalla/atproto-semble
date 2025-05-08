import { chromium, Browser, Page } from "playwright";
import express from "express";
import { Server } from "http";
import path from "path";
import dotenv from "dotenv";
import { AtProtoOAuthProcessor } from "../../infrastructure/services/AtProtoOAuthProcessor";
import { InitiateOAuthSignInUseCase } from "../../application/use-cases/InitiateOAuthSignInUseCase";
import { CompleteOAuthSignInUseCase } from "../../application/use-cases/CompleteOAuthSignInUseCase";
import { OAuthClientFactory } from "../../infrastructure/services/OAuthClientFactory";
import { InMemoryUserRepository } from "../infrastructure/InMemoryUserRepository";
import { InMemoryTokenService } from "../infrastructure/InMemoryTokenService";
import { InMemoryUserAuthenticationService } from "../infrastructure/InMemoryUserAuthenticationService";

// Load environment variables
dotenv.config();

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
    const tokenService = new InMemoryTokenService();
    const userAuthService = new InMemoryUserAuthenticationService();

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
      const { code, state } = req.query;

      if (!code || !state) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Use the CompleteOAuthSignInUseCase to process the callback
      const result = await completeOAuthSignInUseCase.execute({
        code: code as string,
        state: state as string,
      });

      if (result.isErr()) {
        return res.status(400).json({ error: result.error.message });
      }

      // Return the tokens
      res.json({
        message: "Authentication successful",
        tokens: result.value
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

  it("should allow manual testing of the OAuth sign-in flow", async () => {
    // Navigate to our test page
    await page.goto(`${BASE_URL}/oauth-test.html`);

    // The rest of the test will be performed manually
    console.log(`
      Manual Test Instructions:
      1. Enter your Bluesky handle in the input field
      2. Click "Sign in with Bluesky"
      3. You will be redirected to the Bluesky OAuth page
      4. Complete the authentication process
      5. You will be redirected back to our test page
      6. Verify that the callback parameters are displayed
      
      The browser will stay open for 5 minutes to allow manual testing.
      Press Ctrl+C to end the test early.
    `);

    // Wait for manual testing (the test will timeout after the jest timeout)
    await new Promise((resolve) => setTimeout(resolve, 4.5 * 60 * 1000));
  });
});
