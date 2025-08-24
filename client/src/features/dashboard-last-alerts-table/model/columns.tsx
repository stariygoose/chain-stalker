import { Button } from "@/shared/ui/button";
import { createColumnHelper } from "@tanstack/react-table";

export type Target = {
  name: string;
  status: boolean;
  lastTriggered: string;
  actions: "Manage";
};

const columnHelper = createColumnHelper<Target>();

export const columns = [
  columnHelper.accessor("name", {
    header: () => "Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("status", {
    header: () => "Status",
    cell: (info) => {
      const isActive = info.getValue();
      const bgColor = isActive ? "bg-secondary" : "bg-red-700";
      return (
        <span
          className={`block px-3 py-1 rounded-full font-semibold text-center text-sm ${bgColor}`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      );
    },
  }),
  columnHelper.accessor("lastTriggered", {
    header: () => "Last Triggered",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("actions", {
    header: () => "Action",
    cell: () => (
      <Button className="text-green-light font-bold hover:underline">
        Manage
      </Button>
    ),
  }),
];
