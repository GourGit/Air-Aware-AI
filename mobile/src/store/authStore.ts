import { create } from 'zustand';

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
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));
