import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "admin" | "analyst";

interface AuthState {
  token: string | null;
  role: Role | null;
  username: string | null;
  login: (token: string, role: Role, username: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      role: null,
      username: null,
      login: (token, role, username) => set({ token, role, username }),
      logout: () => set({ token: null, role: null, username: null }),
      isAdmin: () => get().role === "admin",
    }),
    { name: "sentrix-auth" }
  )
);
