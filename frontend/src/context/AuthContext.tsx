import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse, UserRole } from '../types/auth';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync user profile if tokens exist in local storage on startup
  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = api.getAccessToken();
      const refreshToken = api.getRefreshToken();

      if (accessToken && refreshToken) {
        try {
          const profile = await api.get<User>('/users/me');
          setUser(profile);
          setIsAuthenticated(true);
        } catch (error) {
          console.warn('Initial session validation failed. Resetting credentials.', error);
          api.clearTokens();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();

    // Set up interceptor event listener for session expirations
    const handleSessionExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
      api.clearTokens();
    };

    window.addEventListener('auth-session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth-session-expired', handleSessionExpired);
    };
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    setIsLoading(true);
    try {
      // API requires application/x-www-form-urlencoded format for standard OAuth2 flow
      const formData = new URLSearchParams();
      formData.append('username', usernameOrEmail);
      formData.append('password', password);

      const response = await fetch('/api/v1/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        let errMsg = 'Login failed';
        try {
          const errBody = await response.json();
          errMsg = errBody.detail || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const data: AuthResponse = await response.json();
      api.setTokens(data.access_token, data.refresh_token);
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      await api.post<User>('/auth/register', { username, email, password, role });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.clearTokens();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
