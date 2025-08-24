import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface NotificationStore {
  message: string;
  isOpen: boolean;
  show: (message: string) => void;
  hide: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set) => ({
      message: "",
      isOpen: false,
      show: (message: string) =>
        set({ isOpen: true, message }, false, "notification/show"),
      hide: () =>
        set({ isOpen: false, message: "" }, false, "notification/hide"),
    }),
    {
      name: "notification-store",
    },
  ),
);
