import { useTelegramCallback } from "@/features/auth";
import { useEffect } from "react";

export const TelegramCallbackPage = () => {
  const { handleCallback } = useTelegramCallback();
  useEffect(() => {
    handleCallback();
  }, []);
  return <div>Loading...</div>;
};
