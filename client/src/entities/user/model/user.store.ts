import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { User } from "./user.type";

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        setUser: (user) => set({ user }, false, "user/setUser"),
        clearUser: () => set({ user: null }, false, "user/clearUser"),
      }),
      {
        name: "user-store",
      },
    ),
    { name: "user-store" },
  ),
);
