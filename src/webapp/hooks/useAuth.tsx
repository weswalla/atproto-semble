"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/api";
import { getAccessToken, getRefreshToken, clearAuth } from "@/services/auth";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: any | null;
  login: (handle: string) => Promise<{ authUrl: string }>;
  completeOAuth: (code: string, state: string, iss: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const router = useRouter();

  // Helper function to check if a JWT token is expired
  const isTokenExpired = (token: string): boolean => {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expiry;
    } catch (e) {
      return true;
    }
  };

  const refreshTokens = useCallback(async (): Promise<boolean> => {
    if (!refreshToken) return false;

    try {
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await authService.refreshToken(refreshToken);

      // Store tokens
      localStorage.setItem("accessToken", newAccessToken);
      localStorage.setItem("refreshToken", newRefreshToken);

      // Update state
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      handleLogout();
      return false;
    }
  }, [refreshToken]);
  useEffect(() => {
    // Check if user is already authenticated
    const storedAccessToken = getAccessToken();
    const storedRefreshToken = getRefreshToken();

    if (storedAccessToken) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setIsAuthenticated(true);

      // Check if token is expired
      if (isTokenExpired(storedAccessToken) && storedRefreshToken) {
        // Try to refresh the token
        refreshTokens()
          .then((success) => {
            if (success) {
              // Token refreshed, now fetch user data with new token
              return authService.getCurrentUser(getAccessToken() || "");
            }
            throw new Error("Token refresh failed");
          })
          .then((userData) => {
            setUser(userData);
          })
          .catch((error) => {
            console.error(
              "Error refreshing token or fetching user data:",
              error
            );
            handleLogout();
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        // Token is still valid, fetch user data
        authService
          .getCurrentUser(storedAccessToken)
          .then((userData) => {
            setUser(userData);
          })
          .catch((error) => {
            console.error("Error fetching user data:", error);
            // If token is invalid, log out
            handleLogout();
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    } else {
      setIsLoading(false);
    }
  }, [refreshTokens]);

  // Set up automatic token refresh
  useEffect(() => {
    if (!accessToken || !refreshToken) return;

    const checkTokenExpiration = async () => {
      if (isTokenExpired(accessToken)) {
        await refreshTokens();
      }
    };

    // Check token expiration every minute
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [accessToken, refreshToken, refreshTokens]);

  const login = async (handle: string) => {
    try {
      return await authService.initiateLogin(handle);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const completeOAuth = async (code: string, state: string, iss: string) => {
    try {
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await authService.completeOAuth(code, state, iss);

      // Store tokens (using auth service)
      localStorage.setItem("accessToken", newAccessToken);
      localStorage.setItem("refreshToken", newRefreshToken);

      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setIsAuthenticated(true);

      // Fetch user data
      const userData = await authService.getCurrentUser(newAccessToken);
      setUser(userData);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("OAuth completion error:", error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear auth state
      clearAuth();
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setIsAuthenticated(false);

      // Redirect to login
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        accessToken,
        refreshToken,
        user,
        login,
        completeOAuth,
        logout: handleLogout,
        refreshTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
