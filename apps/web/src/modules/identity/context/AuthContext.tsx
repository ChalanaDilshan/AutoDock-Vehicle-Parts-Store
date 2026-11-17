import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, UserProfile } from '../api/identityApi.js';

export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'accessToken';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      if (response && response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.warn('Failed to fetch user profile, clearing session:', error);
      sessionStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = sessionStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        setToken(storedToken);
        await refreshProfile();
      }
      setIsLoading(false);
    };

    initAuth();
  }, [refreshProfile]);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      if (response.success && response.data) {
        const { accessToken, user: authUser } = response.data;
        sessionStorage.setItem(TOKEN_KEY, accessToken);
        setToken(accessToken);
        // Hydrate full user profile
        try {
          const profileResponse = await authApi.getMe();
          if (profileResponse.success && profileResponse.data) {
            setUser(profileResponse.data);
          } else {
            // Fallback to basic user from login response
            setUser({
              id: authUser.id,
              email: authUser.email,
              firstName: authUser.firstName,
              lastName: authUser.lastName,
              phone: '',
              role: authUser.role,
              accountStatus: 'ACTIVE',
              isEmailVerified: true,
              sellerId: authUser.sellerId,
            });
          }
        } catch {
          setUser({
            id: authUser.id,
            email: authUser.email,
            firstName: authUser.firstName,
            lastName: authUser.lastName,
            phone: '',
            role: authUser.role,
            accountStatus: 'ACTIVE',
            isEmailVerified: true,
            sellerId: authUser.sellerId,
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => {
    setIsLoading(true);
    try {
      await authApi.register(data);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout API call error:', err);
    } finally {
      sessionStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
