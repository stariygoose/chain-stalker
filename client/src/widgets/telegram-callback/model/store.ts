import { create } from "zustand";

interface JwtTokenState {
  accessExpiresAt: number | null;
  refreshExpiresAt: number | null;
  setTokensExpirationTime: (
    accessExpiresAt: number,
    refreshExpiresAt: number,
  ) => void;
  resetTokensExpirationTime: () => void;
}

export const useJwtTokensStore = create<JwtTokenState>((set) => ({
  accessExpiresAt: null,
  refreshExpiresAt: null,
  setTokensExpirationTime: (aExp: number, rExp: number) => {
    set({ accessExpiresAt: aExp, refreshExpiresAt: rExp });
  },
  resetTokensExpirationTime: () => {
    set({ accessExpiresAt: null, refreshExpiresAt: null });
  },
}));
