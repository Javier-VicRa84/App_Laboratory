import { create } from 'zustand';

export type User = {
  id: number;
  username: string;
  full_name: string;
  role: 'admin' | 'analyst' | 'technician' | 'quality';
};

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
