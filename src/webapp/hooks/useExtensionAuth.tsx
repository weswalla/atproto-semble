import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
import { ApiClient } from '@/api-client/ApiClient';
import { createExtensionTokenManager } from '@/services/auth';

interface ExtensionAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  user: any | null;
  loginWithAppPassword: (handle: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const ExtensionAuthContext = createContext<
  ExtensionAuthContextType | undefined
>(undefined);

export const ExtensionAuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createApiClient = useCallback((token: string | null) => {
    return new ApiClient(
      process.env.PLASMO_PUBLIC_API_URL || 'http://127.0.0.1:3000',
      createExtensionTokenManager(),
    );
  }, []);

  // Use chrome.storage instead of localStorage
  const getStoredToken = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['accessToken'], (result) => {
          resolve(result.accessToken || null);
        });
      } else {
        // Fallback to localStorage for development
        resolve(localStorage.getItem('accessToken'));
      }
    });
  }, []);

  const getStoredRefreshToken = useCallback(async (): Promise<
    string | null
  > => {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['refreshToken'], (result) => {
          resolve(result.refreshToken || null);
        });
      } else {
        // Fallback to localStorage for development
        resolve(localStorage.getItem('refreshToken'));
      }
    });
  }, []);

  const setStoredToken = useCallback(async (token: string | null) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      if (token) {
        chrome.storage.local.set({ accessToken: token });
      } else {
        chrome.storage.local.remove(['accessToken']);
      }
    } else {
      // Fallback to localStorage for development
      if (token) {
        localStorage.setItem('accessToken', token);
      } else {
        localStorage.removeItem('accessToken');
      }
    }
  }, []);

  // Helper function to initialize auth state (extracted for reuse)
  const initAuth = useCallback(async () => {
    try {
      const token = await getStoredToken();
      if (token) {
        setAccessToken(token);
        const apiClient = createApiClient(token);
        const userData = await apiClient.getMyProfile();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        // No token found, ensure we're in unauthenticated state
        setAccessToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
      setError(null);
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Token invalid, clear it
      await setStoredToken(null);
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setError('Session expired. Please sign in again.');
    } finally {
      setIsLoading(false);
    }
  }, [getStoredToken, setStoredToken, createApiClient]);

  // Initialize auth state on mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Listen for auth state changes from background script
  useEffect(() => {
    const handleAuthStateChange = (message: any) => {
      if (message.type === 'AUTH_STATE_CHANGED') {
        // Reload auth state from storage when background script notifies us
        initAuth();
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleAuthStateChange);

      return () => {
        chrome.runtime.onMessage.removeListener(handleAuthStateChange);
      };
    }
  }, [initAuth]);

  const loginWithAppPassword = useCallback(
    async (identifier: string, appPassword: string) => {
      try {
        setError(null);
        setIsLoading(true);

        // Use unauthenticated client for login
        const unauthenticatedClient = createApiClient(null);
        const response = await unauthenticatedClient.loginWithAppPassword({
          identifier,
          appPassword,
        });
        const { accessToken: newToken } = response;

        setAccessToken(newToken);
        await setStoredToken(newToken);

        // Create new authenticated client for profile fetch
        const authenticatedClient = createApiClient(newToken);
        const userData = await authenticatedClient.getMyProfile();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error: any) {
        console.error('App password login failed:', error);
        setError(
          error.message || 'Login failed. Please check your credentials.',
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [createApiClient, setStoredToken],
  );

  const logout = useCallback(async () => {
    try {
      // Notify background script to handle logout
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ type: 'LOGOUT' });
      } else {
        // Fallback for development
        setAccessToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setError(null);
        await setStoredToken(null);
        localStorage.removeItem('refreshToken');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [setStoredToken]);

  return (
    <ExtensionAuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        accessToken,
        user,
        loginWithAppPassword,
        logout,
        error,
      }}
    >
      {children}
    </ExtensionAuthContext.Provider>
  );
};

export const useExtensionAuth = () => {
  const context = useContext(ExtensionAuthContext);
  if (!context) {
    throw new Error(
      'useExtensionAuth must be used within ExtensionAuthProvider',
    );
  }
  return context;
};
