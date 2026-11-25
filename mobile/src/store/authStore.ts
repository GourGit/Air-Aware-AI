import { create } from 'zustand';
import { useChatStore } from './chatStore';
import * as SecureStore from 'expo-secure-store';

export interface MobileUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: MobileUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: MobileUser, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

const ACCESS_TOKEN_KEY = 'airaware_access_token';
const REFRESH_TOKEN_KEY = 'airaware_refresh_token';
const USER_KEY = 'airaware_user';

export const useMobileAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,

  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ user, accessToken, refreshToken, isAuthenticated: true });
    useChatStore.getState().clearMessages();
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  logout: async () => {
    useChatStore.getState().clearMessages();
    await get().clearAuth();
  },

  restoreSession: async () => {
    try {
      const [accessToken, refreshToken, userStr] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      if (accessToken && refreshToken && userStr) {
        const user = JSON.parse(userStr) as MobileUser;
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      }
    } catch (err) {
      console.warn('Failed to restore session:', err);
      await get().clearAuth();
    }
  },
}));