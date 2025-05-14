"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/api";

export default function LoginPage() {
  const [handle, setHandle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!handle) {
      setError("Please enter your Bluesky handle");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Use our client-side API service
      const { authUrl } = await authService.initiateLogin(handle);
      
      // Redirect to the auth URL from the API
      window.location.href = authUrl;
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col">
        <h1 className="text-4xl font-bold mb-8">Sign in with Bluesky</h1>

        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <form onSubmit={handleSubmit}>
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Connecting..." : "Continue"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
