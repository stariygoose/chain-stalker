import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router/router";
import { Notification } from "@/features/notification";
import { useThemeInit } from "@/features/theme";

export default function App() {
  useThemeInit();

  return (
    <>
      <RouterProvider router={router} />
      <Notification />
    </>
  );
}
