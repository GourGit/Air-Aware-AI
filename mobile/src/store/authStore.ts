import { create } from 'zustand';
import { useChatStore } from './chatStore';

export interface MobileUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: MobileUser | null;
  token: string | null;
  setAuth: (user: MobileUser, token: string) => void;
  logout: () => void;
}

export const useMobileAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
  logout: () => {
    // Clear conversation messages so subsequent accounts cannot read previous user chat
    useChatStore.getState().clearMessages();
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
