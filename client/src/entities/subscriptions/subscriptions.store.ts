import axios from "axios";
import { create } from "zustand";

type Subscription = {
  name: string;
};

interface SubscriptionsState {
  data: Subscription[] | null;
  isLoading: boolean;
  error: string | null;
  fetchSubscriptions: () => Promise<void>;
}

export const useSubscriptionsStore = create<SubscriptionsState>((set) => ({
  data: null,
  isLoading: false,
  error: null,

  fetchSubscriptions: async () => {
    set({ isLoading: true, error: null });

    try {
      const subs = await axios.get(
        "http://localhost:25001/api/v1/subscriptions/",
        {
          withCredentials: true,
        },
      );
      return subs.data;
    } catch (error) {
      console.log(error);
    }
  },
}));
