"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClient } from "@/api-client/ApiClient";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const [handle, setHandle] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [useAppPassword, setUseAppPassword] = useState(false);
  const router = useRouter();
  const { setTokens } = useAuth();

  // Create API client instance
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
    () => null // No auth token needed for login
  );

  const handleOAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!handle) {
      setError("Please enter your Bluesky handle");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { authUrl } = await apiClient.initiateOAuthSignIn({ handle });

      // Redirect to the auth URL from the API
      window.location.href = authUrl;
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!handle || !appPassword) {
      setError("Please enter both your handle and app password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { accessToken, refreshToken } =
        await apiClient.loginWithAppPassword({
          identifier: handle,
          appPassword: appPassword,
        });

      // Set tokens and redirect to dashboard
      setTokens(accessToken, refreshToken);
      router.push("/library");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col">
        <h1 className="text-4xl font-bold mb-8">Sign in with Bluesky</h1>

        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          {!useAppPassword ? (
            <form onSubmit={handleOAuthSubmit}>
              <div className="mb-6">
                <label
                  htmlFor="handle"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Enter your Bluesky handle
                </label>
                <input
                  type="text"
                  id="handle"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="username.bsky.social"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                />
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </div>

              <Button
                type="submit"
                className="w-full mb-4"
                disabled={isLoading}
              >
                {isLoading ? "Connecting..." : "Continue"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setUseAppPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Sign in with app password
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAppPasswordSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="handle-app"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Bluesky handle
                </label>
                <input
                  type="text"
                  id="handle-app"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="username.bsky.social"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="app-password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  App password
                </label>
                <input
                  type="password"
                  id="app-password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                />
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </div>

              <Button
                type="submit"
                className="w-full mb-4"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setUseAppPassword(false)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Back to OAuth sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
