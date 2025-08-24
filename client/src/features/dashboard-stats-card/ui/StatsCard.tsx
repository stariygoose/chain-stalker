import type { FC } from "react";

interface StatsCardProps {
  title: string;
  value: number;
  difference: number;
}

export const StatsCard: FC<StatsCardProps> = ({ title, value, difference }) => {
  const differenceStyle = difference > 0 ? "text-green-light" : "text-red";

  return (
    <div className="bg-secondary p-5 rounded-xl">
      <p className="text-base mb-3">{title}</p>
      <p className="font-bold text-2xl">{value}</p>
      <span className={differenceStyle}>
        {difference > 0 ? `+${difference}` : difference}%
      </span>
    </div>
  );
};
