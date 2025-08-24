import { axios } from "@/shared/api/axios";
import type { Subscription } from "../model/subscription.type";

type GetSubscriptionsResponse = {
  userId: number;
  subscriptions: Subscription[];
};

export const subscriptionsApi = {
  getSubscriptions: async () => {
    try {
      const { data } =
        await axios.get<GetSubscriptionsResponse>("/subscriptions");
      return data.subscriptions;
    } catch (e) {
      e as never;
    }
  },
};
