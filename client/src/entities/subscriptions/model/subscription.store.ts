import { devtools } from "zustand/middleware";
import { create } from "zustand";
import type { Subscription } from "./subscription.type";
import { subscriptionsApi } from "../api/subscription.api";

interface SubscriptionsStore {
  subscriptions: Subscription[];
  setSubscriptions: (subscriptions: Subscription[]) => void;
  fetchSubscriptions: () => void;
}

const useSubscriptionsStore = create<SubscriptionsStore>()(
  devtools(
    (set) => ({
      subscriptions: [],
      setSubscriptions: (subscriptions) =>
        set({ subscriptions }, false, "subscriptions/setSubscriptions"),
      fetchSubscriptions: async () => {
        const subs = await subscriptionsApi.getSubscriptions();
        if (subs) {
          set(
            { subscriptions: subs },
            false,
            "subscriptions/fetchSubscriptions",
          );
        }
      },
    }),
    { name: "subscriptions-store" },
  ),
);

export const useFetchSubscriptions = () =>
  useSubscriptionsStore((state) => state.fetchSubscriptions);
export const useSubscriptions = () =>
  useSubscriptionsStore((state) => state.subscriptions);
