import { DashboardLastAlertsTable } from "@/features/dashboard-last-alerts-table";

export const DashboardLastAlerts = () => {
  return (
    <div className="border rounded-lg mt-10 border-color overflow-hidden">
      <div className="w-full overflow-x-auto">
        <DashboardLastAlertsTable />
      </div>
    </div>
  );
};
