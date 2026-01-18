import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, AuthResponse } from './api';

interface User {
  id: string;
  email: string;
  createdAt: string;
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled';
  subscriptionEnd: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isApiMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Check if API server is available
async function checkApiAvailable(): Promise<boolean> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApiMode, setIsApiMode] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const init = async () => {
      const apiAvailable = await checkApiAvailable();
      setIsApiMode(apiAvailable);

      if (apiAvailable && api.getToken()) {
        try {
          const { user } = await api.getMe();
          setUser(user);
        } catch {
          // Token expired or invalid
          api.logout();
        }
      }
      setIsLoading(false);
    };

    init();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!isApiMode) {
      throw new Error('API server not available');
    }

    const { user } = await api.login(email, password);
    setUser(user);
  }, [isApiMode]);

  const register = useCallback(async (email: string, password: string) => {
    if (!isApiMode) {
      throw new Error('API server not available');
    }

    const { user } = await api.register(email, password);
    setUser(user);
  }, [isApiMode]);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (isApiMode && api.getToken()) {
      try {
        const { user } = await api.getMe();
        setUser(user);
      } catch {
        logout();
      }
    }
  }, [isApiMode, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isApiMode,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
