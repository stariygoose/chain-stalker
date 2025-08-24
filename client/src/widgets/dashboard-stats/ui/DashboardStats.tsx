import { StatsCard } from "@/features/dashboard-stats-card";

interface Mock {
  title: string;
  value: number;
  difference: number;
}
const mock: Mock[] = [
  { title: "Total Subscriptions", value: 100, difference: 5 },
  { title: "Active Alerts", value: 50, difference: -10 },
  { title: "Notifications", value: 5000, difference: 5000 },
];

export const DashboardStats = () => {
  return (
    <div className="grid [grid-template-columns:repeat(auto-fit,minmax(200px,_1fr))] gap-4">
      {mock.map(({ title, value, difference }) => {
        return (
          <StatsCard
            key={title}
            title={title}
            value={value}
            difference={difference}
          />
        );
      })}
    </div>
  );
};
