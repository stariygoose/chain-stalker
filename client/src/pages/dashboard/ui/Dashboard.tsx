import { useSubscriptionsStore } from "@/entities/subscriptions/subscriptions.store";
import { DashboardWidget } from "@/widgets/dashboard";
import { useEffect } from "react";

export const DashboardPage = () => {
  const { fetchSubscriptions } = useSubscriptionsStore();
  useEffect(() => {
    fetchSubscriptions().then(() => console.log("DONE"));
  }, []);
  return <DashboardWidget />;
};
