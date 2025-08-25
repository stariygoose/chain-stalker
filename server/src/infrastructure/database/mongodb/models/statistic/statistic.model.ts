import { model, Schema } from "mongoose";

interface IStatisticSchema {
  userId: number;
  totalSubscriptions: number;
  totalActiveSubscriptions: number;
  totalNotifications: number;
}

const StatisticSchema = new Schema<IStatisticSchema>(
  {
    userId: { type: Number, ref: "Users", required: true },
    totalSubscriptions: { type: Number, default: 0 },
    totalActiveSubscriptions: { type: Number, default: 0 },
    totalNotifications: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const StatisticModel = model("Statistics", StatisticSchema);
