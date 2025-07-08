import { useState } from "react";
import { useExtensionAuth } from "../../hooks/useExtensionAuth";

export function SignInPage() {
  const { loginWithAppPassword, error, isLoading } = useExtensionAuth();
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim() || !password.trim()) return;

    try {
      setIsSubmitting(true);
      await loginWithAppPassword(handle.trim(), password.trim());
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-80 p-4 bg-white">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 p-4 bg-white">
      <div className="border-b pb-3 mb-4">
        <h1 className="text-lg font-semibold text-gray-900">Card Extension</h1>
        <p className="text-sm text-gray-600">Sign in to save content</p>
      </div>
      
      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Handle
          </label>
          <input
            type="text"
            placeholder="user.bsky.social"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            App Password
          </label>
          <input
            type="password"
            placeholder="xxxx-xxxx-xxxx-xxxx"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          />
        </div>
        
        <button
          type="submit"
          disabled={!handle.trim() || !password.trim() || isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
