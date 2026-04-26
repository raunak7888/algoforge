import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type SafeUser } from "@algoforge/analysis";

interface AuthState {
  user: SafeUser | null;
  isLoading: boolean;
  setUser: (user: SafeUser | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      clearAuth: () => set({ user: null, isLoading: false }),
    }),
    {
      name: "af-auth-storage",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
