import type { FC } from "react";
import { Outlet } from "react-router-dom";

import { Sidebar } from "@/widgets/sidebar";

export const DashboardLayout: FC = () => {
  return (
    <>
      <div className="grid md:grid-cols-[0.2fr_0.8fr] p-4 h-screen overflow-hidden">
        <div className="relative hidden md:block">
          <Sidebar />
        </div>
        <main className="overflow-y-scroll no-scrollbar">
          <Outlet />
        </main>
      </div>
    </>
  );
};
