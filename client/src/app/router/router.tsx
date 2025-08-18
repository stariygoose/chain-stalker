import { createBrowserRouter } from "react-router-dom";

import { DashboardPage, HomePage } from "@/pages/index";
import { DashboardLayout } from "@/app/layouts";
import { HomeLayout } from "@/app/layouts";
import { TelegramCallbackPage } from "@/pages/telegram-callback/ui/TelegramCallbackPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
    // errorElement: <ErrorPage />
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
    ],
  },
  {
    path: "/telegram-callback",
    element: <TelegramCallbackPage />,
  },
]);
