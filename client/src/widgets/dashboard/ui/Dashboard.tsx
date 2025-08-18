import { DashboardStats, DashboardTable } from "@/features/dashboard";
import { HttpService } from "@/shared/lib/http.service";
import { useEffect } from "react";

export const DashboardWidget = () => {
  const httpService = new HttpService();

  useEffect(() => {
    httpService.get("/subscriptions").then((res) => console.log(res));
  }, []);

  return (
    <section className="flex w-full h-full">
      <div className="w-full">
        <h1 className="text-bold text-5xl mb-7">Dashboard</h1>
        <DashboardStats />

        <h2 className="font-bold text-3xl mt-10">Last Alerts</h2>
        <DashboardTable />
      </div>
    </section>
  );
};
