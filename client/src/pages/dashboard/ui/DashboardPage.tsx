import { useFetchSubscriptions } from "@/entities/subscriptions";
import { DashboardStats } from "@/widgets/dashboard-stats";
import { DashboardLastAlerts } from "@/widgets/dashboard-last-alerts";
import { useEffect } from "react";

export const DashboardPage = () => {
  const fetchSubscriptions = useFetchSubscriptions();

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return (
    <section className="flex w-full h-full">
      <div className="w-full">
        <h1 className="text-bold text-5xl mb-7">Dashboard</h1>
        <DashboardStats />
        <h2 className="font-bold text-3xl mt-10">Last Alerts</h2>
        <DashboardLastAlerts />
      </div>
    </section>
  );
};
