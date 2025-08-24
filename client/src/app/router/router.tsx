import { createBrowserRouter } from "react-router-dom";

import {
  NotFoundPage,
  DashboardPage,
  HomePage,
  TelegramCallbackPage,
} from "@/pages/index";
import { DashboardLayout, HomeLayout } from "@/app/layouts";
import { AxiosProvider } from "@/app/providers";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AxiosProvider>
        <HomeLayout />
      </AxiosProvider>
    ),
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
    element: (
      <AxiosProvider>
        <DashboardLayout />
      </AxiosProvider>
    ),
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
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
